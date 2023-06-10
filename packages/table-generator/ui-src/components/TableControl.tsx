import { Button, Tooltip, H3 } from "@salt-ds/core";
import { AddIcon, CsvIcon, DeleteIcon } from "@salt-ds/icons";
import { Dropdown, Input } from "@salt-ds/lab";
import { ParseResult } from "papaparse";
import React, { Dispatch } from "react";
import {
  DEFAULT_CSV_CHOICE,
  TableReducerAction,
  TableState,
} from "./TableControlReducer";

import "./TableControl.css";

interface TableColumnCsvPickerProps {
  columnIndex: number;
  csvHeaders: string[];
  onSelectionChange: (
    columnIndex: number,
    valueSelected: typeof DEFAULT_CSV_CHOICE | string
  ) => void;
}

const TableColumnCsvPicker = ({
  columnIndex,
  csvHeaders,
  onSelectionChange,
}: TableColumnCsvPickerProps) => {
  const source = [DEFAULT_CSV_CHOICE, ...csvHeaders];
  // console.log("TableColumnCsvPicker", { source });
  return (
    <Dropdown
      // Use `key` as a workaround for UITK Dropdown bug. It throws error when: 1. uncontrolled. 2. select something first. 3. update source. 4. expand dropdown (item on the button no longer available)
      key={JSON.stringify(source)}
      aria-label="CSV column to fill"
      defaultSelected={source[0]}
      onSelectionChange={(_, selected) => {
        selected && onSelectionChange(columnIndex, selected);
      }}
      source={source}
      width="var(--table-cell-width)"
      ListProps={{ displayedItemCount: 5 }}
    />
  );
};

interface TableCellProp {
  value: string;
  row: number;
  column: number;
  dispatch: Dispatch<TableReducerAction>;
  disableNewRowFromCsv?: boolean;
}

const TableCell = React.memo(function TableCell({
  value,
  row,
  column,
  dispatch,
  disableNewRowFromCsv,
}: TableCellProp) {
  // This is very hacky code to make sure the cell would not swallow "\n" so reducer can handle batch / range pasting
  return (
    <td>
      <Input
        className="table-control-table-input"
        value={value}
        onChange={(_, value) => {
          dispatch({
            type: "UPDATE_VALUE_AT_CELL",
            row,
            column,
            newValue: value,
            disableNewRowFromCsv,
          });
        }}
        inputComponent="textarea"
        // TK inputProps is not generic, so `rows` will error on textarea input
        inputProps={{ rows: 1, spellCheck: true } as any}
        onKeyDownCapture={(e) => {
          // Do not support user manually enter multiline data, obviously CSV could contain these
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      />
    </td>
  );
});

const TableRow = ({
  row,
  cellValues,
  dispatch,
  hideDeleteRow,
  disableNewRowFromCsv,
}: {
  row: number;
  cellValues: string[];
  dispatch: Dispatch<TableReducerAction>;
  hideDeleteRow?: boolean;
  disableNewRowFromCsv?: boolean;
}) => {
  return (
    <tr>
      {hideDeleteRow ? null : (
        <td className="sticky-col">
          <Button onClick={() => dispatch({ type: "DELETE_ROW", index: row })}>
            <DeleteIcon />
          </Button>
        </td>
      )}
      {cellValues.map((v, columnIndex) => (
        <TableCell
          value={v}
          row={row}
          column={columnIndex}
          dispatch={dispatch}
          key={columnIndex}
          disableNewRowFromCsv={disableNewRowFromCsv}
        />
      ))}
    </tr>
  );
};

const TableHeaderCell = React.memo(
  ({
    editable,
    value,
    dispatch,
    columnIndex,
  }: {
    editable?: boolean;
    value: string;
    dispatch: Dispatch<TableReducerAction>;
    columnIndex: number;
  }) => {
    if (editable) {
      return (
        <th>
          <Input
            value={value}
            onChange={(_, value) => {
              dispatch({
                type: "UPDATE_VALUE_AT_HEADER",
                columnIndex,
                newValue: value,
              });
            }}
          />
        </th>
      );
    } else {
      return (
        <th>
          <H3>{value}</H3>
        </th>
      );
    }
  }
);

const TableGroupHeaderCell = React.memo(
  ({
    editable,
    value,
    dispatch,
    columnIndex,
  }: {
    editable?: boolean;
    value: string;
    dispatch: Dispatch<TableReducerAction>;
    columnIndex: number;
  }) => {
    if (editable) {
      return (
        <th>
          <Input
            value={value}
            onChange={(_, value) => {
              dispatch({
                type: "UPDATE_VALUE_AT_GROUP_HEADER",
                columnIndex,
                newValue: value,
              });
            }}
          />
        </th>
      );
    } else {
      return (
        <th>
          <H3>{value}</H3>
        </th>
      );
    }
  }
);

export interface TableControlProps {
  /** Fully controlled table state to drive UI. Use together with `dispatch` prop to get best outcome. */
  tableState: TableState;
  /**
   * The dispatcher works together with `tableState`, where the best out of box usage is by using `tableReducer` from `TableControlReducer.tsx`.
   * ```
   * const [tableState, dispatch] = useReducer(tableReducer, {cellValues: [],headerValues: [],groupHeaderValues: undefined,});
   * ```
   * */
  dispatch: Dispatch<TableReducerAction>;
  /** When true, column headers become editable. Watch `tableState.headerValues` for changes if using default dispatcher.  */
  editableHeader?: boolean;
  /** When provided, additional row of dropdown will be provided for the user to pick csv file header to fill rows. */
  csvImportResults?: ParseResult<File>;
  /** When provided together with `csvImportResults`, file name will be displayed as tooltip of the icon displayed on the first actionable column (when `disableRowEdit` is off). */
  csvFile?: File;
  /** When true, no new row or delete row feature */
  disableRowEdit?: boolean;
  /** When true, no new row will be created when picking from csv file. */
  disableNewRowFromCsv?: boolean;
  /** When true, column name will be updated to match csv column name when selecting */
  updateColumnNameOnCsvSelect?: boolean;
}

export const TableControl = ({
  tableState,
  dispatch,
  csvImportResults,
  csvFile,
  disableRowEdit,
  editableHeader,
  disableNewRowFromCsv,
  updateColumnNameOnCsvSelect,
}: TableControlProps) => {
  const handleCsvPickerChange = (
    columnIndex: number,
    valueSelected: string
  ) => {
    if (valueSelected !== DEFAULT_CSV_CHOICE) {
      console.log("csvImportResults!.data", csvImportResults!.data);
      dispatch({
        type: "UPDATE_COLUMN_DATA",
        columnName: valueSelected,
        columnIndex: columnIndex,
        updateColumnNameWhenChange: updateColumnNameOnCsvSelect,
        data: csvImportResults!.data.map(
          (x) => (x as unknown as { [k: string]: string })[valueSelected]
        ),
        disableNewRowFromCsv,
      });
    }
  };

  return (
    <table className="table-control-table">
      <thead>
        {tableState.groupHeaderValues ? (
          <tr className="sticky-row">
            {/* Empty column for buttons */}
            {disableRowEdit ? null : <th className="sticky-col"></th>}

            {tableState.groupHeaderValues.map((n, i) => (
              <TableGroupHeaderCell
                key={"col-group-head-" + i}
                value={n}
                columnIndex={i}
                dispatch={dispatch}
                editable={editableHeader}
              />
            ))}
          </tr>
        ) : null}
        <tr className="sticky-row">
          {disableRowEdit ? null : (
            <th className="sticky-col">
              <Button
                onClick={() =>
                  dispatch({
                    type: "INSERT_NEW_ROW",
                  })
                }
              >
                <AddIcon />
              </Button>
            </th>
          )}
          {tableState.headerValues.map((n, i) => (
            <TableHeaderCell
              key={"col-head-" + i}
              value={n}
              columnIndex={i}
              dispatch={dispatch}
              editable={editableHeader}
            />
          ))}
        </tr>
        {csvImportResults?.meta.fields?.length ? (
          <tr className="sticky-row">
            {disableRowEdit ? null : (
              <th className="sticky-col button-icon-size">
                <Tooltip content={csvFile?.name}>
                  <CsvIcon className="csv-icon" />
                </Tooltip>
              </th>
            )}
            {tableState.headerValues.map((n, i) => (
              <th key={"col-csv-picker-" + i + "-" + n}>
                <TableColumnCsvPicker
                  columnIndex={i}
                  csvHeaders={csvImportResults?.meta.fields || []}
                  onSelectionChange={handleCsvPickerChange}
                />
              </th>
            ))}
          </tr>
        ) : null}
      </thead>
      <tbody>
        {tableState.cellValues.map((rowValues, rowIndex) => (
          <TableRow
            key={"table-row-" + rowIndex}
            hideDeleteRow={disableRowEdit}
            row={rowIndex}
            cellValues={rowValues}
            dispatch={dispatch}
            disableNewRowFromCsv={disableNewRowFromCsv}
          />
        ))}
      </tbody>
    </table>
  );
};