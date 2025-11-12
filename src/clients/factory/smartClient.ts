import {
  Chain,
  Transport,
  createPublicClient,
  http,
  webSocket,
  type PublicClient,
} from "viem";

type SmartOpts = {
  wsUrl?: string;
  httpUrl: string;
  wsRetryCount?: number;
  wsRetryDelay?: number;
  probeTimeoutMs?: number;
};

type SmartClientOpts = {
  httpUrl: string;
  wsUrl?: string;   // optional; if không hỗ trợ WS thì bỏ
  pollingIntervalMs?: number; // cho HTTP polling
};

function withTimeout<T>(p: Promise<T>, ms: number, label = "timeout"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(label)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

/**
 * Tạo transport “thông minh”:
 * - Nếu có wsUrl: thử khởi tạo WS transport và “probe” getBlockNumber với timeout.
 * - Nếu probe thất bại (403/timeout/mạng), fallback sang HTTP.
 */
export async function createSmartTransport(
  chain: Chain,
  opts: SmartOpts
): Promise<Transport> {
  const {
    wsUrl,
    httpUrl,
    wsRetryCount = 3,
    wsRetryDelay = 1_000,
    probeTimeoutMs = 3_000,
  } = opts;

  if (!wsUrl) return http(httpUrl);

  const wsTransport = webSocket(wsUrl, {
    retryCount: wsRetryCount,
    retryDelay: wsRetryDelay,
  });

  const probe = createPublicClient({
    chain,
    transport: wsTransport,
  });

  try {
    await withTimeout(probe.getBlockNumber(), probeTimeoutMs, "ws probe timeout");
    return wsTransport;
  } catch (err) {
    // Fallback HTTP
    return http(httpUrl);
  }
}

/** Public client: tự fallback WS→HTTP */
export function createSmartPublicClient(
  chain: Chain,
  { httpUrl, wsUrl, pollingIntervalMs = 5_000 }: SmartClientOpts
): PublicClient {
  if (wsUrl && wsUrl.startsWith("wss://")) {
    try {
      return createPublicClient({
        chain,
        transport: webSocket(wsUrl),
      });
    } catch {
      // fallback HTTP polling
    }
  }

  return createPublicClient({
    chain,
    transport: http(httpUrl, { batch: true, fetchOptions: { cache: "no-store" } }),
    pollingInterval: pollingIntervalMs,
  });
}
