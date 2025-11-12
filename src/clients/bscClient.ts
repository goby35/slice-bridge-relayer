import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { envConfig } from "@/core/env";
import { bscTestnet } from "../chains/bsc";

export const bscPublic = createPublicClient({
  chain: bscTestnet,
  transport: http(envConfig.BSC_RPC_HTTP!)
});

export const bscWallet = createWalletClient({
  chain: bscTestnet,
  account: privateKeyToAccount(envConfig.RELAYER_PK as `0x${string}`),
  transport: http(envConfig.BSC_RPC_HTTP!)
});