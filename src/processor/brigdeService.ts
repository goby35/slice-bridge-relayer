import { eq } from "drizzle-orm";
import { encodeFunctionData } from "viem";
import { envConfig } from "@/core/env";
import { logger } from "@/core/logger";
import { db, bridgeJobs } from "@/db";
import { BridgeJobStatus } from "@/lib/constants";
import { BridgeJob } from "@/db/schemas/bridgeJob";
import { InternalServerError, BadRequestError } from "@/lib/custorm-exceptions";
import { BRIDGE_MINTER_LENS_ABI, BRIDGE_GATEWAY_BSC_ABI  } from "@/abis";
import {
    lensPublicClient,
    lensWalletClient,
    bscPublicClient,
    bscWalletClient
} from "@/clients";

export const mintOnLens = async (job: BridgeJob) => {
    try {
        logger.info(`[mintOnLens-service] Minting ${job.amount} to ${job.to} for job ID ${job.id}`);
        const data = encodeFunctionData({
            abi: BRIDGE_MINTER_LENS_ABI,
            functionName: "mintTo",
            args: [
                job.to as `0x${string}`,
                BigInt(job.amount),
                job.srcTxHash as `0x${string}`,
                BigInt(job.srcChainId),
                BigInt(job.srcNonce as number)
            ],
        });

        const hash = await lensWalletClient.sendTransaction({
            to: envConfig.LENS_MINTER_ADDRESS as `0x${string}`,
            data
        });

        await db.update(bridgeJobs).set({
            dstTxHash: hash,
            status: BridgeJobStatus.RELAYED
        }).where(eq(bridgeJobs.id, job.id));

        const receipt = await lensPublicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") {
            throw new Error("Transaction failed");
        }

        const [updatedJob] = await db.update(bridgeJobs).set({
            status: BridgeJobStatus.COMPLETED,
        }).where(eq(bridgeJobs.id, job.id)).returning();

        logger.info(`[mintOnLens-service] Minting completed for job ID ${updatedJob.id} - status: ${updatedJob.status}`);
    } catch (e: any) {
        logger.error("[mintOnLens-service] error:" + e?.message || e);
        await db.update(bridgeJobs).set({
            status: BridgeJobStatus.FAILED,
            error: String(e?.message ?? e)
        }).where(eq(bridgeJobs.id, job.id));

        if (e.message && e.message.includes("Execution reverted with reason: processed")) {
            throw new BadRequestError("This bridge request has already been processed.");
        }
        throw new InternalServerError();
    }
};

export const unlockOnBsc = async (job: BridgeJob) => {
    try {
        logger.info(`[unlockOnBsc-service] Unlocking ${job.amount} to ${job.to} for job ID ${job.id}`);
        const data = encodeFunctionData({
            abi: BRIDGE_GATEWAY_BSC_ABI as any,
            functionName: "unlock",
            args: [
                job.to as `0x${string}`,
                BigInt(job.amount),
                job.srcTxHash as `0x${string}`,
                BigInt(job.srcChainId),
                BigInt(job.srcNonce as number)
            ],
        });

        const hash = await bscWalletClient.sendTransaction({
            to: envConfig.BSC_POOL_ADDRESS as `0x${string}`,
            data
        });

        await db.update(bridgeJobs).set({
            dstTxHash: hash,
            status: BridgeJobStatus.RELAYED
        }).where(eq(bridgeJobs.id, job.id));

        const receipt = await bscPublicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") {
            throw new Error("Transaction failed");
        }

        const [updatedJob] = await db.update(bridgeJobs).set({
            status: BridgeJobStatus.COMPLETED,
        }).where(eq(bridgeJobs.id, job.id)).returning();
        
        logger.info(`[unlockOnBsc-service] Unlocking completed for job ID ${updatedJob.id} - status: ${updatedJob.status}`);
    } catch (e: any) {
        logger.error("[unlockOnBsc-service] error:" + e?.message || e);
        await db.update(bridgeJobs).set({
            status: BridgeJobStatus.FAILED,
            error: String(e?.message ?? e)
        }).where(eq(bridgeJobs.id, job.id));

        if (e.message && e.message.includes("Execution reverted with reason: processed")) {
            throw new BadRequestError("This bridge request has already been processed.");
        }
        throw new InternalServerError();
    }
};