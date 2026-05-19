import { createServerFn } from '@tanstack/react-start'
import type mongoose from 'mongoose'
import { connectDb } from '#/lib/db'
import { Categories } from '#/models/categories'

const categoryValidator = (input: { name: string; icon: string }) => {
  if (!input.name) throw new Error('Name is required')
  return input
}

export const CreateTestCategory = createServerFn({ method: 'POST' })
  .inputValidator(categoryValidator)
  .handler(async ({ data }) => {
    await connectDb()
    const newCategory = await Categories.create(data)
    return {
      _id: newCategory._id.toString(),
      name: newCategory.name,
      icon: newCategory.icon ?? '',
    }
  })

export const GetCategories = createServerFn({ method: 'GET' }).handler(
  async () => {
    await connectDb()
    const cats = await Categories.find({}).lean()
    return cats.map((c) => ({
      _id: c._id.toString(),
      name: c.name,
      icon: c.icon ?? '',
    }))
  },
)
