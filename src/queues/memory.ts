import { QueueAdapter, QueueName } from './types'
import { BridgeJob } from "@/db/schemas/bridgeJob";

type Handler = (payload: BridgeJob) => Promise<void>

export class InMemoryQueue implements QueueAdapter {
    private handlers: Record<QueueName, Handler | null> = {
        locked: null,
        burned: null,
    }
    private buffers: Record<QueueName, BridgeJob[]> = {
        locked: [] as BridgeJob[],
        burned: [] as BridgeJob[],
    }
    private isDraining = false

    async enqueue(queue: QueueName, payload: BridgeJob) {
        this.buffers[queue].push(payload)
        this.drain()
    }

    async process(queue: QueueName, handler: Handler) {
        this.handlers[queue] = handler
        this.drain()
    }

    private async drain() {
        if (this.isDraining) return
        this.isDraining = true
        try {
            for (const q of Object.keys(this.buffers) as QueueName[]) {
                const handler = this.handlers[q]
                if (!handler) continue
                while (this.buffers[q].length) {
                    const job = this.buffers[q].shift()
                    try {
                        await handler(job as BridgeJob)
                    } catch (err) {
                        // tối giản: push lại cuối hàng (retry nghèo nàn). Có thể thêm backoff ở đây.
                        console.error(`[queue:${q}] handler error -> requeue`, err)
                        this.buffers[q].push(job as BridgeJob)
                        break
                    }
                }
            }
        } finally {
            this.isDraining = false
        }
    }
}
