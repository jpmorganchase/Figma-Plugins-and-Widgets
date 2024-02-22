import { z } from "zod";
import { toCamelCase, toKebabCase } from "./modifyData";
import { hexToRGBA } from "./colorUtils";

export type TokenReservedKey = "$value" | "$type";
const ReferenceToken = z
  .object({
    $type: z.union([z.literal("color"), z.literal("number")]),
    $value: z.string().startsWith("{").endsWith("}"),
  })
  .required();
const ColorToken = z
  .object({
    $type: z.literal("color"),
    $value: z.string().regex(/^#[a-f0-9]{6}([a-f0-9]{2})?$/i),
  })
  .required();
const NumberToken = z
  .object({
    $type: z.literal("number"),
    $value: z.number(),
  })
  .required();

const AllTokens = z.union([ReferenceToken, ColorToken, NumberToken]);
type TokenType = z.infer<typeof AllTokens>;
export type ThemeObject<TType = TokenType> =
  | TType
  | {
      [key: string]: typeof key extends TokenReservedKey
        ? never
        : ThemeObject<TType>;
    };

const NestedToken: z.ZodType<ThemeObject> = AllTokens.or(
  // deep nesting through lazy and record of itself
  z.lazy(() => z.record(NestedToken))
);

// Root level theme object should have token name present
const RootToken = z.record(NestedToken);
export type ThemeRoot = z.infer<typeof RootToken>;

type ReferenceValuePointer = string;
export type ReferenceValue = `{${ReferenceValuePointer}}`;
export function isTokenValueReference(value: any): value is ReferenceValue {
  if (typeof value === "string") {
    if (value.startsWith("{") && value.endsWith("}")) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

export function parseTokenObject(tokenObj: object) {
  const parseResult = RootToken.safeParse(tokenObj);
  // if (!parseResult.success) console.log(parseResult.error);
  return parseResult;
}

export const SALT_SPECIAL_PREFIX_MAP: CssGenOption["specialPrefixMap"] = {
  // foundation colors
  aqua: "color",
  asphalt: "color",
  autumn: "color",
  black: "color",
  blue: "color",
  cider: "color",
  citrine: "color",
  cobalt: "color",
  forest: "color",
  fuchsia: "color",
  fur: "color",
  gray: "color",
  green: "color",
  indigo: "color",
  jade: "color",
  lavender: "color",
  lime: "color",
  mist: "color",
  ocean: "color",
  oil: "color",
  olive: "color",
  orange: "color",
  plum: "color",
  purple: "color",
  red: "color",
  rose: "color",
  salmon: "color",
  slate: "color",
  smoke: "color",
  snow: "color",
  teal: "color",
  transparent: "color",
  violet: "color",
  white: "color",
  // palette
  accent: "palette",
  background: "palette",
  category: "palette",
  foreground: "palette",
  info: "palette",
  negative: "palette",
  neutral: "palette",
  positive: "palette",
  warning: "palette",
};

type CssGenOption = {
  prefix?: string;
  rgbaFormat?: boolean;
  /** map of additional prefix needed when first part of keys matches */
  specialPrefixMap?: Record<string, string>;
  /** When true, `specialPrefixMap` will be ignored for token keys, still work for values. */
  ignoreNameSpecialPrefix?: boolean;
  removeSuffixDefault?: boolean;
  kebabCase?: boolean;
  keyTransform?: (name: string) => string;
};
export function generateCssFromJson(
  inputJson: string,
  option: CssGenOption = {}
): string {
  const inputObj = JSON.parse(inputJson);
  const parseResult = parseTokenObject(inputObj);
  if (parseResult.success) {
    function innerLoop(obj: any, keys: string[], allCss: string[]) {
      if (NestedToken.safeParse(obj).success) {
        const [{ $type, $value, ...rest$ }, otherNestedTokens] =
          splitObjectKeysByDollar(obj);

        if ($type === "color") {
          const css = formatCssLine(
            formatCssVarDeclaration(keys, option),
            formatCssVarColorValue($value, option)
          );
          // console.debug("new color css", keys, css);
          allCss.push(css);
        } else if ($type === "number") {
          const css = formatCssLine(
            formatCssVarDeclaration(keys, option),
            formatCssVarNumberValue($value, option)
          );
          // console.debug("new color css", keys, css);
          allCss.push(css);
        } // else if other $type in the future

        for (const nestedKey of Object.keys(otherNestedTokens)) {
          innerLoop(otherNestedTokens[nestedKey], [...keys, nestedKey], allCss);
        }
      } else if (typeof obj === "object") {
        for (const nestedKey of Object.keys(obj)) {
          innerLoop(obj[nestedKey], [...keys, nestedKey], allCss);
        }
      }
    }
    const allCss: string[] = [];
    innerLoop(inputObj, [], allCss);
    // console.debug({ allCss });
    return allCss.join("\n");
  }
  throw new Error(JSON.stringify(parseResult.error));
}

export function formatCssLine(declaration: string, value: string): string {
  return `${declaration}: ${value};`;
}

export function updateKeysWithOption(
  inputKeys: string[],
  option: CssGenOption = {}
): string[] {
  if (inputKeys.length === 0) {
    return inputKeys;
  }
  const { prefix, specialPrefixMap, removeSuffixDefault, keyTransform } =
    option;
  const b4keys =
    removeSuffixDefault && inputKeys[inputKeys.length - 1] === "default"
      ? inputKeys.slice(0, -1)
      : [...inputKeys];

  const keys = keyTransform ? b4keys.map(keyTransform) : b4keys;
  const additionalPrefix = specialPrefixMap?.[keys[0]];

  if (additionalPrefix) {
    return prefix
      ? [prefix, additionalPrefix, ...keys]
      : [additionalPrefix, ...keys];
  }
  return prefix ? [prefix, ...keys] : keys;
}

export function updateCasing(
  keys: string[],
  option: CssGenOption = {}
): string[] {
  return keys.map(option.kebabCase ? toKebabCase : toCamelCase);
}

export function formatCssVarDeclaration(
  keys: string[],
  option: CssGenOption = {}
): string {
  const { ignoreNameSpecialPrefix, specialPrefixMap, ...restOption } = option;
  const keysWithPrefix = updateKeysWithOption(
    keys,
    ignoreNameSpecialPrefix
      ? { ignoreNameSpecialPrefix, ...restOption }
      : option
  );
  return `--${updateCasing(keysWithPrefix, option).join("-")}`;
}

export function formatCssVarColorValue(
  value: string,
  option: CssGenOption = {}
): string {
  if (isTokenValueReference(value)) {
    return formatCssVarValueReference(value, option);
  } else {
    const { rgbaFormat } = option;
    // assuming hex value already, defined by `ColorToken` regex
    if (rgbaFormat) {
      return hexToRGBA(value);
    } else {
      return value;
    }
  }
}

export function formatCssVarNumberValue(
  value: string | number,
  option: CssGenOption = {}
): string {
  if (isTokenValueReference(value)) {
    return formatCssVarValueReference(value, option);
  } else {
    // assume all number will become px for now
    return `${value}px`;
  }
}

export function formatCssVarValueReference(
  value: ReferenceValue,
  option: CssGenOption = {}
): string {
  const keys = value.substring(1, value.length - 1).split(".");
  const prefixedKeys = updateKeysWithOption(keys, option);
  return `var(--${updateCasing(prefixedKeys, option).join("-")})`;
}

/**
 * Split an object to two with one keys all prefixed with $.
 *
 * `[{$type, ...rest$}, {otherGroup, ...restGroups}] = splitObjectKeysByDollar({$type: 'color', otherGroup: {}})`
 */
export const splitObjectKeysByDollar = (input: { [key: string]: any }) => {
  const with$: { [key: string]: any } = {};
  const others: { [key: string]: any } = {};
  Object.keys(input).forEach((key) => {
    if (key.startsWith("$")) {
      with$[key] = input[key];
    } else {
      others[key] = input[key];
    }
  });
  return [with$, others] as const;
};
