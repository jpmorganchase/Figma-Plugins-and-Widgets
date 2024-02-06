export type GenerateJsonResultToUIMessage = {
  type: "generate-json-result";
  data: any;
};

export type PostToUIMessage = GenerateJsonResultToUIMessage;

export type GenerateJsonToFigmaMessage = {
  type: "generate-json";
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
  | GenerateJsonToFigmaMessage
  | UIRedayToFigmaMessage
  | ResizeWindowToFigmaMessage;
