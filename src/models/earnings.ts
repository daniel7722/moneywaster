import { mongoose } from '#/lib/db'

const { Schema, model } = mongoose

const earningsSchema = new Schema(
  {
    amount: { type: Number, required: true },
    note: String,
    earnedDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

export const Earnings = model('Earnings', earningsSchema)
