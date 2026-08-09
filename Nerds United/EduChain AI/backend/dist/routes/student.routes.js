"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_controller_1 = require("../controllers/student.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Secure all student routes with JWT verification
router.use(auth_1.authenticateJWT);
router.get('/dashboard', student_controller_1.getDashboard);
router.post('/study-session/start', student_controller_1.startStudySession);
router.post('/study-session/end', student_controller_1.endStudySession);
exports.default = router;
