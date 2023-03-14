import { PostToFigmaMessage, PostToUIMessage } from "../shared-src/messages";
import { generateThemeJson } from "./utils";

const WINDOW_MIN_WIDTH = 400;
const WINDOW_MIN_HEIGHT = 500;

figma.showUI(__html__, {
  themeColors: true,
  width: WINDOW_MIN_WIDTH,
  height: WINDOW_MIN_HEIGHT,
});

figma.ui.onmessage = (msg: PostToFigmaMessage) => {
  if (msg.type === "ui-ready") {
  } else if (msg.type === "generate-json") {
    figma.ui.postMessage({
      type: "generate-json-result",
      data: generateThemeJson(),
    } satisfies PostToUIMessage);
  } else if (msg.type === "resize-window") {
    const { width, height } = msg;
    figma.ui.resize(
      Math.max(width, WINDOW_MIN_WIDTH),
      Math.max(height, WINDOW_MIN_HEIGHT)
    );
  }
};
