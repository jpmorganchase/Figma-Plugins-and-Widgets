export type CellInfo = {
  name: string;
  key: string;
};

export type TableConfig = {
  rows: number;
  columns: number;
  headerCell: CellInfo | null;
  bodyCell: CellInfo | null;
};

export const DEFAULT_TABLE_CONFIG: TableConfig = {
  rows: 3,
  columns: 3,
  headerCell: null,
  bodyCell: null,
};

export type TableData = {
  headerValues: string[];
  cellValues: string[][];
};

export type SelectionChangedToUIMessage = {
  type: "selection-changed";
};

export type UpdateHeaderCellToUIMessage = {
  type: "update-header-cell";
  cell: CellInfo | null;
};

export type UpdateBodyCellToUIMessage = {
  type: "update-body-cell";
  cell: CellInfo | null;
};

export type FullConfigUpdatedToUIMessage = {
  type: "full-config-updated";
  config: TableConfig | null;
};

export type ReadTableDataResultToUIMessage = {
  type: "read-table-data-result";
  data: TableData;
};

export type PostToUIMessage =
  | SelectionChangedToUIMessage
  | FullConfigUpdatedToUIMessage
  | UpdateHeaderCellToUIMessage
  | UpdateBodyCellToUIMessage
  | ReadTableDataResultToUIMessage;

// This is useful to run some code when react is finished to get new information from Figma
export type UiFinishLoadingToFigmaMessage = {
  type: "ui-finish-loading";
};

export type ResizeWindowToFigmaMessage = {
  type: "resize-window";
  width: number;
  height: number;
};

export type SetTableHeaderCellToFigmaMessage = {
  type: "set-table-header-cell";
};

export type SetTableBodyCellToFigmaMessage = {
  type: "set-table-body-cell";
};

export type GenerateTableToFigmaMessage = {
  type: "generate-table";
  config: TableConfig;
};

export type ReadTableDataToFigmaMessage = {
  type: "read-table-data";
};

export type SetTableDataToFigmaMessage = {
  type: "set-table-data";
  data: TableData;
};

export type PostToFigmaMessage =
  | UiFinishLoadingToFigmaMessage
  | ResizeWindowToFigmaMessage
  | SetTableHeaderCellToFigmaMessage
  | SetTableBodyCellToFigmaMessage
  | GenerateTableToFigmaMessage
  | ReadTableDataToFigmaMessage
  | SetTableDataToFigmaMessage;
