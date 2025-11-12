import { eq, and } from "drizzle-orm";
import { db, bridgeJobs } from "@/db";

export async function existedBridgeChecking(srcTxHash: `0x${string}`, srcChainId: number) {
    try {
        const exists = await db.select().from(bridgeJobs).where(
            and(
                eq(bridgeJobs.srcTxHash, srcTxHash),
                eq(bridgeJobs.srcChainId, srcChainId)
            )
        );
        return exists.length > 0;
    } catch (error) {
        console.error("Error checking existing bridge job:", error);
        throw error;
    }
}