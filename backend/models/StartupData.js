const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    dueDate: { type: Date },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sprintId: { type: mongoose.Schema.Types.ObjectId },
    department: { type: String, enum: ['Engineering', 'Design', 'Finance', 'Growth', 'Operations', 'General'], default: 'General' }
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

const milestoneSchema = new mongoose.Schema({
    title: { type: String, required: true },
    achieved: { type: Boolean, default: false },
    date: { type: Date }
});

const financialSchema = new mongoose.Schema({
    revenue: { type: Number, default: 0 },
    funding: { type: Number, default: 0 },
    burnRate: { type: Number, default: 0 }
});

const startupDataSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teamMembers: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['Admin', 'HR', 'Viewer'], default: 'Viewer' },
        jobTitle: { type: String },
        department: { type: String, enum: ['Engineering', 'Design', 'Finance', 'Growth', 'Operations', 'General'], default: 'General' }
    }],
    tasks: [taskSchema],
    milestones: [milestoneSchema],
    financials: financialSchema,
    integrations: {
        stripeKey: { type: String, default: '' },
        slackWebhookUrl: { type: String, default: '' }
    },
    sprints: [sprintSchema],
    contacts: [contactSchema]
}, { timestamps: true });

module.exports = mongoose.model('StartupData', startupDataSchema);
