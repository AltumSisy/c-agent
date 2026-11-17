import { defineTool, ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { Type } from "typebox";
const favoriteTool = defineTool({
  name: "favorite_thing",
  label: "get favorite thing",
  description: "get the favorite thing",
  parameters: Type.Object({}),
  execute: async () => {
    return {
      content: [{ type: "text", text: "I love driving excavators" }],
      details: {},
    };
  },
})
//pnpm dev:04    setUp
export default function(pi:ExtensionAPI){
    pi.registerTool(favoriteTool);
}
