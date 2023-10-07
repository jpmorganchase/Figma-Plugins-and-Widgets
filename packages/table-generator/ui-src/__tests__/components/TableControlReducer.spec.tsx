import { describe, expect, test } from "vitest";
import {
  TableReducerAction,
  TableState,
  tableReducer,
} from "../../components/TableControlReducer";

describe("talbeReducer", () => {
  test("UPDATE_VALUE_AT_CELL", () => {
    const inputState: TableState = {
      cellValues: [
        ["1", "Jon", "Snow"],
        ["2", "Cersei", "Lannister"],
        ["3", "Jaime", "Lannister"],
      ],
      headerValues: ["ID", "First", "Last"],
    };
    const action: TableReducerAction = {
      type: "UPDATE_VALUE_AT_CELL",
      column: 1,
      row: 1,
      newValue: "Foo",
    };
    const actual = tableReducer(inputState, action);
    expect(actual).toEqual({
      cellValues: [
        ["1", "Jon", "Snow"],
        ["2", "Foo", "Lannister"],
        ["3", "Jaime", "Lannister"],
      ],
      headerValues: ["ID", "First", "Last"],
    });
  });
  test("PASTE_VALUE_AT_CELL", () => {
    const inputState: TableState = {
      cellValues: [
        ["1", "Jon", "Snow"],
        ["2", "Cersei", "Lannister"],
        ["3", "Jaime", "Lannister"],
      ],
      headerValues: ["ID", "First", "Last"],
    };
    const action: TableReducerAction = {
      type: "PASTE_VALUE_AT_CELL",
      column: 1,
      row: 1,
      pasteValue: "Foo,5\nBar,6",
      selectEnd: 6,
      selectStart: 0,
    };
    const actual = tableReducer(inputState, action);
    expect(actual).toEqual({
      cellValues: [
        ["1", "Jon", "Snow"],
        ["2", "Foo", "5"],
        ["3", "Bar", "6"],
      ],
      headerValues: ["ID", "First", "Last"],
    });
  });
  test("UPDATE_VALUE_AT_HEADER", () => {
    const inputState: TableState = {
      cellValues: [
        ["1", "Jon", "Snow"],
        ["2", "Cersei", "Lannister"],
        ["3", "Jaime", "Lannister"],
      ],
      headerValues: ["ID", "First", "Last"],
    };
    const action: TableReducerAction = {
      type: "UPDATE_VALUE_AT_HEADER",
      columnIndex: 1,
      newValue: "Foo",
    };
    const actual = tableReducer(inputState, action);
    expect(actual).toEqual({
      cellValues: [
        ["1", "Jon", "Snow"],
        ["2", "Cersei", "Lannister"],
        ["3", "Jaime", "Lannister"],
      ],
      headerValues: ["ID", "Foo", "Last"],
    });
  });
  test("UPDATE_COLUMN_DATA", () => {
    const inputState: TableState = {
      cellValues: [
        ["1", "Jon", "Snow"],
        ["2", "Cersei", "Lannister"],
        ["3", "Jaime", "Lannister"],
      ],
      headerValues: ["ID", "First", "Last"],
    };
    const action: TableReducerAction = {
      type: "UPDATE_COLUMN_DATA",
      columnIndex: 1,
      columnName: "New col",
      data: ["A", "B", "C"],
      disableNewRowFromCsv: true,
      updateColumnNameWhenChange: true,
    };
    const actual = tableReducer(inputState, action);
    expect(actual).toEqual({
      cellValues: [
        ["1", "A", "Snow"],
        ["2", "B", "Lannister"],
        ["3", "C", "Lannister"],
      ],
      headerValues: ["ID", "New col", "Last"],
    });
  });
});
