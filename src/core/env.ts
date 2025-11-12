import dotenv from "dotenv";

if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.production" });
} else {
  dotenv.config({ path: ".env" });
}

export const envConfig = {
  NODE_ENV: process.env.NODE_ENV || "development",
  LENS_RPC_HTTP: process.env.LENS_RPC_HTTP || "https://rpc.lens.dev",
  LENS_CHAIN_ID: Number(process.env.LENS_CHAIN_ID || 37111),
  LENS_MINTER_ADDRESS: process.env.LENS_MINTER_ADDRESS!,
  LENS_WRAPPED_ADDRESS: process.env.LENS_WRAPPED_ADDRESS!,
  BSC_RPC_HTTP: process.env.BSC_RPC_HTTP!,
  BSC_CHAIN_ID: Number(process.env.BSC_CHAIN_ID || 97),
  BSC_TOKEN_ADDRESS: process.env.BSC_TOKEN_ADDRESS!,
  BSC_POOL_ADDRESS: process.env.BSC_POOL_ADDRESS!,
  RELAYER_PK: process.env.RELAYER_PK!,
  DATABASE_URL: process.env.DATABASE_URL!,
};