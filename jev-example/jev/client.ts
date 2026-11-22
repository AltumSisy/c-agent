import {
  APIConnectionError,
  APIError,
  Questions,
  SystemOneRequest,
  SystemOneResult,
  TypeSafeClient,
} from "@typesafe-ai/sdk";
import { config } from "dotenv";

export class ZevUnavailableError extends Error {}
export class ZevAnswerError extends Error {}

const DEFAULT_ZEV_MODEL = process.env.ZEV_MODEL;
const DEFAULT_ZEV_BASEURL = process.env.ZEV_BASE_URL;
const DEFAULT_ZEV_APIKEY = process.env.ZEV_APIKEY;
const MAX_RETRIES = 3;
const TIMEOUT_MS = Number(process.env.ZEV_TIMEOUT_MS ?? 30_000);

export interface ZevClient {
  client: TypeSafeClient;
  ask<const Q extends Questions>(
    req: SystemOneRequest<Q>,
  ): Promise<SystemOneResult<Q>>;
}

export function getEnsureClient() {
  if (!process.env.ZLEAP_API_KEY?.trim()) {
    console.error(
      "❌ ZLEAP_API_KEY is not set: add it to ./.env (see .env.example).",
    );
    process.exit(1);
  }
  return new TypeSafeClient({
    apiKey: DEFAULT_ZEV_APIKEY,
    baseURL: DEFAULT_ZEV_BASEURL,
    defaultModel: DEFAULT_ZEV_MODEL,
    retry: { maxRetries: MAX_RETRIES },
    timeout: TIMEOUT_MS,
  });
}
export function createTypeSafeZev(): ZevClient {
  const client = getEnsureClient();
  return {
    client,
    async ask(req) {
      try {
        return await client.systemOne(req);
      } catch (err) {
        if (err instanceof APIError)
          throw new ZevUnavailableError(`HTTP ${err.status}: ${err.message}`);
        if (err instanceof APIConnectionError)
          throw new ZevUnavailableError(`Request failed: ${err.message}`);
        throw err;
      }
    },
  };
}
