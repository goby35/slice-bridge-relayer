import { getAddress } from "viem";
import { and, eq } from "drizzle-orm";
import { logger } from "@/core/logger";
import { getCheckpoint, setCheckpoint, confirmationsOk } from "@/lib/helpers/checkpoint";
import { db, bridgeJobs } from "@/db";
import { BRIDGE_MINTER_LENS_ABI } from "@/abis";
import { envConfig } from "@/core/env";
import { lensPublicClient } from "@/clients";
import { BridgeDirection } from "@/lib/types/bridge";
import { CheckpointKey, EventName, BridgeJobStatus } from "@/lib/constants";
import { existedBridgeChecking } from "@/lib/helpers/existedBridgeChecking";
import bridgeQueue from '@/queues'

export async function burnedListener() {
  const key = CheckpointKey.LENS_BURNED;
  const startBlock = await getCheckpoint(key, envConfig.LENS_START_BLOCK);

  return lensPublicClient.watchContractEvent({
    address: getAddress(envConfig.LENS_MINTER_ADDRESS),
    abi: BRIDGE_MINTER_LENS_ABI,
    eventName: EventName.BURNED, // "Burned"
    fromBlock: BigInt(startBlock),
    onLogs: async (logs) => {
      const latest = await lensPublicClient.getBlockNumber();

      for (const l of logs) {
        const minConf = envConfig.LENS_CONFIRMATIONS;
        if (!confirmationsOk(latest, l.blockNumber!, minConf)) continue;

        const { args } = l as any;
        const from = getAddress(args.from);
        const toOnBsc = getAddress(args.toOnBsc);
        const amount = args.amount as bigint;
        const nonce = Number(args.nonce);

        const srcTxHash = l.transactionHash as `0x${string}`;
        const srcChainId = envConfig.LENS_CHAIN_ID;
        const srcNonce = nonce;

        const existed = await existedBridgeChecking(srcTxHash, srcChainId);
        if (!existed) {
          const [job] = await db.insert(bridgeJobs).values({
            direction: BridgeDirection.LENS2BSC,
            srcChainId,
            dstChainId: envConfig.BSC_CHAIN_ID,
            tokenAddress: envConfig.LENS_WRAPPED_ADDRESS,
            from,
            to: toOnBsc,
            amount: amount.toString(),
            srcTxHash,
            srcNonce,
            status: BridgeJobStatus.PENDING,
          }).returning();

          logger.info(`[burned-listener] burned event detected - from: ${from}, toOnBsc: ${toOnBsc}, amount: ${amount}, srcTxHash: ${srcTxHash}`);
          await bridgeQueue.enqueue('burned', job);
          await setCheckpoint(key, Number(l.blockNumber!));
        }
      }
    },
    onError: (err) => {
      logger.error("[burned-listener] error:" + err?.message || err);
      // Nếu dùng HTTP polling, có thể thêm backoff và tự tăng fromBlock dần
    }
  });
}
