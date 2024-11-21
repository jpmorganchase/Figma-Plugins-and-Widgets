import { ExportColorFormat } from "../shared-src/messages";

/** Turns string into Camel case except full capital case */
export function camelize(str: string) {
  if (/^[A-Z]+$/.test(str.trim())) {
    return str.trim().toLowerCase();
  }
  return str.trim().replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

// Regexps involved with splitting words in various case formats.
const SPLIT_LOWER_NON_DIGIT_UPPER_RE = /([\p{Ll}])(\p{Lu})/gu; // ( lower case  ) ( upper case )
const SPLIT_UPPER_UPPER_RE = /(\p{Lu})([\p{Lu}][\p{Ll}])/gu; // ( upper case ) ( [ upper case ] [ lower case ] )
// The replacement value for splits.
const SPLIT_REPLACE_VALUE = "$1\0$2";

// Regexp involved with stripping non-word characters from the result.
const DEFAULT_STRIP_REGEXP = /[^\p{L}\d]+/giu;

function modifiedSplit(value: string) {
  let result = value.trim();

  result = result
    // `SPLIT_LOWER_NON_DIGIT_UPPER_RE` changed compare with 'change-case' original split
    // Change to not split 30A -> 30-A
    .replace(SPLIT_LOWER_NON_DIGIT_UPPER_RE, SPLIT_REPLACE_VALUE)
    .replace(SPLIT_UPPER_UPPER_RE, SPLIT_REPLACE_VALUE);

  result = result.replace(DEFAULT_STRIP_REGEXP, "\0");

  let start = 0;
  let end = result.length;

  // Trim the delimiter from around the output string.
  while (result.charAt(start) === "\0") start++;
  if (start === end) return [];
  while (result.charAt(end - 1) === "\0") end--;

  return result.slice(start, end).split(/\0/g);
}
function splitPrefixSuffix(input: string) {
  const splitFn = modifiedSplit;
  const prefixIndex = 0;
  const suffixIndex = input.length;

  return [
    input.slice(0, prefixIndex),
    splitFn(input.slice(prefixIndex, suffixIndex)),
    input.slice(suffixIndex),
  ];
}
/** Modified version of kebabCase from 'change-case', where "10A" will not be split into "10-a" */
function specialKebab(input: string) {
  const [prefix, words, suffix] = splitPrefixSuffix(input);
  return (
    prefix +
    (words as string[]).map((input) => input.toLowerCase()).join("-") +
    suffix
  );
}

/** Extract first part of the group name. e.g. `A/B/C` => `A` */
export function extractFirstGroup(name: string) {
  return name.split("/").shift()?.trim() || "";
}

/** Split name to each group and clean up leading and trailing spaces. */
export function splitGroup(name: string) {
  // Figma group is separated by "/"
  return name.split("/").map((x) => x.trim());
}

/**
 * Figma uses slashes for grouping styles together. This turns that slash into a dash.
 **/
export function convertNaming(name: string, prefix?: string) {
  return convertNamingFromGroup(splitGroup(name), prefix);
}

export function convertNamingFromGroup(nameGroups: string[], prefix?: string) {
  return "--" + (prefix || "") + nameGroups.map(camelize).join("-");
}

export function trimDefaultEnding(name: string) {
  return name.replace(/-default$/, "");
}

/**
 * Figma stores the color value as a 0 to 1 decimal instead of 0 to 255.
 **/
export function color1To255(colorValue: number) {
  return Math.round(colorValue * 255);
}

export function getRgbStringFromFigmaColor(rgb: RGB, opacity?: number) {
  if (opacity !== undefined && opacity !== 1) {
    return `rgba(${color1To255(rgb.r)}, ${color1To255(rgb.g)}, ${color1To255(
      rgb.b
    )}, ${removeDp(opacity || 1, 2)})`;
  } else {
    return `rgb(${color1To255(rgb.r)}, ${color1To255(rgb.g)}, ${color1To255(
      rgb.b
    )})`;
  }
}

function componentToHex(c: number) {
  const hex = c.toString(16).toUpperCase();
  return hex.length == 1 ? "0" + hex : hex;
}

export function getHexStringFromFigmaColor({ r, g, b }: RGB, opacity?: number) {
  if (opacity !== undefined && opacity !== 1) {
    return (
      "#" +
      componentToHex(color1To255(r)) +
      componentToHex(color1To255(g)) +
      componentToHex(color1To255(b)) +
      componentToHex(color1To255(opacity))
    );
  } else {
    return (
      "#" +
      componentToHex(color1To255(r)) +
      componentToHex(color1To255(g)) +
      componentToHex(color1To255(b))
    );
  }
}

export function removeDp(input: number, dp: number) {
  return parseFloat(input.toFixed(dp));
}

export function getColorConvertFn(format: ExportColorFormat) {
  switch (format) {
    case "RGB":
      return getRgbStringFromFigmaColor;
    case "HEX":
      return getHexStringFromFigmaColor;
    default:
      throw new Error(`${format} not supported by getColorConvertFn`);
  }
}

export async function exportVariables(
  { name, modes, variableIds }: VariableCollection,
  modeId: string,
  optionalRootKey: string
) {
  const mode = modes.find((m) => m.modeId === modeId);
  if (!mode) {
    return null;
  }

  const file = { fileName: `${name}.${mode.name}.tokens.json`, body: {} };
  let rootObj: Record<string, any> = file.body;
  if (optionalRootKey) {
    rootObj[optionalRootKey] = {};
    rootObj = rootObj[optionalRootKey];
  }
  for (const variableId of variableIds) {
    const { name, resolvedType, valuesByMode } =
      (await figma.variables.getVariableByIdAsync(variableId))!;
    const value = valuesByMode[mode.modeId];
    if (value !== undefined && ["COLOR", "FLOAT"].includes(resolvedType)) {
      let obj = rootObj;
      name.split("/").forEach((groupName) => {
        const kebabGroupname = specialKebab(groupName);
        if (name.includes("negative") && groupName.includes("strong")) {
          console.log({ name, groupName });
        }
        obj[kebabGroupname] = obj[kebabGroupname] || {};
        obj = obj[kebabGroupname];
      });
      obj.$type = resolvedType === "COLOR" ? "color" : "number";
      if (
        typeof value === "object" &&
        "type" in value &&
        value.type === "VARIABLE_ALIAS"
      ) {
        obj.$value = `{${(await figma.variables.getVariableByIdAsync(
          value.id
        ))!.name
          .split("/")
          .map((x) => specialKebab(x))
          .join(".")}}`;
      } else {
        obj.$value = resolvedType === "COLOR" ? rgbToHex(value as RGBA) : value;
      }
    }
  }

  return file;
}

function rgbToHex({ r, g, b, a }: RGBA) {
  const toHex = (value: number) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  if (a !== 1) {
    const hex = [toHex(r), toHex(g), toHex(b), toHex(a)].join("");
    return `#${hex}`;
  }

  const hex = [toHex(r), toHex(g), toHex(b)].join("");
  return `#${hex}`;
}
