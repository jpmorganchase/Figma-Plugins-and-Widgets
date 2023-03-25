import { PLUGIN_RELAUNCH_KEY_EDIT_TABLE } from "./pluginData";

export const setRelaunchButton = (node: SceneNode) => {
  // Empty string to just show the button
  node.setRelaunchData({ [PLUGIN_RELAUNCH_KEY_EDIT_TABLE]: "" });
};
