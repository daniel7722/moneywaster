import { createServerFn } from '@tanstack/react-start'
import { connectDb } from '#/lib/db'
import { Categories } from '#/models/categories'

const categoryValidator = (input: { name: string; icon: string }) => {
  if (!input.name) {
    throw new Error('Name is required')
  }
  return input
}

export const CreateTestCategory = createServerFn({
  method: 'POST',
})
  .inputValidator(categoryValidator)
  .handler(async ({ data }) => {
    try {
      console.log('Attempting to connect to DB...')
      await connectDb()
      console.log('Connected to DB successfully!')
      const newCategory = await Categories.create(data)
      console.log('New category created:', newCategory)
      return {
        _id: newCategory._id.toString(), // Convert ObjectId to string
        name: newCategory.name,
        icon: newCategory.icon,
      }
    } catch (error) {
      console.error('Error creating category:', error)
      throw new Error('Failed to create category')
    }
  })
