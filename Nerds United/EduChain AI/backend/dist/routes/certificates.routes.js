"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const certificates_controller_1 = require("../controllers/certificates.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/verify/:assetId', certificates_controller_1.verifyCertificate); // Public verify endpoint
router.use(auth_1.authenticateJWT);
router.get('/', certificates_controller_1.getCertificates);
router.post('/mint', certificates_controller_1.mintCertificate);
router.post('/hash-assignment', certificates_controller_1.hashAssignment);
exports.default = router;
