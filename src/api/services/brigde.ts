import { eq } from "drizzle-orm";
import { encodeFunctionData } from "viem";
import { envConfig } from "@/core/env";
import { MintRequest, UnlockRequest } from "@/schemas";
import { db, bridgeJobs } from "@/db";
import { lensPublic, lensWallet } from "@/clients/lensClient";
import { bscPublic, bscWallet } from "@/clients/bscClient";
import { BRIDGE_MINTER_ABI, BRIDGE_GATEWAY_BSC_ABI  } from "@/abi";
import { InternalServerError, NotFoundError, BadRequestError } from "@/lib/custorm-exceptions";
import { BridgeJobStatus } from "@/lib/constants/bridgeJobStatus";

const getBridgeStatus = async (id: string) => {
    try {
        const rows = await db.select().from(bridgeJobs).where(eq(bridgeJobs.id, id));
        if (rows.length === 0) {
            throw new NotFoundError("Bridge job not found");
        }
        return rows[0];
    } catch (error) {
        console.error("Error getting bridge status:", error);
        if (error instanceof NotFoundError) {
            throw error;
        }
        throw new InternalServerError();
    }
};

const mint = async (mintData: MintRequest) => {
    const { to, amount, srcTxHash, srcChainId, srcNonce } = mintData;

    let jobResult = null;
    try {
        const [job] = await db.insert(bridgeJobs).values({
            direction: "BSC2LENS",
            srcChainId: srcChainId,
            dstChainId: envConfig.LENS_CHAIN_ID,
            tokenAddress: envConfig.LENS_WRAPPED_ADDRESS!,
            to: to,
            amount: amount.toString(), // hoặc bigint column
            srcTxHash: srcTxHash,
            srcNonce: srcNonce,
            status: BridgeJobStatus.PENDING,
        }).returning();

        jobResult = job;

        const data = encodeFunctionData({
            abi: BRIDGE_MINTER_ABI as any,
            functionName: "mintTo",
            args: [
                to as `0x${string}`,
                amount,
                srcTxHash as `0x${string}`,
                BigInt(srcChainId),
                BigInt(srcNonce)
            ],
        });

        const hash = await lensWallet.sendTransaction({
            to: envConfig.LENS_MINTER_ADDRESS as `0x${string}`,
            data
        });

        await db.update(bridgeJobs).set({
            dstTxHash: hash,
            status: BridgeJobStatus.RELAYED
        }).where(eq(bridgeJobs.id, job.id));

        const receipt = await lensPublic.waitForTransactionReceipt({ hash });

        if (receipt.status !== "success") {
            throw new Error("Transaction failed");
        }

        await db.update(bridgeJobs).set({
            status: BridgeJobStatus.COMPLETED,
        }).where(eq(bridgeJobs.id, job.id));

        return {
            id: job.id,
            direction: job.direction,
            srcChainId: job.srcChainId,
            dstChainId: job.dstChainId,
            tokenAddress: job.tokenAddress,
            to: job.to,
            amount: job.amount,
            txHash: hash
        };
    } catch (e: any) {
        console.error("Error during minting process:", e);
        if (jobResult) {
            await db.update(bridgeJobs).set({
                status: BridgeJobStatus.FAILED,
                error: String(e?.message ?? e)
            }).where(eq(bridgeJobs.id, jobResult.id));
        }

        if (e.message && e.message.includes("Execution reverted with reason: processed")) {
            throw new BadRequestError("This bridge request has already been processed.");
        }
        throw new InternalServerError();
    }
};

const unlock = async (unlockData: UnlockRequest) => {
    const { toOnBsc, amount, srcTxHash, srcChainId, srcNonce } = unlockData;

    let jobResult = null;
    try {
        const [job] = await db.insert(bridgeJobs).values({
            direction: "LENS2BSC",
            srcChainId: envConfig.LENS_CHAIN_ID,
            dstChainId: envConfig.BSC_CHAIN_ID,
            tokenAddress: envConfig.BSC_TOKEN_ADDRESS!,
            to: toOnBsc,
            amount: amount.toString(), // hoặc bigint column
            srcTxHash: srcTxHash,
            srcNonce: srcNonce,
            status: BridgeJobStatus.PENDING,
        }).returning();
        jobResult = job;

        const data = encodeFunctionData({
            abi: BRIDGE_GATEWAY_BSC_ABI as any,
            functionName: "unlock",
            args: [
                toOnBsc as `0x${string}`,
                amount,
                srcTxHash as `0x${string}`,
                BigInt(srcChainId),
                BigInt(srcNonce)
            ],
        });

        const hash = await bscWallet.sendTransaction({
            to: envConfig.BSC_POOL_ADDRESS as `0x${string}`,
            data
        });

        await db.update(bridgeJobs).set({
            dstTxHash: hash,
            status: BridgeJobStatus.RELAYED
        }).where(eq(bridgeJobs.id, job.id));

        const receipt = await bscPublic.waitForTransactionReceipt({ hash });

        if (receipt.status !== "success") {
            throw new Error("Transaction failed");
        }

        await db.update(bridgeJobs).set({
            status: BridgeJobStatus.COMPLETED,
        }).where(eq(bridgeJobs.id, job.id));
        return {
            id: job.id,
            direction: job.direction,
            srcChainId: job.srcChainId,
            dstChainId: job.dstChainId,
            tokenAddress: job.tokenAddress,
            to: job.to,
            amount: job.amount,
            txHash: hash
        };
    } catch (e: any) {
        console.error("Error during unlocking process:", e);
        if (jobResult) {
            await db.update(bridgeJobs).set({
                status: BridgeJobStatus.FAILED,
                error: String(e?.message ?? e)
            }).where(eq(bridgeJobs.id, jobResult.id));
        }
        throw new InternalServerError();
    }
};

export default {
    getBridgeStatus,
    mint,
    unlock
};