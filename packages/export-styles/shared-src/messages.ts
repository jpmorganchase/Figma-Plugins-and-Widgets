export type GeneratedToUIMessage = {
  type: "generated";
  data: string;
};

/** Defines in manifest.json */
export type PluginCommandType = "export-css-var" | "export-json";
export type LaunchViewToUIMessage = {
  type: "launch-view";
  command: PluginCommandType;
};

export type PostToUIMessage = GeneratedToUIMessage | LaunchViewToUIMessage;

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
  | ResizeWindowToFigmaMessage;
