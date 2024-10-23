import mongoose from "mongoose";
const ruleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    ast: {
        type: {
            type: String,
            enum: ['operator', 'operand'],
            required: true
        },
        value: mongoose.Schema.Types.Mixed,
        left: { type: mongoose.Schema.Types.Mixed, default: null },
        right: { type: mongoose.Schema.Types.Mixed, default: null }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const Rule = mongoose.model('Rule', ruleSchema);