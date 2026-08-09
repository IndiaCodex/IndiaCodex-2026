import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/db';
import crypto from 'crypto';
import QRCode from 'qrcode';

export const getCertificates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const certs = await prisma.certificate.findMany({
      where: { studentId: req.user!.id },
      include: { enrollment: { include: { course: true } } },
      orderBy: { issueDate: 'desc' },
    });
    return res.status(200).json({ certificates: certs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const verifyCertificate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assetId } = req.params;
    const cert = await prisma.certificate.findUnique({
      where: { assetId },
      include: {
        student: { select: { name: true, walletAddress: true } },
        enrollment: { include: { course: { include: { teacher: { select: { name: true } } } } } },
      },
    });

    if (!cert) return res.status(404).json({ error: 'Certificate not found' });

    return res.status(200).json({
      verified: cert.isMinted,
      certificate: {
        assetId: cert.assetId,
        tokenName: cert.tokenName,
        issueDate: cert.issueDate,
        type: cert.type,
        txHash: cert.nftTxHash,
        student: cert.student,
        course: (cert.enrollment as any).course?.title,
        institution: 'EduChain AI Academy',
        teacher: (cert.enrollment as any).course?.teacher?.name,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const mintCertificate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { enrollmentId } = req.body;
    if (!enrollmentId) return res.status(400).json({ error: 'enrollmentId required' });

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: true },
    });

    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
    if (enrollment.studentId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });
    if (enrollment.progress < 100) return res.status(400).json({ error: 'Course not completed yet' });
    if (enrollment.certificateId) return res.status(400).json({ error: 'Certificate already issued' });

    // Generate certificate metadata
    const tokenName = `EduCert${Date.now().toString(36).toUpperCase()}`;
    const mockPolicyId = crypto.randomBytes(28).toString('hex');
    const assetId = `${mockPolicyId}${Buffer.from(tokenName).toString('hex')}`;
    const mockTxHash = crypto.randomBytes(32).toString('hex');

    // Generate QR code for verification URL
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${assetId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl);

    const cert = await prisma.certificate.create({
      data: {
        enrollmentId,
        studentId: req.user!.id,
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
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const hashAssignment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { submissionId } = req.body;
    if (!submissionId) return res.status(400).json({ error: 'submissionId required' });

    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.studentId !== req.user!.id) return res.status(403).json({ error: 'Forbidden' });

    // Mock Cardano transaction hash for on-chain hash registration
    const mockTxHash = crypto.randomBytes(32).toString('hex');

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: { isVerifiedOnChain: true, txHash: mockTxHash },
    });

    return res.status(200).json({
      message: 'Assignment hash registered on Cardano',
      fileHash: submission.fileHash,
      txHash: mockTxHash,
      submission: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
