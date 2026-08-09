"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeacherAnalytics = exports.addLesson = exports.publishCourse = exports.createCourse = void 0;
const db_1 = __importDefault(require("../config/db"));
const createCourse = async (req, res) => {
    try {
        const { title, description, price, coverImage } = req.body;
        if (!title || !description)
            return res.status(400).json({ error: 'title and description required' });
        const course = await db_1.default.course.create({
            data: { title, description, price: price || 0, coverImage, teacherId: req.user.id },
        });
        return res.status(201).json({ course });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.createCourse = createCourse;
const publishCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const course = await db_1.default.course.findUnique({ where: { id: courseId } });
        if (!course || course.teacherId !== req.user.id)
            return res.status(403).json({ error: 'Forbidden' });
        const updated = await db_1.default.course.update({ where: { id: courseId }, data: { isPublished: true } });
        return res.status(200).json({ course: updated });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.publishCourse = publishCourse;
const addLesson = async (req, res) => {
    try {
        const { courseId, title, content, videoUrl, duration } = req.body;
        if (!courseId || !title || !content)
            return res.status(400).json({ error: 'courseId, title, content required' });
        const course = await db_1.default.course.findUnique({ where: { id: courseId } });
        if (!course || course.teacherId !== req.user.id)
            return res.status(403).json({ error: 'Forbidden' });
        const count = await db_1.default.lesson.count({ where: { courseId } });
        const lesson = await db_1.default.lesson.create({
            data: { courseId, title, content, videoUrl, duration: duration || 0, orderIndex: count + 1 },
        });
        return res.status(201).json({ lesson });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.addLesson = addLesson;
const getTeacherAnalytics = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const courses = await db_1.default.course.findMany({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getTeacherAnalytics = getTeacherAnalytics;
