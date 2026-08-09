"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashAssignment = exports.mintCertificate = exports.verifyCertificate = exports.getCertificates = void 0;
const db_1 = __importDefault(require("../config/db"));
const crypto_1 = __importDefault(require("crypto"));
const qrcode_1 = __importDefault(require("qrcode"));
const getCertificates = async (req, res) => {
    try {
        const certs = await db_1.default.certificate.findMany({
            where: { studentId: req.user.id },
            include: { enrollment: { include: { course: true } } },
            orderBy: { issueDate: 'desc' },
        });
        return res.status(200).json({ certificates: certs });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getCertificates = getCertificates;
const verifyCertificate = async (req, res) => {
    try {
        const { assetId } = req.params;
        const cert = await db_1.default.certificate.findUnique({
            where: { assetId },
            include: {
                student: { select: { name: true, walletAddress: true } },
                enrollment: { include: { course: { include: { teacher: { select: { name: true } } } } } },
            },
        });
        if (!cert)
            return res.status(404).json({ error: 'Certificate not found' });
        return res.status(200).json({
            verified: cert.isMinted,
            certificate: {
                assetId: cert.assetId,
                tokenName: cert.tokenName,
                issueDate: cert.issueDate,
                type: cert.type,
                txHash: cert.nftTxHash,
                student: cert.student,
                course: cert.enrollment.course?.title,
                institution: 'EduChain AI Academy',
                teacher: cert.enrollment.course?.teacher?.name,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.verifyCertificate = verifyCertificate;
const mintCertificate = async (req, res) => {
    try {
        const { enrollmentId } = req.body;
        if (!enrollmentId)
            return res.status(400).json({ error: 'enrollmentId required' });
        const enrollment = await db_1.default.enrollment.findUnique({
            where: { id: enrollmentId },
            include: { course: true },
        });
        if (!enrollment)
            return res.status(404).json({ error: 'Enrollment not found' });
        if (enrollment.studentId !== req.user.id)
            return res.status(403).json({ error: 'Forbidden' });
        if (enrollment.progress < 100)
            return res.status(400).json({ error: 'Course not completed yet' });
        if (enrollment.certificateId)
            return res.status(400).json({ error: 'Certificate already issued' });
        // Generate certificate metadata
        const tokenName = `EduCert${Date.now().toString(36).toUpperCase()}`;
        const mockPolicyId = crypto_1.default.randomBytes(28).toString('hex');
        const assetId = `${mockPolicyId}${Buffer.from(tokenName).toString('hex')}`;
        const mockTxHash = crypto_1.default.randomBytes(32).toString('hex');
        // Generate QR code for verification URL
        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${assetId}`;
        const qrCodeDataUrl = await qrcode_1.default.toDataURL(verifyUrl);
        const cert = await db_1.default.certificate.create({
            data: {
                enrollmentId,
                studentId: req.user.id,
                type: 'COURSE_COMPLETION',
                tokenName,
                assetId,
                nftTxHash: mockTxHash,
                isMinted: true, // In production, this becomes true after on-chain confirmation
                qrCodeUrl: qrCodeDataUrl,
                metadataUri: `ipfs://QmMock${mockTxHash.substring(0, 20)}`,
            },
        });
        return res.status(201).json({ certificate: cert, verifyUrl });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.mintCertificate = mintCertificate;
const hashAssignment = async (req, res) => {
    try {
        const { submissionId } = req.body;
        if (!submissionId)
            return res.status(400).json({ error: 'submissionId required' });
        const submission = await db_1.default.submission.findUnique({ where: { id: submissionId } });
        if (!submission)
            return res.status(404).json({ error: 'Submission not found' });
        if (submission.studentId !== req.user.id)
            return res.status(403).json({ error: 'Forbidden' });
        // Mock Cardano transaction hash for on-chain hash registration
        const mockTxHash = crypto_1.default.randomBytes(32).toString('hex');
        const updated = await db_1.default.submission.update({
            where: { id: submissionId },
            data: { isVerifiedOnChain: true, txHash: mockTxHash },
        });
        return res.status(200).json({
            message: 'Assignment hash registered on Cardano',
            fileHash: submission.fileHash,
            txHash: mockTxHash,
            submission: updated,
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.hashAssignment = hashAssignment;
