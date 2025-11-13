import { eq } from "drizzle-orm";
import { db, checkpoints } from "@/db";
import { logger } from "@/core/logger";

export async function getCheckpoint(key: string, fallbackBlock: number) {
  const rows = await db.select().from(checkpoints).where(eq(checkpoints.key, key));
  if (rows.length) return rows[0].lastBlock;
  await db.insert(checkpoints).values({ key, lastBlock: fallbackBlock });
  return fallbackBlock;
}

export async function setCheckpoint(key: string, block: number) {
  logger.info(`[checkpoint] set ${key} to block ${block}`);
  await db.insert(checkpoints)
    .values({ key, lastBlock: block })
    .onConflictDoUpdate({ target: checkpoints.key, set: { lastBlock: block }});
}
