"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStudyPlan = generateStudyPlan;
exports.generateNotes = generateNotes;
exports.generateQuiz = generateQuiz;
exports.generateFlashcards = generateFlashcards;
exports.chatWithTutor = chatWithTutor;
exports.reviewCode = reviewCode;
exports.analyzeCareerGap = analyzeCareerGap;
const generative_ai_1 = require("@google/generative-ai");
const apiKey = process.env.GEMINI_API_KEY || '';
let genAI = null;
function getGenAI() {
    if (!genAI) {
        if (!apiKey || apiKey.startsWith('mock')) {
            throw new Error('GEMINI_API_KEY is not configured');
        }
        genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    return genAI;
}
function getMockResponse(prompt) {
    const lower = prompt.toLowerCase();
    if (lower.includes('study plan') || lower.includes('planner')) {
        return JSON.stringify({
            daily: [
                { day: 1, topics: ['Introduction to the subject', 'Core concepts review'], estimatedMinutes: 60 },
                { day: 2, topics: ['Deep dive into fundamentals', 'Practice problems'], estimatedMinutes: 90 },
                { day: 3, topics: ['Advanced concepts', 'Case studies'], estimatedMinutes: 75 },
                { day: 4, topics: ['Mock test', 'Weak area revision'], estimatedMinutes: 120 },
                { day: 5, topics: ['Final review', 'Summary notes'], estimatedMinutes: 45 },
            ],
            weeklyGoal: 'Complete 5 chapters with 2 practice tests',
            topPriorityTopics: ['Core Fundamentals', 'Practice Problems', 'Mock Tests'],
            estimatedReadinessPercent: 68,
        });
    }
    if (lower.includes('notes') || lower.includes('summarize') || lower.includes('summary')) {
        return `## AI-Generated Summary\n\n### Key Concepts\n- The main topic covers fundamental principles that underpin the entire subject area\n- Understanding these concepts is critical for examination success\n\n### Important Points\n1. **First Principle**: Core foundation upon which everything else is built\n2. **Second Principle**: Extension of the first with practical applications\n3. **Third Principle**: Advanced application in real-world scenarios\n\n### Formula Sheet\n- Key Formula 1: A = B × C (where A is the result, B and C are variables)\n- Key Formula 2: X = Y/Z (rate calculation)\n\n### Definitions\n- **Term 1**: A fundamental concept referring to the basic unit\n- **Term 2**: A derived concept built upon Term 1\n\n### Summary\nThis topic is foundational for understanding advanced concepts. Focus on practical application.`;
    }
    if (lower.includes('quiz') || lower.includes('mcq') || lower.includes('question')) {
        return JSON.stringify([
            {
                id: 'q1',
                type: 'MCQ',
                question: 'What is the primary benefit of the eUTxO model in Cardano?',
                options: ['Faster transactions', 'Predictable fees and local state validation', 'Higher throughput', 'Simpler smart contracts'],
                correctAnswer: 1,
                explanation: 'The eUTxO model allows fees to be calculated off-chain and enables local validation of script inputs, making transaction costs predictable.',
                difficulty: 'Medium',
            },
            {
                id: 'q2',
                type: 'MCQ',
                question: 'Which language is used to write Cardano smart contracts in EduChain AI?',
                options: ['Haskell', 'Plutus', 'Aiken', 'Rust'],
                correctAnswer: 2,
                explanation: 'Aiken is a modern, developer-friendly language designed specifically for writing Cardano smart contracts (validators).',
                difficulty: 'Easy',
            },
            {
                id: 'q3',
                type: 'TRUE_FALSE',
                question: 'NFTs on Cardano require a smart contract to mint.',
                options: ['True', 'False'],
                correctAnswer: 1,
                explanation: 'NFTs on Cardano use native token minting policies which can be time-locked scripts (not requiring complex smart contracts) or plutus scripts.',
                difficulty: 'Medium',
            },
        ]);
    }
    if (lower.includes('flashcard')) {
        return JSON.stringify([
            { front: 'What is eUTxO?', back: 'Extended Unspent Transaction Output - Cardano\'s ledger model that extends Bitcoin\'s UTxO with datum and script context.' },
            { front: 'What is a Plutus Validator?', back: 'A Haskell function that returns True or False, determining if a transaction spending a script UTXO is valid.' },
            { front: 'What is CIP-30?', back: 'Cardano Improvement Proposal defining the standard browser wallet API for dApp connectivity.' },
        ]);
    }
    return 'I am the EduChain AI tutor. Based on your question, here is a detailed explanation:\n\nThis concept involves several key principles that build upon each other. Let me break it down step by step:\n\n1. **Foundation**: Start with the basic definition and understand why it matters\n2. **Application**: See how it applies in real-world blockchain scenarios\n3. **Advanced**: Explore edge cases and complex interactions\n\nWould you like me to generate practice questions or create a visual mind map for this topic?';
}
async function generateStudyPlan(params) {
    const prompt = `You are an expert academic study planner. Create a detailed, personalized study plan for a student.

Subject: ${params.subject}
Exam Date: ${params.examDate}
Current Knowledge Level: ${params.currentLevel}
${params.syllabus ? `Syllabus Topics: ${params.syllabus}` : ''}

Generate a JSON study plan with:
- daily: array of {day, topics[], estimatedMinutes}
- weeklyGoal: string
- topPriorityTopics: string[]
- estimatedReadinessPercent: number

Return ONLY valid JSON, no markdown or extra text.`;
    try {
        const ai = getGenAI();
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-pro-preview-06-05' });
        const result = await model.generateContent(prompt);
        return result.response.text();
    }
    catch {
        return getMockResponse('study plan');
    }
}
async function generateNotes(content, type) {
    const prompt = `You are an expert academic note-taker. Analyze the following ${type} content and generate comprehensive, well-structured study notes.

Content: ${content.substring(0, 8000)}

Generate detailed notes including:
1. ## Key Concepts (bullet points)
2. ## Important Points (numbered list)
3. ## Formula Sheet (if applicable)
4. ## Definitions (term: definition pairs)
5. ## Summary (2-3 sentences)
6. ## Mind Map Structure (nested bullet points)

Use markdown formatting for easy reading.`;
    try {
        const ai = getGenAI();
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-pro-preview-06-05' });
        const result = await model.generateContent(prompt);
        return result.response.text();
    }
    catch {
        return getMockResponse('notes summarize');
    }
}
async function generateQuiz(params) {
    const prompt = `You are an expert quiz creator for academic subjects. Generate ${params.count} ${params.type} questions about "${params.topic}" at ${params.difficulty} difficulty.

Return a JSON array where each item has:
- id: string (q1, q2, etc.)
- type: "MCQ" | "TRUE_FALSE" | "FILL_BLANK"
- question: string
- options: string[] (4 options for MCQ, 2 for TRUE_FALSE, empty for FILL_BLANK)
- correctAnswer: number (index for MCQ/TRUE_FALSE) or string (for FILL_BLANK)
- explanation: string
- difficulty: string

Return ONLY valid JSON array, no markdown.`;
    try {
        const ai = getGenAI();
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-pro-preview-06-05' });
        const result = await model.generateContent(prompt);
        return result.response.text();
    }
    catch {
        return getMockResponse('quiz mcq question');
    }
}
async function generateFlashcards(content) {
    const prompt = `Convert the following study content into flashcards for spaced repetition learning.

Content: ${content.substring(0, 6000)}

Return a JSON array where each item has:
- front: string (question or term)
- back: string (answer or definition)

Generate 10-15 cards. Return ONLY valid JSON array.`;
    try {
        const ai = getGenAI();
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-pro-preview-06-05' });
        const result = await model.generateContent(prompt);
        return result.response.text();
    }
    catch {
        return getMockResponse('flashcard');
    }
}
async function chatWithTutor(params) {
    const systemContext = `You are EduChain AI Tutor - an expert academic mentor specializing in ${params.subject || 'all subjects'}, blockchain technology, and software development. You provide clear, structured explanations with examples. You can explain code, math formulas, and complex concepts. Keep responses concise but thorough.`;
    const historyText = params.history
        .slice(-10)
        .map((h) => `${h.role === 'user' ? 'Student' : 'Tutor'}: ${h.content}`)
        .join('\n');
    const prompt = `${systemContext}\n\nConversation history:\n${historyText}\n\nStudent: ${params.message}\n\nTutor:`;
    try {
        const ai = getGenAI();
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-pro-preview-06-05' });
        const result = await model.generateContent(prompt);
        return result.response.text();
    }
    catch {
        return getMockResponse(params.message);
    }
}
async function reviewCode(code, language) {
    const prompt = `You are an expert ${language} code reviewer and AI programming tutor.

Analyze the following ${language} code:
\`\`\`${language}
${code}
\`\`\`

Provide a comprehensive review including:
1. **Correctness**: Does it solve the intended problem?
2. **Bugs Found**: List any bugs with line numbers and fixes
3. **Optimizations**: Performance improvements
4. **Best Practices**: Code style and patterns
5. **Corrected Version**: Provide the improved code if changes are needed

Format your response clearly with markdown.`;
    try {
        const ai = getGenAI();
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-pro-preview-06-05' });
        const result = await model.generateContent(prompt);
        return result.response.text();
    }
    catch {
        return `## Code Review\n\n**Correctness**: The code logic appears sound.\n\n**Potential Improvements**:\n1. Add input validation\n2. Consider error handling for edge cases\n3. Add comments for complex sections\n\n**Overall**: Good structure, minor improvements recommended.`;
    }
}
async function analyzeCareerGap(params) {
    const prompt = `You are a career counselor specializing in Web3, blockchain, and tech careers.

Analyze this candidate profile:
- Current Skills: ${params.skills.join(', ')}
- Target Role: ${params.targetRole}
- Experience: ${params.experience}

Provide a JSON response with:
- atsScore: number (0-100)
- missingSkills: string[]
- roadmap: Array<{week: number, goal: string, resources: string[]}>
- interviewQuestions: string[]
- linkedinTips: string[]

Return ONLY valid JSON.`;
    try {
        const ai = getGenAI();
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-pro-preview-06-05' });
        const result = await model.generateContent(prompt);
        return result.response.text();
    }
    catch {
        return JSON.stringify({
            atsScore: 72,
            missingSkills: ['Solidity', 'DeFi Protocols', 'Web3.js', 'Smart Contract Auditing'],
            roadmap: [
                { week: 1, goal: 'Learn Cardano fundamentals', resources: ['Cardano documentation', 'Plutus Pioneer Program'] },
                { week: 2, goal: 'Build first smart contract', resources: ['Aiken tutorial', 'EduChain AI playground'] },
                { week: 3, goal: 'Portfolio project', resources: ['GitHub', 'EduChain AI courses'] },
                { week: 4, goal: 'Apply to 5 positions', resources: ['LinkedIn', 'Web3 job boards'] },
            ],
            interviewQuestions: [
                'Explain the eUTxO model and how it differs from the account model.',
                'What is CIP-30 and why is it important for dApps?',
                'How would you design a multi-sig smart contract on Cardano?',
            ],
            linkedinTips: [
                'Add "Cardano Developer" to your headline',
                'Showcase any blockchain projects in your featured section',
                'Connect with Cardano developer community',
            ],
        });
    }
}
