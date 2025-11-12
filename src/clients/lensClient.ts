import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
// import { createSmartPublicClient } from "@/clients/factory/smartClient";
import { lensTestnet } from "@/chains/lens";
import { envConfig } from "@/core/env";

export const lensPublicClient = createPublicClient({
  chain: lensTestnet,
  transport: http(process.env.LENS_RPC_HTTP!),
});

export const lensWalletClient = createWalletClient({
  chain: lensTestnet,
  account: privateKeyToAccount(envConfig.RELAYER_PK as `0x${string}`),
  transport: http(envConfig.LENS_RPC_HTTP!)
});