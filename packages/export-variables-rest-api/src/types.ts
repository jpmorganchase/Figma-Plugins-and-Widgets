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

type StyleType = "FILL" | "TEXT" | "EFFECT" | "GRID";

type User = {
  // A description of a user
  id: string;
  // Unique stable id of the user
  handle: string;
  // Name of the user
  img_url: string;
  // URL link to the user's profile image
  email: string;
};
export type BaseStyle = {
  key: string;
  file_key: string;
  node_id: string;
  style_type: StyleType;
  thumbnail_url: string;
  name: string;
  description: string;
  updated_at: string;
  created_at: string;
  sort_position: string;
  user: User;
};

export type GetPublishedStylesResponse = {
  status: number;
  error: boolean;
  meta: {
    styles: Array<BaseStyle>;
  };
};

type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type LayoutConstraint = {
  vertical: string;
  horizontal: string;
};
type PaintType =
  | "SOLID"
  | "GRADIENT_LINEAR"
  | "GRADIENT_RADIAL"
  | "GRADIENT_ANGULAR"
  | "GRADIENT_DIAMOND"
  | "IMAGE"
  | "EMOJI"
  | "VIDEO";
type Paint = {
  blendMode: string;
  type: PaintType;
  color: RGBA;
  boundVariables: {
    color: VariableAlias;
    // TODO: fill in other types
  };
};

export type DocumentNode = {
  id: string;
  name: string;
  type: string;
  scrollBehavior: string;
  boundVariables: Record<string, VariableAlias | VariableAlias[]>;
  blendMode: string;
  absoluteBoundingBox: Rectangle;
  absoluteRenderBounds: Rectangle;
  constraints: LayoutConstraint;
  fills: Paint[];
  strokes: Paint[];
  strokeWeight: number;
  strokeAlign: "INSIDE" | "OUTSIDE" | "CENTER";
  effects: unknown[]; // Effect: https://www.figma.com/developers/api#effect-type
};

export type GetFileNodesResponse = {
  name: string;
  role: string;
  lastModified: string;
  editorType: string;
  thumbnailUrl: string;
  err: string;
  nodes: Record<
    string,
    {
      document: DocumentNode;
      components: Record<string, unknown>; // Component
      componentSets: Record<string, unknown>; // ComponentSet
      schemaVersion: 0;
      styles: Record<string, unknown>; // Style
    }
  >;
};
