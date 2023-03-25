import { ParseResult } from "papaparse";
import { PostToFigmaMessage } from "../shared-src";
import { PLUGIN_RELAUNCH_KEY_EDIT_TABLE } from "./utils/pluginData";

const MIN_WIDTH = 340;
const MIN_HEIGHT = 340;

figma.showUI(__html__, {
  themeColors: true,
  height: MIN_HEIGHT,
  width: MIN_WIDTH,
});

figma.ui.onmessage = async (msg: PostToFigmaMessage) => {
  switch (msg.type) {
    case "ui-finish-loading": {
      break;
    }
    case "resize-window": {
      const { width, height } = msg;
      figma.ui.resize(Math.max(width, MIN_WIDTH), Math.max(height, MIN_HEIGHT));
      break;
    }
    default: {
      console.error("Unimplemented onmessage type:", msg.type);
    }
  }
};

if (figma.command) {
  // Relaunching from relaunch button
  switch (figma.command) {
    case PLUGIN_RELAUNCH_KEY_EDIT_TABLE: {
      figma.notify("Relaunched! Not yet implemented");
      break;
    }
    default:
      figma.notify(`Unknown figma command: ${figma.command}`, { error: true });
  }
}
