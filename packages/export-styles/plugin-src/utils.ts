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
  var hex = c.toString(16).toUpperCase();
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

export function exportVariables(
  { name, modes, variableIds }: VariableCollection,
  modeId: string
) {
  const mode = modes.find((m) => m.modeId === modeId);
  if (!mode) {
    return null;
  }

  const file = { fileName: `${name}.${mode.name}.tokens.json`, body: {} };
  variableIds.forEach((variableId) => {
    const { name, resolvedType, valuesByMode } =
      figma.variables.getVariableById(variableId)!;
    const value = valuesByMode[mode.modeId];
    if (value !== undefined && ["COLOR", "FLOAT"].includes(resolvedType)) {
      let obj = file.body as any;
      name.split("/").forEach((groupName) => {
        obj[groupName] = obj[groupName] || {};
        obj = obj[groupName];
      });
      obj.$type = resolvedType === "COLOR" ? "color" : "number";
      if (
        typeof value === "object" &&
        "type" in value &&
        value.type === "VARIABLE_ALIAS"
      ) {
        obj.$value = `{${figma.variables
          .getVariableById(value.id)!
          .name.replace(/\//g, ".")}}`;
      } else {
        obj.$value = resolvedType === "COLOR" ? rgbToHex(value as RGBA) : value;
      }
    }
  });

  return file;
}

function rgbToHex({ r, g, b, a }: RGBA) {
  if (a !== 1) {
    return `rgba(${[r, g, b]
      .map((n) => Math.round(n * 255))
      .join(", ")}, ${a.toFixed(4)})`;
  }
  const toHex = (value: number) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const hex = [toHex(r), toHex(g), toHex(b)].join("");
  return `#${hex}`;
}
