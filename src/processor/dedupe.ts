import { and, eq } from 'drizzle-orm'
import { db, bridgeJobs } from '@/db'
import { BridgeJobStatus } from '@/lib/constants'

export async function alreadyProcessed(srcChainId: number, srcTxHash: `0x${string}`) {
  const rows = await db.select().from(bridgeJobs)
    .where(
      and(
        eq(bridgeJobs.srcChainId, srcChainId),
        eq(bridgeJobs.srcTxHash, srcTxHash)
      )
    )

  if (rows.length === 0) return false
  return [
    BridgeJobStatus.RELAYED,
    BridgeJobStatus.COMPLETED
  ].includes(rows[0].status as BridgeJobStatus)
}
