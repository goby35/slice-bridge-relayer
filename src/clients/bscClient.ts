import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createSmartPublicClient } from "@/clients/factory/smartClient";
import { bscTestnet } from "@/chains/bsc";
import { envConfig } from "@/core/env";

export const bscPublicClient = createSmartPublicClient(bscTestnet, {
  httpUrl: envConfig.BSC_RPC_HTTP!,
  wsUrl: envConfig.BSC_RPC_WS, // dùng được WS
});

export const bscWalletClient = createWalletClient({
  chain: bscTestnet,
  account: privateKeyToAccount(envConfig.RELAYER_PK as `0x${string}`),
  transport: http(envConfig.BSC_RPC_HTTP!)
});