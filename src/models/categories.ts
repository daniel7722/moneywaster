import mongoose from 'mongoose'

const { Schema, model } = mongoose

const categoriesSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    icon: String,
  },
  {
    timestamps: true,
  },
)

export const Categories = model('Categories', categoriesSchema)
