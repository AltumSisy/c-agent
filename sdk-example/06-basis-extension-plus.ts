import { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  createAgentSession,
  DefaultResourceLoader,
  ExtensionFactory,
  getAgentDir,
  ModelRuntime,
  createEventBus,
} from "@earendil-works/pi-coding-agent";

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

//eventBus define
const eventFeeback = "inline-extension:status";
const eventBus = createEventBus();
eventBus.on(eventFeeback, (data) => {
  process.stdout.write(`[eventBus notice]: ${JSON.stringify(data)}\n`);
});

//define extensionFactory
const extensionAPI: ExtensionFactory = (pi) => {
  pi.on("agent_start", () => {
    pi.events.emit(eventFeeback, { status: "agent 启动中\n" });
    process.stdout.write("[inline extension]\: agent start\n");
  });
  pi.on("tool_call", (ctx) => {
    process.stdout.write(`[lnline extension tool called]: ${ctx.toolName}\n`);
    if (ctx.toolName === "bash" || ctx.toolName === "write") {
      return {
        block: true,
        reason: "不给你使用bash write 工具",
      };
    }
  });
};

const loader = new DefaultResourceLoader({
  cwd: process.cwd(),
  agentDir: getAgentDir(),
  eventBus,
  extensionFactories: [extensionAPI],
});
await loader.reload();

const { session } = await createAgentSession({
  modelRuntime,
  model,
  resourceLoader: loader,
});

session.subscribe((event) => {
  if (event.type !== "message_update") return;
  if (event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});
session.prompt(`帮我在当前目录写一个文件 test.md 里面写一个hello`);
