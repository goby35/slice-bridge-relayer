import { InMemoryQueue } from './memory'
// import { BullMqAdapter } from './bullmq'
import { QueueAdapter } from './types'
import { handleLocked, handleBurned } from '@/processor/bridgeProcessor'

export function createQueue(): QueueAdapter {
//   if (process.env.REDIS_URL) {
//     return new BullMqAdapter(process.env.REDIS_URL, process.env.QUEUE_PREFIX ?? 'slice-bridge')
//   }
  return new InMemoryQueue()
}

const bridgeQueue = createQueue()

await bridgeQueue.process('locked', handleLocked)
await bridgeQueue.process('burned', handleBurned)

export default bridgeQueue;

