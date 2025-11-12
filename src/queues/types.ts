import { BridgeJob } from '@/db/schemas/bridgeJob'

export type QueueName = 'locked' | 'burned'

export interface QueueAdapter {
  enqueue(queue: QueueName, payload: BridgeJob): Promise<void>
  process(queue: QueueName, handler: (payload: BridgeJob) => Promise<void>): Promise<void>
  close?(): Promise<void>
}
