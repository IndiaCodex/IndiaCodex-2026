"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletLogin = exports.walletChallenge = exports.googleLogin = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../config/db"));
const redis_1 = __importDefault(require("../config/redis"));
const lucid_1 = require("@lucid-evolution/lucid");
const client_1 = require("@prisma/client");
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwteduchainkey12345!';
const JWT_EXPIRES_IN = '24h';
// Generates JWT token for the user
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, walletAddress: user.walletAddress }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
const register = async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        const existingUser = await db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const selectedRole = Object.values(client_1.UserRole).includes(role) ? role : client_1.UserRole.STUDENT;
        // Create user and profile in transaction
        const user = await db_1.default.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                    name,
                    role: selectedRole,
                },
            });
            await tx.profile.create({
                data: {
                    userId: newUser.id,
                    skills: [],
                },
            });
            await tx.rewardWallet.create({
                data: {
                    userId: newUser.id,
                    xp: 0,
                    coins: 0,
                },
            });
            return newUser;
        });
        const token = generateToken(user);
        return res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal server error during registration' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = generateToken(user);
        return res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                walletAddress: user.walletAddress,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error during login' });
    }
};
exports.login = login;
const googleLogin = async (req, res) => {
    try {
        const { idToken, role } = req.body;
        if (!idToken) {
            return res.status(400).json({ error: 'Google ID token is required' });
        }
        // Verify Google ID Token
        const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (!verifyResponse.ok) {
            return res.status(400).json({ error: 'Failed to verify Google ID token' });
        }
        const payload = await verifyResponse.json();
        if (payload.error) {
            return res.status(400).json({ error: 'Invalid Google ID token' });
        }
        const email = payload.email;
        const name = payload.name || email.split('@')[0];
        const googleId = payload.sub;
        let user = await db_1.default.user.findFirst({
            where: {
                OR: [
                    { googleId },
                    { email }
                ]
            }
        });
        if (!user) {
            const selectedRole = Object.values(client_1.UserRole).includes(role) ? role : client_1.UserRole.STUDENT;
            user = await db_1.default.$transaction(async (tx) => {
                const newUser = await tx.user.create({
                    data: {
                        email,
                        name,
                        googleId,
                        role: selectedRole,
                    },
                });
                await tx.profile.create({
                    data: {
                        userId: newUser.id,
                        avatarUrl: payload.picture || null,
                        skills: [],
                    },
                });
                await tx.rewardWallet.create({
                    data: {
                        userId: newUser.id,
                        xp: 0,
                        coins: 0,
                    },
                });
                return newUser;
            });
        }
        else if (!user.googleId) {
            // Link Google Account to existing Email signup
            user = await db_1.default.user.update({
                where: { id: user.id },
                data: { googleId },
            });
        }
        const token = generateToken(user);
        return res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                walletAddress: user.walletAddress,
            },
        });
    }
    catch (error) {
        console.error('Google login error:', error);
        return res.status(500).json({ error: 'Internal server error during Google OAuth login' });
    }
};
exports.googleLogin = googleLogin;
const walletChallenge = async (req, res) => {
    try {
        const { address } = req.body;
        if (!address) {
            return res.status(400).json({ error: 'Cardano wallet address is required' });
        }
        // Generate a random cryptographic challenge
        const challenge = crypto_1.default.randomBytes(32).toString('hex');
        const challengeKey = `wallet_challenge:${address.toLowerCase()}`;
        // Store challenge in Redis for 5 minutes
        await redis_1.default.set(challengeKey, challenge, 'EX', 300);
        return res.status(200).json({ challenge });
    }
    catch (error) {
        console.error('Wallet challenge error:', error);
        return res.status(500).json({ error: 'Internal server error generating wallet challenge' });
    }
};
exports.walletChallenge = walletChallenge;
const walletLogin = async (req, res) => {
    try {
        const { address, signature, key, role } = req.body;
        if (!address || !signature || !key) {
            return res.status(400).json({ error: 'Cardano address, signature, and public key are required' });
        }
        const challengeKey = `wallet_challenge:${address.toLowerCase()}`;
        const storedChallenge = await redis_1.default.get(challengeKey);
        if (!storedChallenge) {
            return res.status(400).json({ error: 'Challenge expired or invalid. Please request a new one.' });
        }
        // Verify Cardano CIP-30 message signature
        let isSignatureValid = false;
        let bech32Address = '';
        try {
            const details = (0, lucid_1.getAddressDetails)(address);
            const keyHash = details.paymentCredential?.hash || details.stakeCredential?.hash;
            if (!keyHash) {
                return res.status(400).json({ error: 'Invalid Cardano address credentials' });
            }
            // Convert stored challenge to hex representation
            const challengeHex = Buffer.from(storedChallenge).toString('hex');
            // Verify signature in Lucid Evolution
            isSignatureValid = (0, lucid_1.verifyData)(address, keyHash, challengeHex, { signature, key });
            // Convert hex address to Bech32 for DB storage consistency
            bech32Address = (0, lucid_1.addressFromHexOrBech32)(address);
        }
        catch (verifErr) {
            console.error('Lucid verifyData throw:', verifErr);
            return res.status(400).json({ error: 'Invalid address or signature formatting' });
        }
        if (!isSignatureValid) {
            return res.status(401).json({ error: 'Cryptographic signature verification failed' });
        }
        // Success, delete challenge from Redis
        await redis_1.default.del(challengeKey);
        // Find or create User linked to this Cardano wallet address (using Bech32 representation)
        let user = await db_1.default.user.findUnique({
            where: { walletAddress: bech32Address }
        });
        if (!user) {
            const selectedRole = Object.values(client_1.UserRole).includes(role) ? role : client_1.UserRole.STUDENT;
            const placeholderEmail = `wallet-${bech32Address.substring(0, 15)}@educhain.ai`;
            user = await db_1.default.$transaction(async (tx) => {
                const newUser = await tx.user.create({
                    data: {
                        email: placeholderEmail,
                        name: `Cardano User ${bech32Address.substring(0, 8)}`,
                        walletAddress: bech32Address,
                        role: selectedRole,
                    },
                });
                await tx.profile.create({
                    data: {
                        userId: newUser.id,
                        skills: [],
                    },
                });
                await tx.wallet.create({
                    data: {
                        userId: newUser.id,
                        address: bech32Address,
                        walletType: 'CIP-30',
                        isVerified: true,
                    },
                });
                await tx.rewardWallet.create({
                    data: {
                        userId: newUser.id,
                        xp: 0,
                        coins: 0,
                    },
                });
                return newUser;
            });
        }
        const token = generateToken(user);
        return res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                walletAddress: user.walletAddress,
            },
        });
    }
    catch (error) {
        console.error('Wallet login error:', error);
        return res.status(500).json({ error: 'Internal server error during wallet authentication' });
    }
};
exports.walletLogin = walletLogin;
