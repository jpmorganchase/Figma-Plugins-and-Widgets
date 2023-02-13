import { CsvNodeInfoWithProperId } from "../../shared-src";
import { HeadingSettings, isChildrenMixin, isRectNodeImage } from "../utils";

export type NodeProcessors<T> = {
  text: (node: TextNode, settings: CsvExportSettings) => T | null;
  image: (node: RectangleNode) => T | null;
  children: (
    node: SceneNode & ChildrenMixin,
    settings: CsvExportSettings,
    processors: NodeProcessors<T>
  ) => T | null;
};

export type CsvExportSettings = HeadingSettings & {
  topLvlNodeName: string;
};

export const iterate = <T>(
  node: SceneNode,
  settings: CsvExportSettings,
  processors: NodeProcessors<T>
): T | null => {
  // Ignore invisible nodes
  if (!node.visible) return null;

  if (node.type === "TEXT") {
    return processors.text(node, settings);
  } else if (node.type === "RECTANGLE") {
    if (isRectNodeImage(node)) {
      return processors.image(node);
    } else {
      return null;
    }
  } else if (isChildrenMixin(node)) {
    return processors.children(node, settings, processors);
  } else {
    return null;
  }
};

export type CsvNodeInfoMap = {
  [id: string]: CsvNodeInfoWithProperId;
};

export type UpdaterSettings = HeadingSettings & {
  selectedLang?: string;
};
export type NodeUpdater<T> = {
  text: (
    node: TextNode,
    nodeInfoMap: CsvNodeInfoMap,
    settings: UpdaterSettings
  ) => Promise<T | null>;
  children: (
    node: SceneNode & ChildrenMixin,
    nodeInfoMap: CsvNodeInfoMap,
    settings: UpdaterSettings,
    updaters: NodeUpdater<T>
  ) => Promise<T | null>;
};

export const iterateUpdate = async <T>(
  node: SceneNode,
  nodeInfoMap: CsvNodeInfoMap,
  settings: UpdaterSettings,
  updaters: NodeUpdater<T>
): Promise<T | null> => {
  // Ignore invisible nodes
  if (!node.visible) return null;

  if (node.type === "TEXT") {
    return await updaters.text(node, nodeInfoMap, settings);
  } else if (isChildrenMixin(node)) {
    return await updaters.children(node, nodeInfoMap, settings, updaters);
  } else {
    return null;
  }
};
