import { PostToUIMessage } from "../shared-src";

export type FigmaToUIMessageEvent = MessageEvent<{
  pluginMessage: PostToUIMessage;
}>;
