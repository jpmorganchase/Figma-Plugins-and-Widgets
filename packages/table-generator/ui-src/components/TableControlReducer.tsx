import { Reducer } from "react";

export const DEFAULT_CSV_CHOICE = "CSV Column";

// const initialTodos = [
//     {
//       id: 1,
//       title: "Todo 1",
//       complete: false,
//     },
//     {
//       id: 2,
//       title: "Todo 2",
//       complete: false,
//     },
//   ];

interface UpdateValueAtCell {
  type: "UPDATE_VALUE_AT_CELL";
  row: number;
  column: number;
  newValue: string;
  disableNewRowFromCsv?: boolean;
}

interface UpdateValueAtHeader {
  type: "UPDATE_VALUE_AT_HEADER";
  columnIndex: number;
  newValue: string;
}

interface UpdateValueAtGroupHeader {
  type: "UPDATE_VALUE_AT_GROUP_HEADER";
  columnIndex: number;
  newValue: string;
}

interface DeleteRow {
  type: "DELETE_ROW";
  index: number;
}

interface InsertNewRow {
  type: "INSERT_NEW_ROW";
  // columnCount: number;
}

interface UpdateColumnData {
  type: "UPDATE_COLUMN_DATA";
  columnName: string;
  columnIndex: number;
  data: string[];
  disableNewRowFromCsv?: boolean;
  updateColumnNameWhenChange?: boolean;
}

interface ResetRows {
  type: "RESET_ROWS";
  columnCount: number;
}

interface UpdateAllValues {
  type: "UPDATE_ALL_VALUES";
  headerValues: string[];
  cellValues?: string[][];
  groupHeaderValues?: string[];
}

export type TableState = {
  groupHeaderValues?: string[];
  headerValues: string[];
  cellValues: string[][];
};

export type TableReducerAction =
  | UpdateValueAtCell
  | UpdateValueAtHeader
  | UpdateValueAtGroupHeader
  | InsertNewRow
  | UpdateColumnData
  | DeleteRow
  | ResetRows
  | UpdateAllValues;

function assertUnreachable(x: never): never {
  throw new Error("Didn't expect to get here");
}

export const tableReducer: Reducer<TableState, TableReducerAction> = (
  state,
  action
): TableState => {
  //   console.log("tableReducer", action);
  switch (action.type) {
    case "UPDATE_VALUE_AT_CELL": {
      console.log(action);
      const { row, column, newValue: rawValue, disableNewRowFromCsv } = action;
      const oldValues = state.cellValues;

      // Support excel multi-cell pasting
      const allNewValues: string[][] = rawValue
        .split(/\r\n|\n/)
        .map((row) => row.split(/\t|,/));
      // console.log({ allNewValues });
      if (
        !disableNewRowFromCsv &&
        oldValues.length < allNewValues.length + row
      ) {
        const columnCount = oldValues[row].length;
        const newRowCount = allNewValues.length + row - oldValues.length;
        // console.log("Inserting new rows", {
        //   allNewValues,
        //   newRowCount,
        //   oldValues,
        // });
        for (let index = 0; index < newRowCount; index++) {
          oldValues.push(Array(columnCount).fill(""));
        }
      }

      for (let i = 0; i < allNewValues.length; i++) {
        const rowData = allNewValues[i];
        for (let j = 0; j < rowData.length; j++) {
          const cellData = rowData[j];
          // Some row could not be there, by disableNewRowFromCsv
          if (oldValues[row + i]) {
            if (column + j < oldValues[row + i].length) {
              oldValues[row + i][column + j] = cellData;
            } else {
              console.warn("Ignore update unknown columns", {
                row: row + i,
                column: column + j,
              });
            }
          }
        }
      }

      return {
        ...state,
        cellValues: oldValues,
      };
    }
    case "UPDATE_VALUE_AT_HEADER": {
      const { columnIndex, newValue } = action;
      const newHeaderValues = [...state.headerValues];
      newHeaderValues[columnIndex] = newValue;
      return { ...state, headerValues: newHeaderValues };
    }
    case "UPDATE_VALUE_AT_GROUP_HEADER": {
      const { columnIndex, newValue } = action;
      if (state.groupHeaderValues) {
        const newGroupHeaderValues = [...state.groupHeaderValues];
        newGroupHeaderValues[columnIndex] = newValue;
        return { ...state, groupHeaderValues: newGroupHeaderValues };
      } else {
        console.error("No groupHeaderValues existed in state");
        return state;
      }
    }
    case "INSERT_NEW_ROW": {
      const newValue = [
        ...state.cellValues,
        Array(state.headerValues.length).fill(""),
      ];
      return {
        ...state,
        cellValues: newValue,
      };
    }
    case "UPDATE_COLUMN_DATA": {
      const {
        data,
        columnIndex,
        disableNewRowFromCsv,
        columnName,
        updateColumnNameWhenChange,
      } = action;
      const newValue = [...state.cellValues];
      if (!disableNewRowFromCsv && data.length > newValue.length) {
        // Insert new rows when data has more items then existing rows
        newValue.push(
          ...Array(data.length - newValue.length).fill(
            Array(state.headerValues.length).fill("")
          )
        );
      }
      if (updateColumnNameWhenChange) {
        const newHeaderValues = [...state.headerValues];
        newHeaderValues[columnIndex] = columnName;
        return {
          ...state,
          headerValues: newHeaderValues,
          cellValues: newValue.map((rowData, rIndex) =>
            rowData.map((cellData, cIndex) => {
              if (columnIndex === cIndex) {
                return data[rIndex];
              } else {
                return cellData;
              }
            })
          ),
        };
      } else {
        return {
          ...state,
          cellValues: newValue.map((rowData, rIndex) =>
            rowData.map((cellData, cIndex) => {
              if (columnIndex === cIndex) {
                return data[rIndex];
              } else {
                return cellData;
              }
            })
          ),
        };
      }
    }
    case "DELETE_ROW": {
      const newValue = [...state.cellValues];
      newValue.splice(action.index, 1);
      return {
        ...state,
        cellValues: newValue,
      };
    }
    case "RESET_ROWS": {
      if (state.cellValues.length > 0 || action.columnCount > 0) {
        return {
          ...state,
          cellValues: action.columnCount
            ? [Array(action.columnCount).fill("")]
            : [],
        };
      } else {
        return state;
      }
    }
    case "UPDATE_ALL_VALUES": {
      if (action.cellValues) {
        return {
          ...state,
          headerValues: action.headerValues,
          cellValues: action.cellValues,
          groupHeaderValues: action.groupHeaderValues,
        };
      } else {
        return {
          ...state,
          headerValues: action.headerValues,
          groupHeaderValues: action.groupHeaderValues,
        };
      }
    }
    default:
      return assertUnreachable(action);
  }
};
