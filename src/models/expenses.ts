import mongoose from 'mongoose'

const { Schema, model } = mongoose

const expensesSchema = new Schema(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Categories',
      required: true,
    },
    amount: { type: Number, required: true },
    note: String,
    expenseDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
)

export const Expenses = model('Expenses', expensesSchema)
