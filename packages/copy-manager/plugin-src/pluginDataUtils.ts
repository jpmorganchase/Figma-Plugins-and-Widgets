export const PLUGIN_DATA_SHARED_NAMESPACE = "CONTENT_COPY";
export const PLUGIN_DATA_KEY_PERSISTED_DATA = "PERSISTED_DATA";
export const PLUGIN_RELAUNCH_KEY_REVIEW_REVISION = "review-revision";

export const PLUGIN_DATA_NODE_KEY_KEY = "NODE_KEY";
export const PLUGIN_DATA_SELECTED_KEY = "SELECTED";

export const getNodeKey = (node: TextNode): string => {
  const pluginData = node.getSharedPluginData(
    PLUGIN_DATA_SHARED_NAMESPACE,
    PLUGIN_DATA_NODE_KEY_KEY
  );
  if (pluginData) {
    return pluginData;
  } else {
    return "";
  }
};

export const writeNodeKey = (node: TextNode, key: string) => {
  node.setSharedPluginData(
    PLUGIN_DATA_SHARED_NAMESPACE,
    PLUGIN_DATA_NODE_KEY_KEY,
    key
  );
};

export const updateNodeKey = (id: string, key: string) => {
  //   console.log("updateNodeKey", { id, key });
  const nodeToFind = figma.root.findOne((x) => x.id === id);
  if (nodeToFind) {
    writeNodeKey(nodeToFind as any, key);
  }
};

export const getSelected = (node: TextNode): boolean => {
  const pluginData = node.getSharedPluginData(
    PLUGIN_DATA_SHARED_NAMESPACE,
    PLUGIN_DATA_SELECTED_KEY
  );
  console.log("getSelected", node.name, { pluginData });
  if (pluginData) {
    console.log("getSelected true");
    return true;
  } else {
    return false;
  }
};

export const writeSelected = (node: TextNode, selected: boolean) => {
  // console.log("writeSelected", node.name, selected);
  node.setSharedPluginData(
    PLUGIN_DATA_SHARED_NAMESPACE,
    PLUGIN_DATA_SELECTED_KEY,
    selected ? "1" : ""
  );
  // console.log("after set plugin data", getSelected(node));
};

export const updateNodeSelected = (id: string, selected: boolean) => {
  //   console.log("updateNodeKey", { id, key });
  const nodeToFind = figma.root.findOne((x) => x.id === id);
  if (nodeToFind) {
    writeSelected(nodeToFind as any, selected);
  }
};

export const persistInFigma = (data: string) => {
  console.log("persistInFigma", data);
  figma.root.setSharedPluginData(
    PLUGIN_DATA_SHARED_NAMESPACE,
    PLUGIN_DATA_KEY_PERSISTED_DATA,
    data
  );
};

export const readPersistedData = () => {
  const persistedData = figma.root.getSharedPluginData(
    PLUGIN_DATA_SHARED_NAMESPACE,
    PLUGIN_DATA_KEY_PERSISTED_DATA
  );
  console.log("readPersistedData", persistedData);
  return persistedData;
};
