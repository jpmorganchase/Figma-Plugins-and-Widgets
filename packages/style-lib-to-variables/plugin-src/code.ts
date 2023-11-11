import { PostToFigmaMessage, PostToUIMessage } from "../shared-src/messages";
import {
  createVariablesFromLibrary,
  deleteSelectedLibrary,
  getAvailableLibraries,
  importJson,
  restoreSelectedLibrary,
  storeLibraryStyles,
} from "./utils";

const WINDOW_MIN_WIDTH = 400;
const WINDOW_MIN_HEIGHT = 500;

figma.showUI(__html__, {
  themeColors: true,
  width: WINDOW_MIN_WIDTH,
  height: WINDOW_MIN_HEIGHT,
});

figma.ui.onmessage = async (msg: PostToFigmaMessage) => {
  try {
    if (msg.type === "ui-ready") {
    } else if (msg.type === "resize-window") {
      const { width, height } = msg;
      figma.ui.resize(
        Math.max(width, WINDOW_MIN_WIDTH),
        Math.max(height, WINDOW_MIN_HEIGHT)
      );
    } else if (msg.type === "store-library-styles") {
      await storeLibraryStyles();
      const libraries = await getAvailableLibraries();
      figma.ui.postMessage({
        type: "read-available-library-result",
        libraries,
      } satisfies PostToUIMessage);
    } else if (msg.type === "delete-library-styles") {
      await deleteSelectedLibrary(msg.selectedLibrary);
      const libraries = await getAvailableLibraries();
      figma.ui.postMessage({
        type: "read-available-library-result",
        libraries,
      } satisfies PostToUIMessage);
    } else if (msg.type === "restore-library-styles") {
      await restoreSelectedLibrary(
        msg.selectedLibrary,
        msg.collectionName,
        msg.modeName
      );
    } else if (msg.type === "read-available-library") {
      const libraries = await getAvailableLibraries();
      figma.ui.postMessage({
        type: "read-available-library-result",
        libraries,
      } satisfies PostToUIMessage);
    } else if (msg.type === "create-variables-from-library") {
      await createVariablesFromLibrary(
        msg.selectedLibrary,
        msg.collectionName,
        msg.modeName,
        msg.useAlias,
        msg.aliasCollectionName,
        msg.aliasModeName
      );
      figma.notify("Created variables");
    } else if (msg.type === "import-json") {
      await importJson(
        msg.collectionName,
        msg.modeName,
        msg.aliasCollectionName,
        msg.aliasModeName,
        msg.jsonContent
      );
      figma.notify("JSON imported");
    }
  } catch (error) {
    if (typeof error === "string") {
      figma.notify(error, { error: true });
    } else {
      figma.notify((error as any).message, { error: true });
    }
  }
};
