import { defineChain } from "viem";
import { envConfig } from "@/core/env";

export const bscTestnet = defineChain({
  id: 97,
  name: "BSC Testnet",
  nativeCurrency: {
    name: "tBNB",
    symbol: "tBNB",
    decimals: 18
  },
  rpcUrls: {
    default: {
        http: [envConfig.BSC_RPC_HTTP!]
    }
  },
});
