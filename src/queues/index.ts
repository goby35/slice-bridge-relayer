import { InMemoryQueue } from './memory'
import { BullMqAdapter } from './bullmq'
import { QueueAdapter } from './types'
import { handleLocked, handleBurned } from '@/processor/bridgeProcessor'
import { envConfig } from '@/core/env'
import { logger } from '@/core/logger'

export function createQueue(): QueueAdapter {
  if (
    envConfig.REDIS_URL && envConfig.REDIS_URL !== 'redis://localhost:6379'
    || process.env.USE_REDIS === 'true'
  ) {
    try {
      logger.info(`Using BullMQ with Redis: ${envConfig.REDIS_URL}`)
      return new BullMqAdapter(envConfig.REDIS_URL, envConfig.QUEUE_PREFIX)
    } catch (error) {
      logger.error({ error }, 'Failed to initialize BullMQ queue, falling back to InMemory queue')
    }
  }
  logger.info('Using InMemory queue (queue fallback)')
  return new InMemoryQueue()
}

const bridgeQueue = createQueue()

await bridgeQueue.process('locked', handleLocked)
await bridgeQueue.process('burned', handleBurned)

export default bridgeQueue;

