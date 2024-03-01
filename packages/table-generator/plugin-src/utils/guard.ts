import { TableConfig } from "../../shared-src";
import { readConfigFromPluginData } from "./pluginData";

export const getComponentFromSelection = async (
  notify?: (message: string, options?: NotificationOptions) => void
): Promise<null | ComponentNode> => {
  if (figma.currentPage.selection.length !== 1) {
    notify?.("Select one layer");
    return null;
  }
  const selected = figma.currentPage.selection[0];
  if (selected.type === "COMPONENT") {
    return selected;
  } else if (selected.type === "INSTANCE") {
    const comp = await selected.getMainComponentAsync();
    if (comp) {
      return comp;
    } else {
      notify?.("Fail to locate component from instance");
      return null;
    }
  } else {
    notify?.("Select a component or instance");
    return null;
  }
};

export const getValidTableFromSelection = (
  notify?: (message: string, options?: NotificationOptions) => void
): null | { node: FrameNode; config: TableConfig } => {
  if (figma.currentPage.selection.length !== 1) {
    notify?.("Select one layer");
    return null;
  }

  const selected = figma.currentPage.selection[0];

  if (selected.type === "FRAME") {
    const pluginData = readConfigFromPluginData(selected);

    if (pluginData) {
      return { node: selected, config: pluginData };
    }
  }

  notify?.("Select a table created by the plugin");
  return null;
};
