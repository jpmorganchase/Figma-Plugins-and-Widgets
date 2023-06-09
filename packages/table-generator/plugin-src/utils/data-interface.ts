import { TableData } from "../../shared-src";

const PREFERRED_TEXT_NODE_NAMES = ["Cell", "Value", "Label"];

export function isChildrenMixin(node: any): node is ChildrenMixin {
  return !!(node as any).children;
}
export function getAllVisibleTextLayers(node: ChildrenMixin) {
  // Not using `findAllWithCriteria` so invisible ones can be filtered out
  function findTextNodes(node: ChildrenMixin): TextNode[] {
    return node.children.flatMap((child) => {
      if (child.visible) {
        if (child.type === "TEXT") {
          return [child];
        } else if (isChildrenMixin(child)) {
          return findTextNodes(child);
        } else {
          return [];
        }
      } else {
        // Skip invisible nodes
        return [];
      }
    });
  }

  return findTextNodes(node);
}

/**
 * This is to future prove the custom cell component feature, so we can tell the user that
 * they can construct a custom cell with multiple text layer in it (e.g. legacy icon) and
 * text layer named "X" will be used in table population.
 */
export const getPreferredChildTextNode = (
  cell: ChildrenMixin
): TextNode | null => {
  const allVisibleTextLayers = getAllVisibleTextLayers(cell);

  if (allVisibleTextLayers.length === 0) {
    // This is possible for special type of cell
    return null;
  } else if (allVisibleTextLayers.length === 1) {
    return allVisibleTextLayers[0];
  } else {
    // More than one text layer, find preferred one with name matching
    const preferredTextNode = allVisibleTextLayers.find((x) =>
      PREFERRED_TEXT_NODE_NAMES.includes(x.name)
    );
    if (preferredTextNode) {
      return preferredTextNode;
    } else {
      return allVisibleTextLayers[0];
    }
  }
};

export const getPreferredTextInChild = (cell: ChildrenMixin): string => {
  const textNode = getPreferredChildTextNode(cell);
  if (textNode) {
    return textNode.characters;
  } else {
    return "";
  }
};

export const readTextFromColumn = (column: FrameNode): string[] => {
  return column.children.map((cell) => {
    if (isChildrenMixin(cell)) {
      return getPreferredTextInChild(cell);
    } else {
      return "";
    }
  });
};

export const readDataForUiTable = (gridFrame: FrameNode): TableData => {
  const headerValues: string[] = [];
  const cellValues: string[][] = [];
  for (
    let columnIndex = 0;
    columnIndex < gridFrame.children.length;
    columnIndex++
  ) {
    const column = gridFrame.children[columnIndex];
    if (column.type === "FRAME") {
      const columnData = readTextFromColumn(column);
      if (columnData.length > 0) {
        // Header value
        const headerValue = columnData.shift();
        if (headerValue !== undefined) {
          headerValues.push(headerValue);
        }

        // UI Table expect row by row data, so we transpose data
        for (let rowIndex = 0; rowIndex < columnData.length; rowIndex++) {
          const rowValue = columnData[rowIndex];
          if (cellValues[rowIndex] !== undefined) {
            cellValues[rowIndex].push(rowValue);
          } else {
            cellValues[rowIndex] = [rowValue];
          }
        }
      } else {
        console.warn(
          "Skipping column with no text data: ",
          column.name,
          "at columnIndex",
          columnIndex
        );
      }
    } else {
      console.warn(
        "Skipping none frame child of columnGroup named:",
        column.name,
        "at columnIndex",
        columnIndex
      );
    }
  }
  return {
    headerValues,
    cellValues,
  };
};

export const transpose2dArray = <T>(array: Array<Array<T>>) =>
  array[0].map((_, colIndex) => array.map((row) => row[colIndex]));

export const writeDataFromUiTable = async (
  tableFrame: FrameNode,
  data: TableData
) => {
  const { cellValues: uiCellValues, headerValues } = data;
  // UI Table expect row by row data, so we transpose data
  const cellValues = transpose2dArray(uiCellValues);
  for (
    let columnIndex = 0;
    columnIndex < tableFrame.children.length;
    columnIndex++
  ) {
    const column = tableFrame.children[columnIndex];
    if (column.type === "FRAME") {
      // "+1" for header cell
      if (cellValues[columnIndex].length + 1 !== column.children.length) {
        throw new Error(
          "Number of cell doesn't match UI on column " + columnIndex
        );
      } else {
        for (let rowIndex = 0; rowIndex < column.children.length; rowIndex++) {
          const cell = column.children[rowIndex];
          if (isChildrenMixin(cell)) {
            if (rowIndex === 0) {
              // header
              const textNode = getPreferredChildTextNode(cell);
              if (textNode) {
                await syncTextInTextNode(headerValues[columnIndex], textNode);
              } else {
                throw new Error(
                  `Can't find visible text layer within col ${columnIndex} header cell`
                );
              }
            } else {
              // body
              const textNode = getPreferredChildTextNode(cell);
              if (textNode) {
                await syncTextInTextNode(
                  cellValues[columnIndex][rowIndex - 1],
                  textNode
                );
              } else {
                throw new Error(
                  `Can't find visible text layer within col ${columnIndex} row ${rowIndex}`
                );
              }
            }
          } else {
            throw new Error(
              `Invalid cell type at col ${columnIndex} row ${rowIndex}`
            );
          }
        }
      }
    }
  }
};

export const syncTextInTextNode = async (text: string, textNode: TextNode) => {
  // console.log("checkAndUpdateTextInTextNode", { text, textNode });
  if (textNode.characters === text) {
    return;
  }
  await loadAllFonts(textNode);
  textNode.characters = text;
};

export async function loadAllFonts(textNode: TextNode) {
  if (!textNode.characters.length) {
    // When there is no existing text, font will be none-mixed
    await figma.loadFontAsync(textNode.fontName as FontName);
  } else {
    const fontNames = textNode.getRangeAllFontNames(
      0,
      textNode.characters.length
    );
    for (let index = 0; index < fontNames.length; index++) {
      const fontName = fontNames[index];
      await figma.loadFontAsync(fontName);
    }
  }
}
