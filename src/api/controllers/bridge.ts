import type { Context } from "hono";
import { MintRequestSchema, UnlockRequestSchema } from "@/schemas";
import bridgeService from "../services/brigde";
import { AppError } from "@/lib/custorm-exceptions";
import { SuccessResponse } from "@/lib/custorm-response";

const getBridgeStatus = async (c: Context) => {
    try {
        const id = c.req.param("id");
        if (!id) {
            return c.json({ error: "Missing bridge job ID" }, 400);
        }
        const result = await bridgeService.getBridgeStatus(id);
        return c.json(new SuccessResponse(200, "Bridge job fetched successfully", result));
    } catch (error) {
        if (error instanceof AppError) {
            return c.json({ code: error.code, message: error.message }, error.status);
        }
        return c.json({ error: "Failed to fetch bridge status" }, 500);
    }
};

const mint = async (c: Context) => {
    const body = await c.req.json();
    try {
        const parsed = MintRequestSchema.safeParse(body);
        if (!parsed.success) {
            return c.json({ error: "Invalid request data", details: parsed.error }, 400);
        }
        const result = await bridgeService.mint(parsed.data);
        return c.json(new SuccessResponse(200, "Minting initiated successfully", result));
    } catch (error) {
        if (error instanceof AppError) {
            return c.json({ code: error.code, message: error.message }, error.status);
        }
        return c.json({ error: "Minting failed" }, 500);
    }
}

const unlock = async (c: Context) => {
    const body = await c.req.json();
    try {
        const parsed = UnlockRequestSchema.safeParse(body);
        if (!parsed.success) {
            return c.json({ error: "Invalid request data", details: parsed.error }, 400);
        }

        const result = await bridgeService.unlock(parsed.data);
        return c.json(new SuccessResponse(200, "Unlocking initiated successfully", result));
    } catch (error) {
        if (error instanceof AppError) {
            return c.json({ code: error.code, message: error.message }, error.status);
        }
        return c.json({ error: "Unlocking failed" }, 500);
    }
}

export default {
    getBridgeStatus,
    mint,
    unlock
};
