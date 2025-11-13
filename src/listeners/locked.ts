import { getAddress, getAbiItem } from "viem";
import { logger } from "@/core/logger";
import { db, bridgeJobs } from "@/db";
import { BRIDGE_GATEWAY_BSC_ABI } from "@/abis";
import { envConfig } from "@/core/env";
import { bscPublicClient } from "@/clients";
import { BridgeDirection } from "@/lib/types/bridge";
import { CheckpointKey, EventName, BridgeJobStatus } from "@/lib/constants";
import { getCheckpoint, setCheckpoint } from "@/lib/helpers/checkpoint";
import { backfillInWindows } from "@/lib/helpers/backfill";
import { existedBridgeChecking } from "@/lib/helpers/existedBridgeChecking";
import bridgeQueue from '@/queues'

export async function lockedListener() {
  const key = CheckpointKey.BSC_LOCKED;
  const pool = getAddress(envConfig.BSC_POOL_ADDRESS);
  const start = BigInt(await getCheckpoint(key, envConfig.BSC_START_BLOCK));
  const latest = await bscPublicClient.getBlockNumber();

  const lockedEventAbi = getAbiItem({
    abi: BRIDGE_GATEWAY_BSC_ABI,
    name: EventName.LOCKED,
  });

  await backfillInWindows({
    client: bscPublicClient,
    address: pool,
    event: lockedEventAbi,
    fromBlock: start,
    toBlock: latest > 0n ? latest - 1n : 0n,
    window: 10_000,
    onLogs: async (logs) => {
      for (const l of logs) {
        await handleLockedLog(l);
        await setCheckpoint(key, Number(l.blockNumber!));
      }
    },
  });

  console.log("locked blocknumber latest:", latest);

  return bscPublicClient.watchContractEvent({
    address: pool,
    abi: BRIDGE_GATEWAY_BSC_ABI,
    eventName: EventName.LOCKED,
    fromBlock: latest, // từ block mới nhất
    onLogs: async (logs) => {
      console.log("Received burned logs:", logs.length);
      const tip = await bscPublicClient.getBlockNumber();
      console.log("Current tip block number:", tip);
      console.log("logs:", logs);
      for (const l of logs) {
        await handleLockedLog(l);
        await setCheckpoint(key, Number(l.blockNumber!));
      }
    },
    onError: (err) => {
      if (err?.message?.includes("Missing or invalid parameters")) {
        logger.warn({ detail: err.cause }, "[locked-listener] watchContractEvent stopped due to missing parameters, restarting listener...");
        return;
      }
      logger.error({ detail: err.message }, "[locked-listener] error");
    },
  });
}

async function handleLockedLog(l: any) {
  const { args } = l;
  const from = getAddress(args.from);
  const toOnLens = getAddress(args.toOnLens);
  const amount = args.amount as bigint;
  const nonce = Number(args.nonce);
  const dstChainId = Number(args.dstChainId);

  if (dstChainId !== envConfig.LENS_CHAIN_ID) return;

  const srcTxHash = l.transactionHash as `0x${string}`;
  const srcChainId = envConfig.BSC_CHAIN_ID;
  const srcNonce = nonce;

  const existed = await existedBridgeChecking(srcTxHash, srcChainId);
  if (!existed) {
    const [job] = await db.insert(bridgeJobs).values({
      direction: BridgeDirection.BSC2LENS,
      srcChainId,
      dstChainId,
      tokenAddress: envConfig.BSC_TOKEN_ADDRESS,
      from,
      to: toOnLens,
      amount: amount.toString(),
      srcTxHash,
      srcNonce,
      status: BridgeJobStatus.PENDING,
    }).returning();

    logger.info(`[locked-listener] locked event detected - from: ${from}, toOnLens: ${toOnLens}, amount: ${amount}, srcTxHash: ${srcTxHash}`);
    await bridgeQueue.enqueue('locked', job);
  }
}
