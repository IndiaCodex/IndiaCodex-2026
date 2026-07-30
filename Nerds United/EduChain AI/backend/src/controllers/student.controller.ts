import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/db';

export const getDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    // Fetch student profile, wallet, and achievements
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        rewardWallet: true,
        weakTopics: {
          orderBy: { confidenceScore: 'asc' },
          take: 3,
        },
        enrollments: {
          include: {
            course: {
              include: {
                teacher: {
                  select: { name: true }
                }
              }
            }
          },
          take: 3,
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Default target: 60 minutes (3600 seconds)
    const dailyTargetSeconds = 3600;
    
    // Fetch today's study sessions to compute completed time
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const studySessionsToday = await prisma.studySession.findMany({
      where: {
        studentId,
        startTime: { gte: today },
      },
    });

    const secondsStudiedToday = studySessionsToday.reduce(
      (acc, session) => acc + (session.durationSeconds || 0),
      0
    );

    // AI Motivational quotes pool
    const quotes = [
      'Consistency is the key to mastering decentralized applications. Keep coding!',
      'Great job! Small study slots build deep blockchain understanding.',
      'The eUTxO ledger model rewards precise logic. Keep refining your skills!',
      'Your learning streak is growing! You are outperforming 85% of other Web3 students today.',
      'Step by step, block by block, you are building your future academic portfolio.',
    ];
    const motivationalQuote = quotes[Math.floor(Math.random() * quotes.length)];

    // Generate dynamic AI suggestions based on weak areas
    const aiSuggestions = [];
    if (student.weakTopics.length > 0) {
      for (const topic of student.weakTopics) {
        if (topic.confidenceScore < 0.5) {
          aiSuggestions.push({
            title: `Strengthen ${topic.topicName}`,
            description: `We noticed you have lower confidence in ${topic.topicName}. Let's spend 10 minutes reviewing its core guidelines.`,
            type: 'REVIEW',
          });
        }
      }
    } else {
      aiSuggestions.push({
        title: 'Begin a new module',
        description: 'Explore the setting up of Aiken smart contracts compiler to start writing validators.',
        type: 'NEW_COURSE',
      });
    }

    // If target is met
    if (secondsStudiedToday >= dailyTargetSeconds) {
      aiSuggestions.push({
        title: 'Daily Goal Achieved!',
        description: 'Excellent dedication! You have successfully completed your study target for today.',
        type: 'GOAL_MET',
      });
    }

    return res.status(200).json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        walletAddress: student.walletAddress,
        rewardWallet: student.rewardWallet,
      },
      dashboard: {
        todayGoal: {
          title: 'Daily Study Target',
          targetSeconds: dailyTargetSeconds,
          studiedSeconds: secondsStudiedToday,
          completedPercent: Math.min(Math.round((secondsStudiedToday / dailyTargetSeconds) * 100), 100),
        },
        recentCourses: student.enrollments.map((e) => ({
          id: e.course.id,
          title: e.course.title,
          progress: e.progress,
          teacherName: e.course.teacher.name,
        })),
        weakTopics: student.weakTopics.map((wt) => ({
          id: wt.id,
          name: wt.topicName,
          confidence: Math.round(wt.confidenceScore * 100),
        })),
        aiSuggestions,
        motivationalQuote,
        upcomingExams: [
          {
            title: 'Cardano eUTxO Architecture Assessment',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days later
            priority: 'HIGH',
          },
        ],
      },
    });
  } catch (error: any) {
    console.error('Fetch student dashboard error:', error);
    return res.status(500).json({ error: 'Internal server error fetching dashboard data' });
  }
};

export const startStudySession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { courseId } = req.body;

    if (!studentId) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    const session = await prisma.studySession.create({
      data: {
        studentId,
        courseId: courseId || null,
        startTime: new Date(),
      },
    });

    return res.status(201).json({ sessionId: session.id, startTime: session.startTime });
  } catch (error: any) {
    console.error('Start study session error:', error);
    return res.status(500).json({ error: 'Internal server error starting study session' });
  }
};

export const endStudySession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { sessionId } = req.body;

    if (!studentId || !sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await prisma.studySession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.studentId !== studentId || session.endTime) {
      return res.status(404).json({ error: 'Valid active study session not found' });
    }

    const endTime = new Date();
    const durationSeconds = Math.max(
      Math.round((endTime.getTime() - session.startTime.getTime()) / 1000),
      1
    );

    // Calculate rewards: 1 XP per 30 seconds of study. 1 Coin per 2 minutes.
    const xpEarned = Math.max(Math.floor(durationSeconds / 30), 1);
    const coinsEarned = Math.floor(durationSeconds / 120);

    // Update session record
    const updatedSession = await prisma.studySession.update({
      where: { id: sessionId },
      data: {
        endTime,
        durationSeconds,
      },
    });

    // Update user rewards wallet and learning streaks
    const updatedWallet = await prisma.$transaction(async (tx) => {
      const wallet = await tx.rewardWallet.findUnique({
        where: { userId: studentId },
      });

      if (!wallet) return null;

      // Update streaks logic
      const now = new Date();
      const lastActive = new Date(wallet.lastActiveDate);
      let newStreak = wallet.streakCount;

      const diffTime = Math.abs(now.getTime() - lastActive.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Active yesterday, increment streak
        newStreak += 1;
      } else if (diffDays > 1) {
        // Missed a day, reset to 1
        newStreak = 1;
      } else if (newStreak === 0) {
        newStreak = 1;
      }

      return tx.rewardWallet.update({
        where: { userId: studentId },
        data: {
          xp: wallet.xp + xpEarned,
          coins: wallet.coins + coinsEarned,
          streakCount: newStreak,
          lastActiveDate: now,
        },
      });
    });

    return res.status(200).json({
      session: updatedSession,
      rewards: {
        xpEarned,
        coinsEarned,
        totalXp: updatedWallet?.xp || 0,
        totalCoins: updatedWallet?.coins || 0,
        streakCount: updatedWallet?.streakCount || 0,
      },
    });
  } catch (error: any) {
    console.error('End study session error:', error);
    return res.status(500).json({ error: 'Internal server error ending study session' });
  }
};
