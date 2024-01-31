/**
 * Most of these are copied from return value column of https://www.figma.com/developers/api#variables-endpoints
 * then added missing types from @figma/plugin-typings/plugin-api.d.ts
 */

export interface RGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}
export interface RGBA {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}
export type Color = RGB | RGBA;
interface VariableAlias {
  type: "VARIABLE_ALIAS";
  id: string;
}
type VariableScope =
  | "ALL_SCOPES"
  | "TEXT_CONTENT"
  | "CORNER_RADIUS"
  | "WIDTH_HEIGHT"
  | "GAP"
  | "ALL_FILLS"
  | "FRAME_FILL"
  | "SHAPE_FILL"
  | "TEXT_FILL"
  | "STROKE_COLOR"
  | "STROKE_FLOAT"
  | "EFFECT_FLOAT"
  | "EFFECT_COLOR"
  | "OPACITY";
type CodeSyntaxPlatform = "WEB" | "ANDROID" | "iOS";
type VariableCodeSyntax = {
  [platform in CodeSyntaxPlatform]?: string;
};
export type Variable = {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";
  valuesByMode: Record<
    string,
    boolean | number | string | Color | VariableAlias
  >;
  remote: boolean;
  description: string;
  hiddenFromPublishing: boolean;
  scopes: readonly VariableScope[];
  codeSyntax: VariableCodeSyntax;
};
export type VariableCollection = {
  id: string;
  name: string;
  key: string;
  modes: readonly [
    {
      modeId: string;
      name: string;
    }
  ];
  defaultModeId: string;
  remote: boolean;
  hiddenFromPublishing: boolean;
  variableIds: readonly string[];
};

export type GetVariableResponse = {
  status: number;
  error: boolean;
  meta: {
    variables: Record<string, Variable>;
    variableCollections: Record<string, VariableCollection>;
  };
};
