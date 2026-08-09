import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/db';

export const listCourses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, page = '1', limit = '12' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where = {
      isPublished: true,
      ...(search ? { OR: [
        { title: { contains: search as string, mode: 'insensitive' as const } },
        { description: { contains: search as string, mode: 'insensitive' as const } },
      ]} : {}),
    };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          teacher: { select: { name: true, profile: { select: { avatarUrl: true, rating: true } } } },
          _count: { select: { enrollments: true, lessons: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.course.count({ where }),
    ]);

    return res.status(200).json({ courses, total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: { select: { name: true, profile: { select: { avatarUrl: true, bio: true, rating: true } } } },
        lessons: { orderBy: { orderIndex: 'asc' } },
        reviews: { include: { student: { select: { name: true } } }, take: 10 },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Check enrollment status
    let enrollment = null;
    if (req.user) {
      enrollment = await prisma.enrollment.findFirst({
        where: { studentId: req.user.id, courseId: id },
      });
    }

    return res.status(200).json({ course, enrollment });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const enrollCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ error: 'courseId required' });

    const existing = await prisma.enrollment.findFirst({
      where: { studentId: req.user!.id, courseId },
    });
    if (existing) return res.status(400).json({ error: 'Already enrolled' });

    const enrollment = await prisma.enrollment.create({
      data: { studentId: req.user!.id, courseId },
    });

    return res.status(201).json({ enrollment });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { enrollmentId, progress } = req.body;
    if (!enrollmentId || progress === undefined) return res.status(400).json({ error: 'enrollmentId and progress required' });

    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progress,
        ...(progress >= 100 ? { completedAt: new Date() } : {}),
      },
    });

    return res.status(200).json({ enrollment });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const submitReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, rating, comment } = req.body;
    if (!courseId || !rating) return res.status(400).json({ error: 'courseId and rating required' });

    const review = await prisma.review.create({
      data: { courseId, studentId: req.user!.id, rating: parseInt(rating), comment },
    });

    return res.status(201).json({ review });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
