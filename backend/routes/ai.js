const express = require('express');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const StartupData = require('../models/StartupData');

const router = express.Router();

const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const getAccessQuery = (userId) => {
    return { $or: [{ user: userId }, { 'teamMembers.user': userId }] };
};

router.post('/analyze', auth, async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: 'GEMINI_API_KEY is missing from backend environment variables.' });
        }

        // 1. Fetch Startup Context
        const data = await StartupData.findOne(getAccessQuery(req.user.id)).populate('tasks.assignee', 'name email');
        if (!data) return res.status(404).json({ message: 'Startup data not found for contextual analysis' });

        // 2. Synthesize System Prompt
        const financials = data.financials || { revenue: 0, funding: 0, burnRate: 0 };
        const currentRunway = financials.burnRate > 0 ? (financials.funding / financials.burnRate).toFixed(1) : 'Infinite';

        let pendingTasks = data.tasks.filter(t => t.status !== 'completed').map(t => `- ${t.title} [${t.status}]`).join('\n');
        const completedTasks = data.tasks.filter(t => t.status === 'completed').length;
        
        let teamInfo = `Founders + Team Size: ${data.teamMembers.length + 1}`;

        const systemContext = `You are an elite AI Co-Founder and CFO advisor for a startup. You are integrated directly into their SaaS dashboard.
Here is the LIVE data for this startup:

=== FINANCIALS ===
- Monthly Revenue: $${financials.revenue}
- Total Capital/Funding: $${financials.funding}
- Monthly Burn Rate: $${financials.burnRate}
- Estimated Runway: ${currentRunway} months

=== EXECUTION STATUS ===
- Active/Pending Tasks:\n${pendingTasks || 'No pending tasks!'}
- Total Completed Tasks: ${completedTasks}
- ${teamInfo}

INSTRUCTIONS:
Analyze the user's prompt strictly using this data. Be highly analytical, constructive, and direct. 
If the burn rate is dangerous or tasks are piling up without revenue, warn them politely but firmly like a real co-founder would. 
Keep your response concise, sharp, and easy to read using clean Markdown formatting (bullet points, bold text). Do NOT hallucinate data outside of what is provided here.`;

        // 3. Trigger LLM
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const result = await model.generateContent(`${systemContext}\n\nFounder Request: ${prompt}`);
        const responseOutput = await result.response.text();

        res.json({ result: responseOutput });

    } catch (err) {
        console.error('AI Route Error:', err);
        res.status(500).json({ message: 'AI Analysis failed', error: err.message });
    }
});

module.exports = router;
