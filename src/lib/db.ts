import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI

if (!MONGO_URI) {
  throw new Error('MONGO_URI is missing')
}

export async function connectDb() {
  const connection = await mongoose.connect(MONGO_URI!)
  return connection
}
