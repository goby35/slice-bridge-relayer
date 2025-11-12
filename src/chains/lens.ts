import { defineChain } from "viem";
import { envConfig } from "@/core/env";

export const lensTestnet = defineChain({
  id: 37111,
  name: "Lens Testnet",
  nativeCurrency: {
    name: "GRASS",
    symbol: "GRASS",
    decimals: 18
  },
  rpcUrls: {
    default: {
        http: [envConfig.LENS_RPC_HTTP!]
    }
  },
});
