import { getAddress, getAbiItem } from "viem";
import { logger } from "@/core/logger";
import { getCheckpoint, setCheckpoint } from "@/lib/helpers/checkpoint";
import { db, bridgeJobs } from "@/db";
import { BRIDGE_MINTER_LENS_ABI } from "@/abis";
import { envConfig } from "@/core/env";
import { lensPublicClient } from "@/clients";
import { BridgeDirection } from "@/lib/types/bridge";
import { CheckpointKey, EventName, BridgeJobStatus } from "@/lib/constants";
import { existedBridgeChecking } from "@/lib/helpers/existedBridgeChecking";
import { backfillInWindows } from "@/lib/helpers/backfill";
import bridgeQueue from '@/queues'

export async function burnedListener() {
  const key = CheckpointKey.LENS_BURNED;
  const minter = getAddress(envConfig.LENS_MINTER_ADDRESS);
  const start = BigInt(await getCheckpoint(key, envConfig.LENS_START_BLOCK));
  const latest = await lensPublicClient.getBlockNumber();

  const lockedEventAbi = getAbiItem({
    abi: BRIDGE_MINTER_LENS_ABI,
    name: EventName.BURNED,
  });

  await backfillInWindows({
    client: lensPublicClient,
    address: minter,
    event: lockedEventAbi,
    fromBlock: start,
    toBlock: latest > 0n ? latest - 1n : 0n,
    window: 20_000,
    onLogs: async (logs) => {
      for (const l of logs) {
        await handleBurnedLog(l);
        await setCheckpoint(key, Number(l.blockNumber!));
      }
    },
  });

  console.log("burned blocknumber latest:", latest);

  return lensPublicClient.watchContractEvent({
    address: minter,
    abi: BRIDGE_MINTER_LENS_ABI,
    eventName: EventName.BURNED,
    fromBlock: latest, // từ block mới nhất
    onLogs: async (logs) => {
      console.log("Received burned logs:", logs.length);
      const tip = await lensPublicClient.getBlockNumber();
      console.log("Current tip block number:", tip);
      console.log("logs:", logs);
      for (const l of logs) {
        await handleBurnedLog(l);
        await setCheckpoint(key, Number(l.blockNumber!));
      }
    },
    onError: (err) => {
      if (err?.message?.includes("Invalid parameters were provided to the RPC method")) {
        logger.warn({ detail: err.cause }, "[burned-listener] watchContractEvent stopped due to missing parameters, restarting listener...");
        return;
      }
      logger.error({ detail: err.message }, "[burned-listener] error");
    },
  });
}

async function handleBurnedLog(l: any) {
  const { args } = l;
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
  }
}
