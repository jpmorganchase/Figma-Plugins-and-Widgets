type Id = string;

type StoredCopyVersion = {
  name: string;
  characters: string;
};

// We need to keep an array so that additional headers being added by the user can be detected
export const CSV_HEADER_FIELDS = [
  "id",
  "page",
  "name",
  "characters",
  "listOption",
  "headingLevel",
];
export type CsvNodeInfo = {
  /**
   * Figma node.id prefixed with $.
   * This is to prevent Excel interpret id like "1:2" to time, which will have additional 0 after save.
   */
  id: `${Id}`;
  /** Top level selected frame name */
  page: string;
  /** Text node name  */
  name: string;
  characters: string;
  listOption: string;
  headingLevel: string;
};
export type CsvNodeInfoWithProperId = Omit<CsvNodeInfo, "id"> & {
  id: Id;
} & {
  [version: string]: string;
};
export const DEFAULT_LANG = "Default";

export type CsvNodeInfoWithLang = CsvNodeInfo & {
  [lang: string]: string;
};

export type FileGeneratedToUIMessage = {
  type: "file-generated";
  data: string;
  defaultFileName: string;
};

export type AvailableLangFromCsvToUIMessage = {
  type: "available-lang-from-csv";
  langs: string[];
};

type TextNodeInfo = {
  /** Figma Node ID */
  id: string;
  /** User defined node key */
  key: string;
  /** Figma Node name */
  name: string;
  characters: string;
};

export type SelectableTextNodeInfo = TextNodeInfo & {
  checked: boolean;
};

export type ScanTextNodeInfoResultToUIMessage = {
  type: "scan-text-node-info-result";
  textNodesInfo: SelectableTextNodeInfo[];
};

export type PartialUpdateTextNodeInfoResultToUIMessage = {
  type: "partial-update-text-node-info-result";
  partialTextNodesInfo: Partial<SelectableTextNodeInfo>[];
};

export type PostToUIMessage =
  | FileGeneratedToUIMessage
  | AvailableLangFromCsvToUIMessage
  | ScanTextNodeInfoResultToUIMessage
  | PartialUpdateTextNodeInfoResultToUIMessage;

// This is useful to run some code when react is finished to get new information from Figma
export type UiFinishLoadingToFigmaMessage = {
  type: "ui-finish-loading";
};

export type ResizeWindowToFigmaMessage = {
  type: "resize-window";
  width: number;
  height: number;
};

export type ExportCsvFileToFigmaMessage = {
  type: "export-csv-file";
};

export type DetectAvailableLangFromCSVToFigmaMessage = {
  type: "detect-available-lang-from-csv";
  csvString: string;
};

export type UpdateContentWithLangToFigmaMessage = {
  type: "update-content-with-lang";
  lang: string;
  persistInFigma: boolean;
};

export type ScanTextNodeInfoToFigmaMessage = {
  type: "scan-text-node-info";
  autoTrigger: boolean;
};

export type FocusNodeToFigmaMessage = {
  type: "focus-node";
  id: string;
};

export type UpdateNodeKeyToFigmaMessage = {
  type: "update-node-key";
  nodeId: string;
  key: string;
};

export type UpdateNodeCheckedToFigmaMessage = {
  type: "update-node-selected";
  nodeId: string;
  checked: boolean;
};

export type PostToFigmaMessage =
  | UiFinishLoadingToFigmaMessage
  | ResizeWindowToFigmaMessage
  | ExportCsvFileToFigmaMessage
  | DetectAvailableLangFromCSVToFigmaMessage
  | UpdateContentWithLangToFigmaMessage
  | ScanTextNodeInfoToFigmaMessage
  | FocusNodeToFigmaMessage
  | UpdateNodeKeyToFigmaMessage
  | UpdateNodeCheckedToFigmaMessage;
