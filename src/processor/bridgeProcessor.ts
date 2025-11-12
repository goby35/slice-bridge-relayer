import { BridgeJob } from '@/db/schemas/bridgeJob'
import { alreadyProcessed } from './dedupe'
import { mintOnLens, unlockOnBsc } from './brigdeService'

export async function handleLocked(job: BridgeJob) {
  const processed = await alreadyProcessed(job.srcChainId, job.srcTxHash as `0x${string}`)
  if (processed) return
  const res = await mintOnLens(job)
  return res
}

export async function handleBurned(job: BridgeJob) {
  const processed = await alreadyProcessed(job.srcChainId, job.srcTxHash as `0x${string}`)
  if (processed) return

  const res = await unlockOnBsc(job)
  return res
}
