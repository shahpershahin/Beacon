const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const StartupData = require('../models/StartupData');
const { auth, requireVerified } = require('../middleware/auth');

const router = express.Router();

const getAccessQuery = (userId) => {
    return { $or: [{ user: userId }, { 'teamMembers.user': userId }] };
};

// --- MORNING BRIEF (Push Notification Style) ---
// --- MORNING BRIEF (Rules Engine + Gemini Diagnostics) ---
router.get('/brief', auth, async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: 'GEMINI_API_KEY is missing.' });
        }

        const data = await StartupData.findOne(getAccessQuery(req.user.id))
            .populate('tasks.assignee', 'name email')
            .populate('teamMembers.user', 'name email');
        if (!data) return res.status(404).json({ message: 'Startup data not found' });

        // Deterministic Runway
        const financials = data.financials || {};
        const cash = financials.cashInBank || financials.funding || 0;
        const burn = financials.burnRate || 0;
        const runwayMonths = burn > 0 ? (cash / burn) : Infinity;
        const runwayText = runwayMonths === Infinity ? 'Infinite' : `${runwayMonths.toFixed(1)} months`;

        // Deterministic Runway score
        let runwayScore = 100;
        if (runwayMonths !== Infinity) {
            if (runwayMonths >= 12) runwayScore = 100;
            else if (runwayMonths >= 6) runwayScore = 70;
            else if (runwayMonths >= 3) runwayScore = 40;
            else runwayScore = 10;
        }

        // Task velocity score
        const totalTasks = (data.tasks || []).length;
        const completedTasksCount = (data.tasks || []).filter(t => t.status === 'completed').length;
        const taskScore = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 100;

        // Milestone achievements score
        const totalMilestones = (data.milestones || []).length;
        const achievedMilestonesCount = (data.milestones || []).filter(m => m.achieved).length;
        const milestoneScore = totalMilestones > 0 ? (achievedMilestonesCount / totalMilestones) * 100 : 100;

        // Decision success score
        const evaluatedDecisions = (data.decisions || []).filter(d => d.status === 'Success' || d.status === 'Failure');
        const successDecisionsCount = evaluatedDecisions.filter(d => d.status === 'Success').length;
        const decisionScore = evaluatedDecisions.length > 0 ? (successDecisionsCount / evaluatedDecisions.length) * 100 : 100;

        // Deterministic overall Health Score
        const healthScore = Math.round((runwayScore * 0.40) + (taskScore * 0.20) + (milestoneScore * 0.25) + (decisionScore * 0.15));

        // Alerts (Rules-based)
        const alerts = [];
        if (runwayMonths < 6) alerts.push(`CRITICAL RUNWAY WARNING: Only ${runwayText} left (Burn: $${burn}/mo, Cash: $${cash}).`);
        
        const now = new Date();
        const pendingOverdueReviews = (data.decisions || []).filter(d => 
            d.status === 'Pending' && new Date(d.reviewDate) <= now
        );
        if (pendingOverdueReviews.length > 0) {
            alerts.push(`DECISION EVALUATION REQUIRED: ${pendingOverdueReviews.length} pending decisions have reached their review dates.`);
        }

        const activeSprint = (data.sprints || []).find(s => s.active);
        const activeSprintText = activeSprint ? `Sprint Theme: "${activeSprint.theme}"` : 'No active sprint';

        const pendingTasksList = data.tasks.filter(t => t.status !== 'completed').map(t => `- ${t.title} [${t.department || 'General'}]`).join('\n');
        const activeMilestonesList = data.milestones.filter(m => !m.achieved).map(m => `- ${m.title}`).join('\n');

        const systemContext = `You are an elite AI Chief of Staff. Diagnose the startup state based ONLY on the provided deterministic calculations and rules.
        
DETERMINISTIC METRICS:
- Overall Health Score: ${healthScore}/100
- Cash Runway: ${runwayText} (Cash: $${cash}, Burn: $${burn}/mo) -> Runway Score: ${runwayScore}/100
- Task Completion Rate: ${completedTasksCount}/${totalTasks} -> Task Score: ${taskScore.toFixed(0)}/100
- Milestone Progress: ${achievedMilestonesCount}/${totalMilestones} -> Milestone Score: ${milestoneScore.toFixed(0)}/100
- Decision Success Rate: ${successDecisionsCount}/${evaluatedDecisions.length} evaluated -> Decision Score: ${decisionScore.toFixed(0)}/100
- Active Sprint: ${activeSprintText}
- Active Alerts:
${alerts.map(a => `  * ${a}`).join('\n') || '  * None'}

DETAILS:
Pending Milestones:\n${activeMilestonesList || 'None'}
Pending Tasks:\n${pendingTasksList || 'None'}
Overdue Reviews:\n${pendingOverdueReviews.map(r => `  * "${r.title}" (Expected Outcome: ${r.expectedOutcome})`).join('\n') || 'None'}

INSTRUCTIONS:
1. Start with a 2-3 sentence overview of startup health.
2. Outline the Core Risk (highlighting low runway, high task backlog, or overdue decision evaluations) and Core Strength (milestones completed or high decision success).
3. State the top 2-3 actionable priorities for the founder today.
4. Keep the output formatted in clean Markdown.`;

        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent(systemContext);
            res.json({ 
                brief: await result.response.text(),
                healthScore,
                metrics: { runwayMonths, runwayScore, taskScore, milestoneScore, decisionScore, totalTasks, completedTasksCount, totalMilestones, achievedMilestonesCount, evaluatedDecisionsCount: evaluatedDecisions.length, successDecisionsCount, pendingOverdueCount: pendingOverdueReviews.length }
            });
        } catch (apiError) {
            console.error("Gemini API Error (Fallback Enabled):", apiError.message);
            
            // LOCAL FALLBACK ENGINE
            let fallbackBrief = `**☕ Chief of Staff Local Fallback Briefing**\n\n`;
            fallbackBrief += `🏥 **Overall Health Score:** **${healthScore}/100**\n\n`;
            fallbackBrief += `1️⃣ **Runway Analysis:** You have **$${cash.toLocaleString()}** cash. Burning **$${burn.toLocaleString()}** per month gives you exactly **${runwayText}** of runway left.\n\n`;
            
            if (pendingOverdueReviews.length > 0) {
                fallbackBrief += `2️⃣ **Pending Decision Reviews:** You have **${pendingOverdueReviews.length} decisions** that need outcome logging. Please check your Decision Journal.\n\n`;
            } else {
                fallbackBrief += `2️⃣ **Priority Milestone:** Your primary execution goal should be to hit your pending milestones: ${data.milestones.filter(m => !m.achieved).map(m => m.title).slice(0, 1).join('') || 'None'}.\n\n`;
            }
            
            fallbackBrief += `3️⃣ **Execution Bottlenecks:** You have ${data.tasks.filter(t => t.status !== 'completed').length} pending tasks. Focused sprints should prioritize unblocking general tasks.\n\n`;
            fallbackBrief += `*(Note: Live AI explanation is currently offline, using deterministic local metrics evaluation)*`;

            res.json({ 
                brief: fallbackBrief,
                healthScore,
                metrics: { runwayMonths, runwayScore, taskScore, milestoneScore, decisionScore, totalTasks, completedTasksCount, totalMilestones, achievedMilestonesCount, evaluatedDecisionsCount: evaluatedDecisions.length, successDecisionsCount, pendingOverdueCount: pendingOverdueReviews.length }
            });
        }
    } catch (err) {
        console.error("Brief API error:", err);
        res.status(500).json({ message: 'Daily Briefing failed' });
    }
});

router.post('/analyze', auth, requireVerified, async (req, res) => {
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
        res.status(500).json({ message: 'AI Analysis failed' });
    }
});

// --- SEARCH ANSWER (LAYER 2 RETRIEVAL & CITING) ---
router.post('/search-answer', auth, requireVerified, async (req, res) => {
    try {
        const { query, searchResults } = req.body;
        if (!query || !searchResults) {
            return res.status(400).json({ message: 'Query and Search Results are required' });
        }

        const systemContext = `You are the Beacon Memory Q&A Engine. Your role is to answer the user's question using ONLY the provided search results from the company's workspace database.
        
SEARCH RESULTS FROM DATABASE:
${JSON.stringify(searchResults, null, 2)}

INSTRUCTIONS:
1. Formulate a direct, accurate answer to the user's question: "${query}".
2. You MUST cite the specific sources in your response by using footnotes like [Task: Title] or [Decision: Title] or [Wiki: Title].
3. If the provided search results do not contain the answer, state that you cannot find this information in the workspace records. Do not hallucinate or use external knowledge.
4. Keep the answer structured and readable in Markdown.`;

        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent(systemContext);
            res.json({ answer: await result.response.text() });
        } catch (apiError) {
            console.error("Gemini Q&A Error:", apiError.message);
            res.json({ answer: `**Factual Lookup Summary:**\n\nI was unable to connect to the live AI engine, but here is what the records show for your query:\n- Tasks: ${searchResults.tasks?.length || 0} hits\n- Decisions: ${searchResults.decisions?.length || 0} hits\n- Milestones: ${searchResults.milestones?.length || 0} hits\n- Documents: ${searchResults.wiki?.length || 0} hits.\n\nPlease review the raw database hits below.` });
        }
    } catch (err) {
        console.error("Search Answer Error:", err);
        res.status(500).json({ message: 'Failed to synthesize search answer' });
    }
});

// --- INVESTOR UPDATE GENERATOR ---
router.get('/investor-update', auth, async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: 'GEMINI_API_KEY is missing.' });
        }

        const data = await StartupData.findOne(getAccessQuery(req.user.id));
        if (!data) return res.status(404).json({ message: 'Startup data not found' });

        const financials = data.financials || {};
        const cash = financials.cashInBank || financials.funding || 0;
        const burn = financials.burnRate || 0;
        const revenue = financials.revenue || 0;
        const runwayMonths = burn > 0 ? (cash / burn).toFixed(1) : 'Infinite';

        const recentMilestones = (data.milestones || []).filter(m => m.achieved).slice(0, 5).map(m => `- ${m.title}`).join('\n');
        const activeMilestones = (data.milestones || []).filter(m => !m.achieved).slice(0, 5).map(m => `- ${m.title} (Target: ${m.targetDate ? new Date(m.targetDate).toLocaleDateString() : 'N/A'})`).join('\n');
        const completedTasksCount = (data.tasks || []).filter(t => t.status === 'completed').length;
        const totalTasksCount = (data.tasks || []).length;

        const recentDecisions = (data.decisions || []).slice(0, 5).map(d => `- ${d.title} (Status: ${d.status}, Category: ${d.category})`).join('\n');

        const systemContext = `You are the AI Chief of Staff. Generate a high-quality, professional monthly **Investor Update / Board Report** for the startup.
        
LIVE METRICS:
- Cash in Bank: $${cash.toLocaleString()}
- Monthly Burn Rate: $${burn.toLocaleString()}/mo
- Monthly Revenue: $${revenue.toLocaleString()}/mo
- Estimated Cash Runway: ${runwayMonths} months
- Tasks Completion: ${completedTasksCount}/${totalTasksCount} tasks complete
- Recent Achieved Milestones:\n${recentMilestones || 'None'}
- Upcoming Priority Milestones:\n${activeMilestones || 'None'}
- Recent Strategic Decisions:\n${recentDecisions || 'None'}

INSTRUCTIONS:
1. Format as a beautifully structured markdown newsletter report.
2. Include sections: "Executive Summary", "Key Financials & Runway", "Recent Achievements & Momentum", "Upcoming Milestones & Roadmap", and "Recent Strategic Alignment".
3. Keep it encouraging, professional, and clear, suitable for high-profile investors.
4. Do not include placeholders; write complete narratives.`;

        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent(systemContext);
            res.json({ update: await result.response.text() });
        } catch (apiError) {
            console.error("Gemini Investor Update Error:", apiError.message);
            // Mock update fallback
            let mockUpdate = `# 📊 Board & Investor Update\n\n`;
            mockUpdate += `## ⚡ Executive Summary\nOur team has made steady progress this month, maintaining steady focus on core product features and revenue milestones. Here is the summary of key metrics and updates:\n\n`;
            mockUpdate += `## 💰 Key Financials & Runway\n- **Monthly Revenue:** $${revenue.toLocaleString()}\n- **Monthly Burn:** $${burn.toLocaleString()}\n- **Cash in Bank:** $${cash.toLocaleString()}\n- **Runway:** ${runwayMonths} months\n\n`;
            mockUpdate += `## 🎯 Recent Achievements & Momentum\n- Completed ${completedTasksCount} tasks this period.\n- Achieved Milestones:\n${recentMilestones || 'None'}\n\n`;
            mockUpdate += `## 🔮 Upcoming Milestones & Roadmap\nWe are actively working toward the following goals:\n${activeMilestones || 'None'}\n\n`;
            mockUpdate += `*Generated automatically by Beacon Startup OS.*`;
            res.json({ update: mockUpdate });
        }
    } catch (err) {
        console.error("Investor Update Error:", err);
        res.status(500).json({ message: 'Failed to generate investor update' });
    }
});

// --- AI WORKFLOW BLUEPRINT GENERATOR ---
router.post('/generate-blueprint', auth, requireVerified, async (req, res) => {
    try {
        const { type, customPrompt } = req.body;
        if (!type) return res.status(400).json({ message: 'Blueprint type is required' });

        let prompt = '';
        if (type === 'DEVELOPER_ONBOARDING') {
            prompt = 'Create an onboarding checklist for a new software engineer joining a startup. Include setup tasks, docs to read, and early code checkpoints.';
        } else if (type === 'PRODUCT_HUNT_LAUNCH') {
            prompt = 'Create a launch preparation checklist for introducing a new product on Product Hunt. Include asset gathering, schedule of outreach, launch day tasks, and post-launch follow-up.';
        } else if (type === 'SEED_FUNDRAISING') {
            prompt = 'Create a fundraising checklist for preparing a seed round. Include materials prep (deck, model), pipeline builder, outreach strategy, and term sheet checkpoints.';
        } else {
            prompt = customPrompt || 'Create a list of tasks and milestones for standard startup operations.';
        }

        const systemContext = `You are a startup operations designer. Generate a structured set of tasks and milestones to deploy for the request: "${prompt}".
        
You MUST return ONLY a JSON object containing two lists (no conversational text, no markdown code blocks, just raw JSON parsing matching this structure):
{
  "milestones": [
    { "title": "Milestone Title", "description": "Milestone Description", "daysFromStart": 30 }
  ],
  "tasks": [
    { "title": "Task Title", "department": "Engineering/Design/Finance/Growth/Operations/General", "daysFromStart": 5 }
  ]
}`;

        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent(systemContext);
            const text = await result.response.text();
            
            const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const blueprint = JSON.parse(cleanedJson);
            res.json(blueprint);
        } catch (apiError) {
            console.error("Gemini Blueprint Generation Error:", apiError.message);
            res.json({
                milestones: [
                    { title: "Review & Alignment Meet", description: "First checkpoint to review setup and project roadmap", daysFromStart: 7 }
                ],
                tasks: [
                    { title: "Review codebase documentation", department: "Engineering", daysFromStart: 2 },
                    { title: "Setup development environment variables", department: "Engineering", daysFromStart: 1 },
                    { title: "Schedule welcome 1:1 call with founder", department: "General", daysFromStart: 2 }
                ]
            });
        }
    } catch (err) {
        console.error("Generate Blueprint Error:", err);
        res.status(500).json({ message: 'Failed to generate blueprint' });
    }
});

module.exports = router;
