const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['active', 'achieved', 'paused'], default: 'active' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    targetDate: { type: Date }
});

const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    dueDate: { type: Date },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sprintId: { type: mongoose.Schema.Types.ObjectId },
    milestoneId: { type: mongoose.Schema.Types.ObjectId }, // Link to Milestone
    department: { type: String, enum: ['Engineering', 'Design', 'Finance', 'Growth', 'Operations', 'General'], default: 'General' },
    comments: [commentSchema], // Task Chat
    linkedDocs: [{ 
        _id: { type: mongoose.Schema.Types.ObjectId },
        title: String 
    }] // Deep Wiki Knowledge
});

const activityLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true }, // e.g. "created task", "achieved milestone"
    detail: { type: String }, // e.g. "Drafted Pitch Deck"
    timestamp: { type: Date, default: Date.now }
});

const milestoneSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    achieved: { type: Boolean, default: false },
    targetDate: { type: Date },
    linkedDocs: [{ 
        _id: { type: mongoose.Schema.Types.ObjectId },
        title: String 
    }] // Deep Wiki Knowledge
});

const sprintSchema = new mongoose.Schema({
    theme: { type: String, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    active: { type: Boolean, default: true }
});

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    company: { type: String },
    type: { type: String, enum: ['Investor', 'Partner', 'Advisor', 'Client', 'Candidate'], default: 'Investor' },
    status: { type: String, enum: ['Cold', 'Warm', 'In-Talks', 'Commitment', 'Passed'], default: 'Cold' },
    lastNote: { type: String },
    updatedAt: { type: Date, default: Date.now }
});

const financialSchema = new mongoose.Schema({
    revenue: { type: Number, default: 0 },
    funding: { type: Number, default: 0 },
    burnRate: { type: Number, default: 0 },
    cashInBank: { type: Number, default: 0 }
});


const startupDataSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teamMembers: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['Admin', 'HR', 'Viewer'], default: 'Viewer' },
        jobTitle: { type: String },
        department: { type: String, enum: ['Engineering', 'Design', 'Finance', 'Growth', 'Operations', 'General'], default: 'General' }
    }],
    goals: [goalSchema],
    tasks: [taskSchema],
    milestones: [milestoneSchema],
    financials: financialSchema,
    activities: [activityLogSchema],
    automations: [{ 
        trigger: String, 
        action: String, 
        payload: mongoose.Schema.Types.Mixed, 
        active: { type: Boolean, default: true } 
    }],
    integrations: {
        stripeKey: { type: String, default: '' },
        slackWebhookUrl: { type: String, default: '' }
    },
    sprints: [sprintSchema],
    contacts: [contactSchema]
}, { timestamps: true });

module.exports = mongoose.model('StartupData', startupDataSchema);
