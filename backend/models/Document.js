const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    startup: { type: mongoose.Schema.Types.ObjectId, ref: 'StartupData', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, default: '' },
    category: { type: String, enum: ['SOP', 'Meeting Note', 'Product Doc', 'General'], default: 'General' },
    tags: [String],
    linkedTasks: [{ type: mongoose.Schema.Types.ObjectId }],
    linkedMilestones: [{ type: mongoose.Schema.Types.ObjectId }],
    versionHistory: [{
        content: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
