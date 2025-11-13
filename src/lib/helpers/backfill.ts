import type { PublicClient, Log, AbiEvent } from "viem";
import { logger } from "@/core/logger";

type BackfillOpts = {
    client: PublicClient;
    address: `0x${string}`;
    event: AbiEvent;
    fromBlock: bigint;
    toBlock: bigint;
    window?: number; // ví dụ 10_000
    onLogs: (logs: Log[]) => Promise<void> | void;
};

const getNetworkNameByEventName = (eventName: string) => {
    return eventName.includes('Locked') ? 'BSC' : 'Lens Chain';
}

export async function backfillInWindows({
    client,
    address,
    event,
    fromBlock,
    toBlock,
    window = 10_000,
    onLogs,
}: BackfillOpts) {
    let start = fromBlock;
    const end = toBlock;

    logger.info(`Starting backfill on ${getNetworkNameByEventName(event.name)} from block ${fromBlock} to ${toBlock} in windows of ${window} blocks.`);
    while (start <= end) {
        const chunkEnd = start + BigInt(window);
        const curEnd = chunkEnd > end ? end : chunkEnd;
        try {
            const logs = await client.getLogs({
                address,
                event,
                fromBlock: start,
                toBlock: curEnd,
            });

            logger.info(`Backfilled logs from block ${start} to ${curEnd} on ${getNetworkNameByEventName(event.name)}. Retrieved ${logs.length} logs.`);
            logger.debug({ logs }, 'logs:');

            if (logs.length) {
                await onLogs(logs);
            }
        } catch (err) {
            // bỏ qua lỗi để tiếp tục backfill
            logger.warn(`${getNetworkNameByEventName(event.name)} backfill from block ${start} to ${curEnd}, skipping` + ` due to error: ${(err as Error).message}`);
        }

        start = curEnd + 1n;
    }
}