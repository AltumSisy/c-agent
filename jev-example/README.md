# jev-example · Zev-1 decision client

A thin client for the [Zev-1 decision model](https://platform.zleap.com/docs/decision)
(`POST /v1/systemone`). Hand the "judgment calls" to Zev-1, get structured answers
with probabilities via Choice / Score / Noul questions, and let code handle
everything else.

```bash
npm install
cp .env.example .env   # fill in ZLEAP_API_KEY
npm run 00             # run the decision example
npm run typecheck
```

## Configuration

`shared/jev.ts` loads `./.env` on startup (existing environment variables take
precedence) and calls `POST /v1/systemone` through the official
[`@typesafe-ai/sdk`](https://www.npmjs.com/package/@typesafe-ai/sdk)
(`TypeSafeClient`, up to 3 retries with backoff on 408 / 429 / 5xx). If
`ZLEAP_API_KEY` is not set, the script exits with an error.

Optional variables: `ZLEAP_BASE_URL` (default `https://api.zleap.com`),
`ZEV_TIMEOUT_MS` (default 30000). If the API is region-restricted, set
`HTTPS_PROXY` (or `HTTP_PROXY`) and requests go through that proxy (passed to the
SDK via its `fetch` option, using undici's `EnvHttpProxyAgent`). `.env` is
git-ignored; never commit your key.

## Usage

```ts
import { ZEV_MODEL, choice, noul, score, systemOne, getChoice, getNoul, getScore } from "./shared/jev.ts";

const req = {
  model: ZEV_MODEL,
  state: "我上周申请了退款，请帮我查询一下处理进度。",
  questions: {
    billing: noul("这条消息是否与账单或退款有关？", {
      true: "涉及付款、账单或退款",
      false: "仅涉及产品使用或技术支持",
    }),
    category: choice("这条客户留言属于哪一类？", {
      billing: "账单、付款或退款问题",
      technical: "产品使用或技术问题",
      other: "其他问题",
    }),
    urgency: score("评估需要处理的紧急程度。", ["可以等待", "本周需要处理", "今天需要处理"]),
  },
};

const res = await systemOne(req);
console.log(getNoul(res, req, "billing"));        // P(yes) in [0, 1]
console.log(getChoice(res, req, "category").choice);
console.log(getScore(res, req, "urgency").score);
```

`shared/jev.ts` is a thin wrapper around the SDK: question types and the
`choice` / `score` / `noul` builders come straight from `@typesafe-ai/sdk`, so
answer types are inferred from the questions (e.g. `choice` is typed as the
option keys). On top of that it maps SDK errors to `ZevUnavailableError`, and
runtime-validates answers (the answer kind must match the question, `choice` must
be one of the `criteria` keys, `score` must be in range) — the SDK does not check
these.

## Safety boundaries

Zev-1's output is **decision evidence, not authorization**:

- Business rules, permissions and final execution are decided by code;
- Low confidence, missing answers or Zev-1 being unavailable degrade gracefully
  (human review / fallback option) instead of surfacing errors to the user;
- A `noul` probability near `0.5` means unsure — pick thresholds by evaluating on
  your own data, don't treat it as a boolean.
