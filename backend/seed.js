require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const StartupData = require('./models/StartupData');

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('📦 Connected to MongoDB');

        // Find the founder
        const user = await User.findOne({ email: 'shahpershahin@gmail.com' });
        if (!user) {
            console.error('❌ User not found! Please login to the dashboard once to create your user.');
            process.exit(1);
        }

        console.log(`👤 Found user: ${user.name} (${user.email})`);

        // Find or create their StartupData
        let startupData = await StartupData.findOne({ user: user._id });
        if (!startupData) {
            startupData = new StartupData({ user: user._id });
        }

        // =====================================
        // Injecting Realistic Artificial Data
        // =====================================
        
        console.log('💉 Injecting realistic dummy data...');

        // 1. Finance & Runway Engine
        startupData.financials = {
            revenue: 12500,        // $12.5k MRR
            funding: 500000,       // Half a million raised
            burnRate: 45000,       // Burning $45k a month
            cashInBank: 220000     // Down to $220k liquid cash left (Danger zone ~ 4.8 months runway)
        };

        // 2. Goals
        startupData.goals = [
            { title: 'Reach $50k MRR by Q4', status: 'active', priority: 'High' },
            { title: 'Raise Series A ($3M)', status: 'active', priority: 'Critical' },
            { title: 'Hire Head of Growth', status: 'active', priority: 'Medium' }
        ];

        // 3. Milestones
        startupData.milestones = [
            { title: 'Launch AI Co-Founder Feature 🚀', achieved: true, date: new Date() },
            { title: 'Close first 100 paid customers', achieved: false },
            { title: 'Secure 3 Term Sheets from VCs', achieved: false }
        ];

        // 4. Tasks (Different Departments)
        startupData.tasks = [
            { title: 'Draft Series A Pitch Deck', status: 'in-progress', department: 'General' },
            { title: 'Fix WebSocket Disconnection Bug', status: 'pending', department: 'Engineering' },
            { title: 'Implement Stripe Webhooks', status: 'in-progress', department: 'Finance' },
            { title: 'Design new Landing Page hero section', status: 'pending', department: 'Design' },
            { title: 'Launch Product Hunt Campaign', status: 'pending', department: 'Growth' },
            { title: 'Set up Delaware C-Corp Paperwork', status: 'completed', department: 'Operations' }
        ];

        // 5. CRM (Investors/Deals)
        startupData.contacts = [
            { name: 'Michael Seibel', company: 'Y Combinator', type: 'Advisor', status: 'Warm', lastNote: 'Loved the updated onboarding flow.' },
            { name: 'Sarah Tavel', company: 'Benchmark', type: 'Investor', status: 'In-Talks', lastNote: 'Wants to see $20k MRR before writing a check.' },
            { name: 'Acme Corp', company: 'Enterprise Leads', type: 'Client', status: 'Cold', lastNote: 'Emailed CEO, waiting for reply.' }
        ];

        // 6. Sprints
        startupData.sprints = [
            { theme: 'Growth & Stabilization', active: true, startDate: new Date(), endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }
        ];

        // Ensure current user is Admin in team array (failsafe)
        if (!startupData.teamMembers.some(m => m.user && m.user.toString() === user._id.toString())) {
            startupData.teamMembers.push({
                user: user._id,
                role: 'Admin',
                jobTitle: 'CEO',
                department: 'General'
            });
        }

        await startupData.save();

        console.log('✅ Success! Your workspace has been populated with data.');
        console.log('🚨 IMPORTANT: Go to your browser and hit Refresh.');
        
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedDatabase();
