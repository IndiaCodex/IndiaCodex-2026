"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRole = exports.listUsers = exports.getSystemStats = void 0;
const db_1 = __importDefault(require("../config/db"));
const getSystemStats = async (req, res) => {
    try {
        const [users, courses, enrollments, certificates, sessions] = await Promise.all([
            db_1.default.user.count(),
            db_1.default.course.count(),
            db_1.default.enrollment.count(),
            db_1.default.certificate.count(),
            db_1.default.studySession.count(),
        ]);
        const roleBreakdown = await db_1.default.user.groupBy({ by: ['role'], _count: true });
        return res.status(200).json({
            stats: { users, courses, enrollments, certificates, sessions },
            roleBreakdown: roleBreakdown.reduce((acc, r) => { acc[r.role] = r._count; return acc; }, {}),
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getSystemStats = getSystemStats;
const listUsers = async (req, res) => {
    try {
        const { page = '1', limit = '20', role } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = role ? { role: role } : {};
        const [users, total] = await Promise.all([
            db_1.default.user.findMany({
                where,
                select: { id: true, name: true, email: true, role: true, walletAddress: true, createdAt: true },
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
            }),
            db_1.default.user.count({ where }),
        ]);
        return res.status(200).json({ users, total, page: parseInt(page) });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.listUsers = listUsers;
const updateUserRole = async (req, res) => {
    try {
        const { userId, role } = req.body;
        if (!userId || !role)
            return res.status(400).json({ error: 'userId and role required' });
        const user = await db_1.default.user.update({ where: { id: userId }, data: { role } });
        return res.status(200).json({ user: { id: user.id, role: user.role } });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.updateUserRole = updateUserRole;
