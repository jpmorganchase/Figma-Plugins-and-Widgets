import { TableConfig } from "../../shared-src";

export const PLUGIN_SHARED_NAMESPACE = "TableGenerator";
export const PLUGIN_DATA_KEY_CONFIG = "Table Config";

export const writeConfigToPluginData = (
  frame: FrameNode,
  config: TableConfig
) => {
  frame.setSharedPluginData(
    PLUGIN_SHARED_NAMESPACE,
    PLUGIN_DATA_KEY_CONFIG,
    JSON.stringify(config)
  );
};

export const validateConfig = (config: unknown): boolean => {
  if (typeof config === "object" && config !== null) {
    if (typeof (config as any).rows !== "number") {
      return false;
    }
    if (typeof (config as any).columns !== "number") {
      return false;
    }
    if (typeof (config as any).headerCell !== "object") {
      return false;
    }
    if (typeof (config as any).bodyCell !== "object") {
      return false;
    }
    return true;
  }

  return false;
};

export const readConfigFromPluginData = (
  frame: FrameNode
): TableConfig | null => {
  const pluginData = frame.getSharedPluginData(
    PLUGIN_SHARED_NAMESPACE,
    PLUGIN_DATA_KEY_CONFIG
  );
  if (pluginData) {
    try {
      const config = JSON.parse(pluginData);
      if (validateConfig(config)) {
        return config;
      } else {
        console.error("Invalid config", pluginData);
        return null;
      }
    } catch (e) {
      console.error("Invalid config", pluginData);
    }
  }

  return null;
};
