import { z } from "zod";
import { toCamelCase } from "./modifyData";
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

type CssGenOption = { prefix?: string };
export function generateCssFromJson(
  inputJson: string,
  option: CssGenOption = {}
): string {
  const inputObj = JSON.parse(inputJson);
  const parseResult = parseTokenObject(inputObj);
  const { prefix } = option;
  if (parseResult.success) {
    function innerLoop(obj: any, keys: string[], allCss: string[]) {
      if (NestedToken.safeParse(obj).success) {
        const [{ $type, $value, ...rest$ }, otherNestedTokens] =
          splitObjectKeysByDollar(obj);

        if ($type === "color") {
          const css = formatCssLine(
            formatCssVarDeclaration(keys, prefix),
            formatCssVarColorValue($value, prefix, true)
          );
          // console.debug("new color css", keys, css);
          allCss.push(css);
        } else if ($type === "number") {
          const css = formatCssLine(
            formatCssVarDeclaration(keys, prefix),
            formatCssVarNumberValue($value, prefix)
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

export function formatCssVarDeclaration(
  keys: string[],
  prefix?: string
): string {
  const keysWithPrefix = prefix ? [prefix, ...keys] : keys;
  return `--${keysWithPrefix.map(toCamelCase).join("-")}`;
}

export function formatCssVarColorValue(
  value: string,
  prefix?: string,
  rgbaFormat?: boolean
): string {
  if (isTokenValueReference(value)) {
    return formatCssVarValueReference(value, prefix);
  } else {
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
  prefix?: string
): string {
  if (isTokenValueReference(value)) {
    return formatCssVarValueReference(value, prefix);
  } else {
    // assume all number will become px for now
    return `${value}px`;
  }
}

export function formatCssVarValueReference(
  value: ReferenceValue,
  prefix?: string
): string {
  return `var(--${prefix ? prefix + "-" : ""}${value
    .substring(1, value.length - 1)
    .split(".")
    .map(toCamelCase)
    .join("-")})`;
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
