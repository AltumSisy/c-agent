import {
  createAgentSession,
  DefaultResourceLoader,
  createSyntheticSourceInfo,
  getAgentDir,
  ModelRuntime,
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

//define customer tool
const filePath = "D:\code\c-agent\sdk-example\workspace\skills\plant-care-manual\plant-care-manual.md";
const loader = new DefaultResourceLoader({
  cwd: process.cwd(),
  agentDir: getAgentDir(),
  skillsOverride: (current) => {
    return {
      skills: [
        {
          name: "plant-care-manual",
          description:
            "为家庭养花用户生成个性化养护注意手册，并根据植物种类、环境条件、症状照片或文字描述，排查浇水、光照、通风、土壤、施肥、换盆、病虫害与安全风险。用户提到养花、绿植养护、叶子发黄、烂根、焦边、徒长、掉蕾、长虫、浇水频率、施肥、换盆、越冬、宠物安全、植物手册时使用",
          filePath: filePath,
          baseDir: path.dirname(filePath),
          sourceInfo: createSyntheticSourceInfo(filePath, { source: "sdk" }),
          disableModelInvocation: false,
        },
      ],
      diagnostics: current.diagnostics,
    };
  },
});
await loader.reload();

process.stdout.write(`loaded skills:\n`);
for(const skill of loader.getSkills().skills){
    process.stdout.write(`${skill.name}: ${skill.description}\n`)
}
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
session.prompt(`我买了一个睡莲，要怎么去养？`);
