import { TableConfig } from "../../shared-src";
import { getComponentByKey } from "./component";
import { writeConfigToPluginData } from "./pluginData";

export const generateTable = async (
  config: TableConfig,
  notify?: (message: string, options?: NotificationOptions) => void
) => {
  const { columns, rows, bodyCell, headerCell } = config;
  if (bodyCell === null) {
    notify?.("Cannot find valid body cell");
    return;
  }
  if (headerCell === null) {
    notify?.("Cannot find valid header cell");
    return;
  }
  const header = await getComponentByKey(headerCell?.key);
  const body = await getComponentByKey(bodyCell?.key);

  if (header === undefined) {
    notify?.("Failed to import header");
    return;
  }
  if (body === undefined) {
    notify?.("Failed to import body");
    return;
  }

  const table = generateTableWrapper(config, notify);

  for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
    const column = generateColumn(columnIndex, rows, header, body, notify);
    table.appendChild(column);
  }

  focusNode(table);

  return table;
};

export const generateTableWrapper = (
  config: TableConfig,
  notify?: (message: string, options?: NotificationOptions) => void
): FrameNode => {
  const frame = figma.createFrame();
  frame.name = "Table";

  frame.layoutMode = "HORIZONTAL";
  frame.counterAxisSizingMode = "AUTO";

  writeConfigToPluginData(frame, config);

  // TODO: Relaunch button

  moveToViewport(frame);

  return frame;
};

export const generateColumn = (
  columnIndex: number,
  rows: number,
  headerComponent: ComponentNode,
  bodyComponent: ComponentNode,
  notify?: (message: string, options?: NotificationOptions) => void
) => {
  const column = figma.createFrame();
  column.name = "Column";
  column.layoutMode = "VERTICAL";

  const header = headerComponent.createInstance();
  column.appendChild(header);
  header.layoutAlign = "STRETCH";

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    const cell = bodyComponent.createInstance();
    column.appendChild(cell);

    cell.layoutAlign = "STRETCH";
  }

  return column;
};

export const moveToViewport = (node: FrameNode) => {
  const bounds = figma.viewport.bounds;
  node.x = bounds.x + bounds.width / 4;
  node.y = bounds.y + bounds.width / 4;
};

export const focusNode = (node: FrameNode) => {
  figma.currentPage.selection = [node];
  figma.viewport.scrollAndZoomIntoView([node]);
};
