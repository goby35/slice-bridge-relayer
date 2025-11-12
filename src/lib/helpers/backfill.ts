import type { PublicClient, Log, AbiEvent } from "viem";

type BackfillOpts = {
    client: PublicClient;
    address: `0x${string}`;
    event: AbiEvent;
    fromBlock: bigint;
    toBlock: bigint;
    window?: number; // ví dụ 10_000
    onLogs: (logs: Log[]) => Promise<void> | void;
};

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

            if (logs.length) {
                await onLogs(logs);
            }
        } catch (err) {
            // bỏ qua lỗi để tiếp tục backfill
            console.log(`Backfill from block ${start} to ${curEnd}, skipping`);
        }

        start = curEnd + 100_000n;
    }
}