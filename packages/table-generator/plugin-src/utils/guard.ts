export const getComponentFromSelection = (
  notify?: (message: string, options?: NotificationOptions) => void
): null | ComponentNode => {
  if (figma.currentPage.selection.length !== 1) {
    notify?.("Select one layer");
    return null;
  }
  const selected = figma.currentPage.selection[0];
  if (selected.type === "COMPONENT") {
    return selected;
  } else if (selected.type === "INSTANCE") {
    const comp = selected.mainComponent;
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
): null | FrameNode => {
  if (figma.currentPage.selection.length !== 1) {
    notify?.("Select one layer");
    return null;
  }

  const selected = figma.currentPage.selection[0];
  if (selected.type === "FRAME") {
    // TODO: add plugin data validation

    return selected;
  } else {
    notify?.("Select a table created by the plugin");
    return null;
  }
};
