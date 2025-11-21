import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    notes: { type: String },
    source: { type: String, enum: ['manual', 'upi'], default: 'manual' },
    // Optional id for imports; allows idempotent inserts
    externalId: { type: String, index: true, unique: true, sparse: true },
    // Recurring support
    isRecurring: { type: Boolean, default: false },
    isTemplate: { type: Boolean, default: false },
    recurringRule: { type: String, enum: ['monthly', 'weekly', 'yearly'], default: undefined },
    recurringStart: { type: Date },
    recurringEnd: { type: Date },
    lastRunAt: { type: Date },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
  },
  { timestamps: true }
);

export default mongoose.model('Expense', ExpenseSchema);

