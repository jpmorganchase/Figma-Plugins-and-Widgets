import { SelectableTextNodeInfo } from "../../shared-src/messages";
import { getNodeKey, getSelected } from "../pluginDataUtils";
import { sortNodeByPosition, DEFAULT_HEADING_SETTINGS } from "../utils";
import { CsvExportSettings, NodeProcessors, iterate } from "./iterate";

export async function scanTextNodesInfo(autoTrigger: boolean) {
  if (figma.currentPage.selection.length === 0) {
    if (!autoTrigger) {
      figma.notify(`Please select something for scanning`);
    }
    return [];
  }

  const textNodesInfo: SelectableTextNodeInfo[] = [];

  for (const selectedNode of figma.currentPage.selection) {
    const info = await textNodeInfoProcessor(selectedNode, {
      ...DEFAULT_HEADING_SETTINGS,
      topLvlNodeName: figma.currentPage.name,
    });
    textNodesInfo.push(...info);
  }

  return textNodesInfo;
}

export const textNodeInfoTextNodeProcess = (
  node: TextNode
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
  settings: CsvExportSettings,
  processors: NodeProcessors<SelectableTextNodeInfo[]>
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
  settings: CsvExportSettings
): Promise<SelectableTextNodeInfo[]> => {
  return (
    iterate<SelectableTextNodeInfo[]>(node, settings, {
      image: emptyProcess,
      text: textNodeInfoTextNodeProcess,
      children: textNodeInfoChildrenNodeProcess,
    }) || []
  );
};
