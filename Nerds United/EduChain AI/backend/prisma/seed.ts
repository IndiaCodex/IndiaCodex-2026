import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Achievements
  const achievementsList = [
    {
      title: 'First Step',
      description: 'Create your EduChain AI account',
      badgeUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
      xpReward: 50,
      coinReward: 10,
      type: 'STARTER',
    },
    {
      title: 'Code Wizard',
      description: 'Complete 5 exercises in the Coding Playground',
      badgeUrl: 'https://cdn-icons-png.flaticon.com/512/2824/2824445.png',
      xpReward: 200,
      coinReward: 50,
      type: 'CODE_WIZARD',
    },
    {
      title: 'Master Mind',
      description: 'Get a perfect score on any Quiz',
      badgeUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135706.png',
      xpReward: 150,
      coinReward: 30,
      type: 'MASTER_MIND',
    },
    {
      title: 'Streak Master',
      description: 'Maintain a 7-day study streak',
      badgeUrl: 'https://cdn-icons-png.flaticon.com/512/3094/3094901.png',
      xpReward: 300,
      coinReward: 75,
      type: 'STREAK',
    },
  ];

  for (const ach of achievementsList) {
    await prisma.achievement.upsert({
      where: { title: ach.title },
      update: ach,
      create: ach,
    });
  }
  console.log('Achievements seeded.');

  // 2. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  // Student Account
  const student = await prisma.user.upsert({
    where: { email: 'student@educhain.ai' },
    update: {},
    create: {
      email: 'student@educhain.ai',
      passwordHash,
      name: 'Alex Student',
      role: UserRole.STUDENT,
      profile: {
        create: {
          bio: 'Aspiring Blockchain Developer and AI enthusiast.',
          skills: ['JavaScript', 'React', 'Python'],
          schoolName: 'Decentralized Academy',
        },
      },
      rewardWallet: {
        create: {
          xp: 120,
          coins: 20,
          streakCount: 3,
        },
      },
    },
  });

  // Teacher Account
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@educhain.ai' },
    update: {},
    create: {
      email: 'teacher@educhain.ai',
      passwordHash,
      name: 'Dr. Cardano',
      role: UserRole.TEACHER,
      profile: {
        create: {
          bio: 'Plutus and Aiken Pioneer. Teaching Decentralized Apps since 2018.',
          skills: ['Haskell', 'Aiken', 'Plutus', 'Rust'],
          rating: 4.9,
        },
      },
      rewardWallet: {
        create: {
          xp: 500,
          coins: 100,
        },
      },
    },
  });

  // Employer Account
  await prisma.user.upsert({
    where: { email: 'employer@educhain.ai' },
    update: {},
    create: {
      email: 'employer@educhain.ai',
      passwordHash,
      name: 'Web3 Ventures',
      role: UserRole.EMPLOYER,
      profile: {
        create: {
          bio: 'Leading global venture fund and developer recruiter.',
          companyName: 'Web3 Capital Group',
        },
      },
      rewardWallet: {
        create: {
          xp: 0,
          coins: 0,
        },
      },
    },
  });

  console.log('Users seeded.');

  // 3. Create starter Course & Lessons
  const course = await prisma.course.create({
    data: {
      title: 'Introduction to Cardano Blockchain & Aiken Contracts',
      description: 'Learn the fundamentals of Cardano UTxO model, mint certificate NFTs, and write Aiken smart contracts from scratch.',
      coverImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0',
      price: 19.99,
      teacherId: teacher.id,
      isPublished: true,
      lessons: {
        create: [
          {
            title: 'Welcome to Cardano: The eUTxO Model',
            content: 'In this lesson, we explore how Cardano represents state using Extended Unspent Transaction Outputs (eUTxO). We compare it with Ethereum account model and discuss local state advantages.',
            orderIndex: 1,
            duration: 15,
          },
          {
            title: 'Setting up the Aiken CLI and Compiler',
            content: 'We install the Aiken compiler using asdf or cargo. Then we learn how to verify validator types and run aiken check tests.',
            orderIndex: 2,
            duration: 20,
          },
          {
            title: 'Writing your First Minting Policy',
            content: 'We write a validator that controls token minting. We review redeemer parameters and script contexts to verify certificate integrity.',
            orderIndex: 3,
            duration: 30,
          },
        ],
      },
    },
    include: {
      lessons: true,
    },
  });

  console.log(`Starter course created: ${course.title} with ${course.lessons.length} lessons.`);
  console.log('Database seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
