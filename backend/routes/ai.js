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

// --- MORNING BRIEF (Push Notification Style) ---
router.get('/brief', auth, async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: 'GEMINI_API_KEY is missing.' });
        }

        const data = await StartupData.findOne(getAccessQuery(req.user.id)).populate('tasks.assignee', 'name email');
        if (!data) return res.status(404).json({ message: 'Startup data not found' });

        const financials = data.financials || {};
        const cash = financials.cashInBank || financials.funding || 0;
        const burn = financials.burnRate || 0;
        const currentRunway = burn > 0 ? (cash / burn).toFixed(1) : 'Infinite';

        const pendingTasks = data.tasks.filter(t => t.status !== 'completed').map(t => `- ${t.title} [${t.department || 'General'}]`).join('\n');
        const activeMilestones = data.milestones.filter(m => !m.achieved).map(m => `- ${m.title}`).join('\n');

        const systemContext = `You are an elite AI Chief of Staff. Give the Founder a highly concise, punchy "Morning Briefing" (Max 3 paragraphs). 
        
CURRENT STATE:
Runway: ${currentRunway} months (Cash: $${cash}, Burn: $${burn}/mo)
Active Milestones:\n${activeMilestones || 'None'}
Pending Tasks:\n${pendingTasks || 'None'}

INSTRUCTIONS:
1. Start with a quick 1-sentence summary of startup health (Runway).
2. Tell them exactly what 2-3 tasks they should prioritize today to hit their milestones or extend runway.
3. Keep it punchy, actionable, and formatted in clean markdown (bolding, bullet points).`;

        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent(systemContext);
            res.json({ brief: await result.response.text() });
        } catch (apiError) {
            console.error("Gemini API Error (Fallback Enabled):", apiError.message);
            
            // LOCAL FALLBACK ENGINE (For revoked AI Keys or offline mode)
            let fallbackBrief = `**☕ Chief of Staff Local Fallback Briefing**\n\n`;
            
            if (burn > 0) {
                const months = (cash / burn).toFixed(1);
                fallbackBrief += `1️⃣ **Runway Alert:** You currently have **$${cash.toLocaleString()}** in cash. Burning **$${burn.toLocaleString()}** per month gives you exactly **${months} months** of runway left.\n\n`;
            } else {
                fallbackBrief += `1️⃣ **Runway Alert:** You have **$${cash.toLocaleString()}** in cash and zero burn. You are infinitely profitable or not tracking expenses!\n\n`;
            }

            const unachieved = data.milestones.filter(m => !m.achieved);
            if (unachieved.length > 0) {
                fallbackBrief += `2️⃣ **Priority Milestone:** Your immediate goal should be to focus all energy on: **"${unachieved[0].title}"**.\n\n`;
            }

            const activeT = data.tasks.filter(t => t.status !== 'completed');
            if (activeT.length > 0) {
                fallbackBrief += `3️⃣ **Execution Focus:** You have ${activeT.length} pending tasks. Today, unblock this one: **${activeT[0].title}**.\n\n`;
            } else {
                fallbackBrief += `3️⃣ **Execution Focus:** No pending tasks. Time to go sell or write some code!`;
            }

            res.json({ brief: fallbackBrief });
        }
    } catch (err) {
        res.status(500).json({ message: 'Daily Briefing failed', error: err.message });
    }
});

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
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const result = await model.generateContent(`${systemContext}\n\nFounder Request: ${prompt}`);
            const responseOutput = await result.response.text();

            res.json({ result: responseOutput });
        } catch (apiError) {
            console.error("Gemini API Error (Fallback Enabled for Analyze):", apiError.message);
            
            // LOCAL FALLBACK ENGINE
            let fallbackResponse = `*Notice: Live AI connection is currently offline. Providing local systemic advice...*\n\n`;
            
            if (prompt.toLowerCase().includes('runway') || prompt.toLowerCase().includes('burn') || prompt.toLowerCase().includes('cash')) {
                fallbackResponse += `Your current Monthly Burn Rate is $${financials.burnRate}, and you have $${financials.funding} in historical funding. Remember that true runway is Cash In Bank / Monthly Burn. Ensure your revenue offsets as much burn as possible to extend your lifecycle.`;
            } else if (prompt.toLowerCase().includes('task') || prompt.toLowerCase().includes('priority')) {
                fallbackResponse += `You have ${data.tasks.filter(t => t.status !== 'completed').length} pending tasks across the company. I recommend focusing on tasks directly tied to your active milestones to maintain momentum.`;
            } else {
                fallbackResponse += `You asked: "${prompt}".\n\nAs your local AI Co-Founder, I recommend prioritizing tasks that directly generate revenue or extend runway. Our active pending task count is currently high. Delegate what you can and focus on closing deals or shipping core features.`;
            }

            res.json({ result: fallbackResponse });
        }

    } catch (err) {
        console.error('AI Route Error:', err);
        res.status(500).json({ message: 'AI Analysis failed', error: err.message });
    }
});

module.exports = router;
