export type ReadAvailableLibraryResultToUIMessage = {
  type: "read-available-library-result";
  libraries: string[];
};

export type PostToUIMessage = ReadAvailableLibraryResultToUIMessage;

export type UIReadyToFigmaMessage = {
  type: "ui-ready";
};

export type ResizeWindowToFigmaMessage = {
  type: "resize-window";
  width: number;
  height: number;
};

export type StoreLibraryStylesToFigmaMessage = {
  type: "store-library-styles";
};

export type DeleteLibraryStylesToFigmaMessage = {
  type: "delete-library-styles";
  selectedLibrary: string;
};

export type ReadAvailableLibraryToFigmaMessage = {
  type: "read-available-library";
};

export type CreateVariablesFromLibraryToFigmaMessage = {
  type: "create-variables-from-library";
  selectedLibrary: string;
  collectionName: string;
  modeName: string;
  useAlias: boolean;
  aliasCollectionName: string;
  aliasModeName: string;
};

export type RestoreStylesToFigmaMessage = {
  type: "restore-library-styles";
  selectedLibrary: string;
  collectionName: string;
  modeName: string;
};

export type ImportJsonToFigmaMessage = {
  type: "import-json";
  collectionName: string;
  modeName: string;
  aliasCollectionName: string;
  aliasModeName: string;
  jsonContent: string;
};

export type PostToFigmaMessage =
  | UIReadyToFigmaMessage
  | ResizeWindowToFigmaMessage
  | StoreLibraryStylesToFigmaMessage
  | DeleteLibraryStylesToFigmaMessage
  | RestoreStylesToFigmaMessage
  | ReadAvailableLibraryToFigmaMessage
  | CreateVariablesFromLibraryToFigmaMessage
  | ImportJsonToFigmaMessage;
