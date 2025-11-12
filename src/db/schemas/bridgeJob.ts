import { uuid, text, bigint, varchar, numeric, timestamp, unique } from "drizzle-orm/pg-core";
import { bridgeDB } from "../utils"

export const bridgeJobs = bridgeDB.table("bridge_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  direction: varchar("direction", { length: 12 }).notNull(), // "BSC2LENS" | "LENS2BSC"
  srcChainId: bigint("src_chain_id", { mode: "number" }).notNull(),
  dstChainId: bigint("dst_chain_id", { mode: "number" }).notNull(),
  tokenAddress: text("token_address").notNull(),
  from: text("from_address"),
  to: text("to_address").notNull(),
  amount: numeric("amount", { precision: 78, scale: 0 }).notNull(),
  srcTxHash: text("src_tx_hash"),
  srcNonce: bigint("src_nonce", { mode: "number" }),
  dstTxHash: text("dst_tx_hash"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
},
  (table) => {
    return {
      // Định nghĩa ràng buộc UNIQUE kết hợp
      srcChainTxHashUnique: unique("uq_bridge_jobs_src_chain_id_src_tx_hash").on(table.srcChainId, table.srcTxHash),
    };
});

export type BridgeJob = typeof bridgeJobs.$inferSelect;