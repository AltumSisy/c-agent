import {
  createAgentSession,
  ModelRuntime,
} from "@earendil-works/pi-coding-agent";
import "dotenv/config";

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

const { session } = await createAgentSession({ modelRuntime, model });

session.prompt("hi");
session.subscribe((event) => {
  if (
    event.type === "message_update" &&
    event.message.role === "assistant" &&
    event.assistantMessageEvent.type === "text_delta"
  ) {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});
