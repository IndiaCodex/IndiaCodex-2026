"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitReview = exports.updateProgress = exports.enrollCourse = exports.getCourse = exports.listCourses = void 0;
const db_1 = __importDefault(require("../config/db"));
const listCourses = async (req, res) => {
    try {
        const { search, page = '1', limit = '12' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {
            isPublished: true,
            ...(search ? { OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ] } : {}),
        };
        const [courses, total] = await Promise.all([
            db_1.default.course.findMany({
                where,
                include: {
                    teacher: { select: { name: true, profile: { select: { avatarUrl: true, rating: true } } } },
                    _count: { select: { enrollments: true, lessons: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            db_1.default.course.count({ where }),
        ]);
        return res.status(200).json({ courses, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.listCourses = listCourses;
const getCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await db_1.default.course.findUnique({
            where: { id },
            include: {
                teacher: { select: { name: true, profile: { select: { avatarUrl: true, bio: true, rating: true } } } },
                lessons: { orderBy: { orderIndex: 'asc' } },
                reviews: { include: { student: { select: { name: true } } }, take: 10 },
                _count: { select: { enrollments: true } },
            },
        });
        if (!course)
            return res.status(404).json({ error: 'Course not found' });
        // Check enrollment status
        let enrollment = null;
        if (req.user) {
            enrollment = await db_1.default.enrollment.findFirst({
                where: { studentId: req.user.id, courseId: id },
            });
        }
        return res.status(200).json({ course, enrollment });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getCourse = getCourse;
const enrollCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        if (!courseId)
            return res.status(400).json({ error: 'courseId required' });
        const existing = await db_1.default.enrollment.findFirst({
            where: { studentId: req.user.id, courseId },
        });
        if (existing)
            return res.status(400).json({ error: 'Already enrolled' });
        const enrollment = await db_1.default.enrollment.create({
            data: { studentId: req.user.id, courseId },
        });
        return res.status(201).json({ enrollment });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.enrollCourse = enrollCourse;
const updateProgress = async (req, res) => {
    try {
        const { enrollmentId, progress } = req.body;
        if (!enrollmentId || progress === undefined)
            return res.status(400).json({ error: 'enrollmentId and progress required' });
        const enrollment = await db_1.default.enrollment.update({
            where: { id: enrollmentId },
            data: {
                progress,
                ...(progress >= 100 ? { completedAt: new Date() } : {}),
            },
        });
        return res.status(200).json({ enrollment });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.updateProgress = updateProgress;
const submitReview = async (req, res) => {
    try {
        const { courseId, rating, comment } = req.body;
        if (!courseId || !rating)
            return res.status(400).json({ error: 'courseId and rating required' });
        const review = await db_1.default.review.create({
            data: { courseId, studentId: req.user.id, rating: parseInt(rating), comment },
        });
        return res.status(201).json({ review });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.submitReview = submitReview;
