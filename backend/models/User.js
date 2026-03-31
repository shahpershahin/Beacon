const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    startupName: { type: String },
    role: { type: String, default: 'founder' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
