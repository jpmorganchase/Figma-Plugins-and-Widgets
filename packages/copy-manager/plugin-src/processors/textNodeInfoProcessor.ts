import { SelectableTextNodeInfo } from "../../shared-src";
import { getNodeKey, getSelected } from "../pluginDataUtils";
import { sortNodeByPosition } from "../utils";
import { iterate } from "./iterate";

export const textNodeInfoTextNodeProcess = (
  node: TextNode,
  settings: any
): SelectableTextNodeInfo[] => {
  if (!node.visible || node.characters.length === 0) {
    return [];
  }

  const key = getNodeKey(node);
  const selected = getSelected(node);

  const nodeInfo = {
    id: node.id,
    key,
    name: node.name,
    characters: node.characters,
    checked: selected,
  };
  console.log("TextNodeProcess", nodeInfo);
  return [nodeInfo];
};

export const textNodeInfoChildrenNodeProcess = (
  node: SceneNode & ChildrenMixin,
  settings: any,
  processors: any
): SelectableTextNodeInfo[] => {
  return node.children
    .slice()
    .sort(sortNodeByPosition)
    .reduce<SelectableTextNodeInfo[]>((prev, child) => {
      return [
        ...prev,
        ...(iterate<SelectableTextNodeInfo[]>(child, settings, processors) ||
          []),
      ];
    }, []);
};

const emptyProcess = () => null;

export const textNodeInfoProcessor = async (
  node: SceneNode,
  settings: any
): Promise<SelectableTextNodeInfo[]> => {
  return (
    iterate<SelectableTextNodeInfo[]>(node, settings, {
      image: emptyProcess,
      text: textNodeInfoTextNodeProcess,
      children: textNodeInfoChildrenNodeProcess,
    }) || []
  );
};
