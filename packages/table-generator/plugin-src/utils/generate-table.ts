import { TableConfig } from "../../shared-src";
import { getComponentByKey } from "./component";
import { getValidTableFromSelection } from "./guard";
import { writeConfigToPluginData } from "./pluginData";
import { setRelaunchButton } from "./relaunch";

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

  setRelaunchButton(table);
  focusNode(table);

  return table;
};

export const updateTable = async (
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

  const validatedTable = getValidTableFromSelection();
  if (validatedTable === null) {
    notify?.("Failed to validate selected");
    return;
  }

  const existingColumnCount = validatedTable.children.length;

  console.log({ existingColumnCount, columns });

  for (let index = 0; index < existingColumnCount; index++) {
    const column = validatedTable.children[index];
    updateColumn(column as FrameNode, rows, body, notify);
  }

  // add missing column
  for (
    let columnIndex = existingColumnCount;
    columnIndex < columns;
    columnIndex++
  ) {
    const column = generateColumn(columnIndex, rows, header, body, notify);
    validatedTable.appendChild(column);
  }

  // remove excess column
  if (existingColumnCount > columns) {
    const toBeRemoved: FrameNode[] = [];

    for (
      let indexToBeRemoved = columns;
      indexToBeRemoved < existingColumnCount;
      indexToBeRemoved++
    ) {
      const node = validatedTable.children[indexToBeRemoved] as FrameNode;
      toBeRemoved.push(node);
    }

    console.log("Removing column", toBeRemoved.length);
    for (const node of toBeRemoved) {
      node.remove();
    }
  }

  writeConfigToPluginData(validatedTable, config);

  return validatedTable;
};

export const generateTableWrapper = (
  config: TableConfig,
  notify?: (message: string, options?: NotificationOptions) => void
): FrameNode => {
  const frame = figma.createFrame();
  frame.name = "Table";

  frame.layoutMode = "HORIZONTAL";
  frame.counterAxisSizingMode = "AUTO";
  frame.fills = []; // remove default background

  writeConfigToPluginData(frame, config);

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
  column.fills = []; // remove default background

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

export const updateColumn = (
  column: FrameNode,
  rowsConfig: number,
  bodyComponent: ComponentNode,
  notify?: (message: string, options?: NotificationOptions) => void
) => {
  // "+1" for header
  const rows = rowsConfig + 1;

  const existingRowCount = column.children.length;

  // Add missing row
  for (let rowIndex = existingRowCount; rowIndex < rows; rowIndex++) {
    const cell = bodyComponent.createInstance();
    column.appendChild(cell);

    cell.layoutAlign = "STRETCH";
  }

  // Remove excess row
  if (existingRowCount > rows) {
    const toBeRemoved: InstanceNode[] = [];

    for (
      let indexToBeRemoved = rows;
      indexToBeRemoved < existingRowCount;
      indexToBeRemoved++
    ) {
      const node = column.children[indexToBeRemoved] as InstanceNode;
      toBeRemoved.push(node);
    }

    for (const node of toBeRemoved) {
      node.remove();
    }
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
