import {
  createAgentSession,
  DefaultResourceLoader,
  createSyntheticSourceInfo,
  getAgentDir,
  ModelRuntime,
  SessionManager,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import path from "node:path";
//config
const providerId = process.env.DEFAULT_PROVIDERID
  ? process.env.DEFAULT_PROVIDERID
  : "deepseek";
const apiKey = process.env.DEFAULT_API_KEY;
const baseUrl = process.env.DEFAULT_BASE_URL;
const modelId = process.env.DEFAULT_MODELID;
if (!modelId) throw new Error(`can not find this model ${modelId}`);

//register
const modelRuntime = await ModelRuntime.create();
modelRuntime.registerProvider(providerId, {
  baseUrl,
  apiKey,
});
const model = modelRuntime.getModel(providerId, modelId);

//define sessionManager
const sessionManager = SessionManager.create(
  process.cwd(),
  path.join(process.cwd(), "sessions"),
);
const { session } = await createAgentSession({
  modelRuntime,
  model,
  sessionManager: sessionManager,
});

session.subscribe((event) => {
  if (event.type !== "message_update") return;
  if (event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});
session.prompt(`今天是天气如何`);
