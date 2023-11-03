export type GeneratedToUIMessage = {
  type: "generated";
  data: string;
};

export type ExportVariableToJsonResultToUIMessage = {
  type: "export-variable-to-json-result";
  fileName: string;
  body: string;
};

/** Defines in manifest.json */
export type PluginCommandType =
  | "export-css-var"
  | "export-json"
  | "figma-variable-to-json";
export type LaunchViewToUIMessage = {
  type: "launch-view";
  command: PluginCommandType;
};

export type FigmaVariableCollection = {
  name: string;
  id: string;
};

export type FigmaVariableMode = {
  name: string;
  modeId: string;
};

export type GetVariableCollectionsResultToUIMessage = {
  type: "get-variable-collections-result";
  collections: FigmaVariableCollection[];
};

export type GetVariableModesResultToUIMessage = {
  type: "get-variable-modes-result";
  collectionId: string;
  modes: FigmaVariableMode[];
};

export type PostToUIMessage =
  | GeneratedToUIMessage
  | LaunchViewToUIMessage
  | GetVariableCollectionsResultToUIMessage
  | GetVariableModesResultToUIMessage
  | ExportVariableToJsonResultToUIMessage;

export const ExportColorAllFormats = ["RGB", "HEX"] as const;
export type ExportColorFormat = (typeof ExportColorAllFormats)[number];

export type ExportCssToFigmaMessage = {
  type: "export-css";
  prefix: string;
  format: ExportColorFormat;
  ignoreFirstGroup?: boolean;
  ignoreDefaultEnding?: boolean;
};

export type ExportJsonToFigmaMessage = {
  type: "export-json";
  format: ExportColorFormat;
};

export type GetVariableCollectionsToFigmaMessage = {
  type: "get-variable-collections";
};

export type GetVariableModesToFigmaMessage = {
  type: "get-variable-modes";
  collectionId: string;
};

export type ExportVariableToJsonToFigmaMessage = {
  type: "export-variable-to-json";
  collectionId: string;
  modeId: string;
};

export type UIRedayToFigmaMessage = {
  type: "ui-ready";
};

export type ResizeWindowToFigmaMessage = {
  type: "resize-window";
  width: number;
  height: number;
};

export type PostToFigmaMessage =
  | ExportCssToFigmaMessage
  | UIRedayToFigmaMessage
  | ExportJsonToFigmaMessage
  | GetVariableCollectionsToFigmaMessage
  | GetVariableModesToFigmaMessage
  | ExportVariableToJsonToFigmaMessage
  | ResizeWindowToFigmaMessage;
