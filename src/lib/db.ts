import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI

if (!MONGO_URI) {
  throw new Error('MONGO_URI is missing')
}

let isConnected = false

export async function connectDb(): Promise<void> {
  if (isConnected && mongoose.connection.readyState === 1) return
  await mongoose.connect(MONGO_URI!)
  isConnected = true
}
