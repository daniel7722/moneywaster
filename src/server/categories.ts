import { createServerFn } from '@tanstack/react-start'
import mongoose from 'mongoose'
import { connectDb } from '#/lib/db'
import { Categories } from '#/models/categories'
import { Expenses } from '#/models/expenses'

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

export const CreateCategory = createServerFn({ method: 'POST' })
  .inputValidator((input: { name: string; icon: string }) => {
    if (!input.name?.trim()) throw new Error('Name is required')
    if (!input.icon?.trim()) throw new Error('Icon is required')
    return { name: input.name.trim(), icon: input.icon.trim() }
  })
  .handler(async ({ data }) => {
    await connectDb()
    try {
      const cat = await Categories.create(data)
      return {
        _id: cat._id.toString(),
        name: cat.name,
        icon: cat.icon ?? '',
      }
    } catch (err: unknown) {
      const mongoErr = err as { code?: number }
      if (mongoErr.code === 11000)
        throw new Error('A category with that name already exists')
      throw new Error('Failed to create category')
    }
  })

export const UpdateCategory = createServerFn({ method: 'POST' })
  .inputValidator((input: { id: string; name: string; icon: string }) => {
    if (!input.id) throw new Error('id is required')
    if (!input.name?.trim()) throw new Error('Name is required')
    if (!input.icon?.trim()) throw new Error('Icon is required')
    return { id: input.id, name: input.name.trim(), icon: input.icon.trim() }
  })
  .handler(async ({ data: { id, name, icon } }) => {
    await connectDb()
    try {
      const updated = await Categories.findByIdAndUpdate(
        id,
        { name, icon },
        { new: true },
      )
      if (!updated) throw new Error('Category not found')
      return {
        _id: updated._id.toString(),
        name: updated.name,
        icon: updated.icon ?? '',
      }
    } catch (err: unknown) {
      const mongoErr = err as { code?: number }
      if (mongoErr.code === 11000)
        throw new Error('A category with that name already exists')
      throw err
    }
  })

// Returns expense count for a category (used before deletion)
export const GetCategoryExpenseCount = createServerFn({ method: 'POST' })
  .inputValidator((input: { id: string }) => {
    if (!input.id) throw new Error('id is required')
    return input
  })
  .handler(async ({ data: { id } }) => {
    await connectDb()
    const count = await Expenses.countDocuments({
      categoryId: new mongoose.Types.ObjectId(id),
    })
    return { count }
  })

// cascade=true also deletes all expenses for that category
export const DeleteCategory = createServerFn({ method: 'POST' })
  .inputValidator((input: { id: string; cascade?: boolean }) => {
    if (!input.id) throw new Error('id is required')
    return input
  })
  .handler(async ({ data: { id, cascade } }) => {
    await connectDb()
    if (cascade) {
      await Expenses.deleteMany({
        categoryId: new mongoose.Types.ObjectId(id),
      })
    }
    await Categories.findByIdAndDelete(id)
    return { success: true }
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
