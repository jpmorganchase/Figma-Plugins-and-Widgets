import { TableState } from "../../shared-src";

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

export const readDataForUiTable = (columnsGroup: FrameNode): TableState => {
  const headerValues: string[] = [];
  const cellValues: string[][] = [];
  for (
    let columnIndex = 0;
    columnIndex < columnsGroup.children.length;
    columnIndex++
  ) {
    const column = columnsGroup.children[columnIndex];
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
