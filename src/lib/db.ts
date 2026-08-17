import mongoose from 'mongoose'

export { mongoose }

const MONGO_URI = process.env.MONGO_URI

if (!MONGO_URI) {
  throw new Error('MONGO_URI is missing')
}

let connectionPromise: Promise<typeof mongoose> | undefined

export async function connectDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) return

  connectionPromise ??= mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10_000,
  })

  try {
    await connectionPromise
  } catch (error) {
    connectionPromise = undefined
    throw error
  }
}
