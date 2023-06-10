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
      // TODO: validate config
      return config;
    } catch (e) {
      console.error("Invalid config", pluginData);
    }
  }

  return null;
};
