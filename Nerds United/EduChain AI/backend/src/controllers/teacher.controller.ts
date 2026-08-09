import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/db';

export const createCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, price, coverImage } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'title and description required' });

    const course = await prisma.course.create({
      data: { title, description, price: price || 0, coverImage, teacherId: req.user!.id },
    });
    return res.status(201).json({ course });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const publishCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.body;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.teacherId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });

    const updated = await prisma.course.update({ where: { id: courseId }, data: { isPublished: true } });
    return res.status(200).json({ course: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const addLesson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, title, content, videoUrl, duration } = req.body;
    if (!courseId || !title || !content) return res.status(400).json({ error: 'courseId, title, content required' });

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.teacherId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });

    const count = await prisma.lesson.count({ where: { courseId } });
    const lesson = await prisma.lesson.create({
      data: { courseId, title, content, videoUrl, duration: duration || 0, orderIndex: count + 1 },
    });
    return res.status(201).json({ lesson });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getTeacherAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teacherId = req.user!.id;
    const courses = await prisma.course.findMany({
      where: { teacherId },
      include: {
        _count: { select: { enrollments: true } },
        enrollments: { select: { progress: true } },
      },
    });

    return res.status(200).json({
      totalCourses: courses.length,
      publishedCourses: courses.filter((c) => c.isPublished).length,
      totalStudents: courses.reduce((acc, c) => acc + c._count.enrollments, 0),
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        isPublished: c.isPublished,
        enrollments: c._count.enrollments,
        avgProgress: c.enrollments.length
          ? Math.round(c.enrollments.reduce((acc, e) => acc + e.progress, 0) / c.enrollments.length)
          : 0,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
