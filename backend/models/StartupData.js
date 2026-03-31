const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    dueDate: { type: Date }
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
    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tasks: [taskSchema],
    milestones: [milestoneSchema],
    financials: financialSchema
}, { timestamps: true });

module.exports = mongoose.model('StartupData', startupDataSchema);
