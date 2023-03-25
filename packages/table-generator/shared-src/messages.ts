export type SelectionChangedToUIMessage = {
  type: "selection-changed";
};

export type PostToUIMessage = SelectionChangedToUIMessage;

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
  row: number;
  column: number;
};

export type PostToFigmaMessage =
  | UiFinishLoadingToFigmaMessage
  | ResizeWindowToFigmaMessage
  | SetTableHeaderCellToFigmaMessage
  | SetTableBodyCellToFigmaMessage
  | GenerateTableToFigmaMessage;
