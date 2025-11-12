import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { envConfig } from "@/core/env";
import { lensTestnet } from "../chains/lens";

export const lensPublic = createPublicClient({
  chain: lensTestnet,
  transport: http(envConfig.LENS_RPC_HTTP!)
});

export const lensWallet = createWalletClient({
  chain: lensTestnet,
  account: privateKeyToAccount(envConfig.RELAYER_PK as `0x${string}`),
  transport: http(envConfig.LENS_RPC_HTTP!)
});