import {
  createAgentSession,
  defineTool,
  ModelRuntime,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

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

//define customer tool
const foolUtcTimeTool = defineTool({
  name: "utc_time",
  label: "get utc time",
  description: "get the current utc time",
  parameters: Type.Object({}),
  execute: async () => {
    return {
      content: [{ type: "text", text: "the current utc time is 10:20" }],
      details: {},
    };
  },
});

const { session } = await createAgentSession({
  modelRuntime,
  model,
  customTools: [foolUtcTimeTool],
});

session.subscribe((event) => {
  if (event.type !== "message_update") return;
  if (event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});
session.prompt(`what is the current utc time?`);
