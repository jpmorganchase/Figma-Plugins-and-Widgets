type ThemeObject = any;
type TokenType = any;

export function setNestedKey(obj: any, path: string[], value: any): any {
  if (path.length === 0) {
    return obj;
  } else if (path.length === 1) {
    return {
      ...obj,
      [path[0]]: value,
    };
  } else {
    if (obj[path[0]]) {
      return {
        ...obj,
        [path[0]]: setNestedKey(obj[path[0]], path.slice(1), value),
      };
    } else {
      return {
        ...obj,
        [path[0]]: setNestedKey({}, path.slice(1), value),
      };
    }
  }
}

const KEY_MAP = new Map([["border", "borderColor"]]);

/**
 * https://stackoverflow.com/a/2970667
 **/
function camelize(str: string) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

/** Design side has different naming convention than code, need to modify the path to fit. */
export const fixPathForSalt = (path: string[]) => {
  return path.reduce(
    (prev, current, index, fullArray) => {
      const key = current.toLowerCase();

      const mappedKey = camelize(KEY_MAP.get(key) || key);

      // Ignore default when at last position
      if (mappedKey === "default" && fullArray.length - 1 === index) {
        return prev;
      } else {
        return [...prev, mappedKey];
      }
    },
    // prefix salt as top level namespace if not existed
    path[0] === "salt" ? [] : ["salt"]
  );
};

export const updateTheme = (
  theme: ThemeObject,
  newToken: TokenType,
  path: string[]
): ThemeObject => {
  let newTheme = { ...theme };

  const newPath = fixPathForSalt(path);

  // console.log({ newPath });

  newTheme = setNestedKey(newTheme, newPath, newToken);

  return newTheme;
};

// Refer to MDN font-weight page for more information.
// https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight#common_weight_name_mapping
export const FONT_WEIGHT_MAPPING: { [key: string]: number } = {
  Thin: 100,
  "Extra Light": 200,
  ExtraLight: 200,
  Light: 300,
  Regular: 400,
  Medium: 500,
  "Semi Bold": 600,
  SemiBold: 600,
  Semibold: 600,
  Bold: 700,
  "Extra Bold": 800,
  ExtraBold: 800,
  Extrabold: 800,
  Black: 900,
};

// Try convert to valid CSS line height, see https://developer.mozilla.org/en-US/docs/Web/CSS/line-height
function extractLineHeight(lineHeight: LineHeight): string {
  switch (lineHeight.unit) {
    case "AUTO": {
      return "normal";
    }
    case "PERCENT": {
      return Math.round(lineHeight.value) + "%";
    }
    case "PIXELS": {
      return Math.round(lineHeight.value) + "px";
    }
  }
  return "normal";
}

export function generateThemeJson(): ThemeObject {
  // Just support raw color without reference for now

  let newTheme: ThemeObject = {};

  const localPaintStyles = figma.getLocalPaintStyles();
  for (let index = 0; index < localPaintStyles.length; index++) {
    const paintStyle = localPaintStyles[index];
    if (
      paintStyle.paints.length === 1 &&
      paintStyle.paints[0].type === "SOLID"
    ) {
      const objPaths = paintStyle.name.split("/");

      const { color, opacity } = paintStyle.paints[0];

      const newColorToken = {
        $type: "color",
        $value: {
          r: Math.round(color.r * 255),
          g: Math.round(color.g * 255),
          b: Math.round(color.b * 255),
          a: opacity ? Math.round(opacity * 100) / 100 : undefined,
        },
      };

      newTheme = updateTheme(newTheme, newColorToken as any, objPaths);
    }
  }

  const localTextStyles = figma.getLocalTextStyles();
  for (let index = 0; index < localTextStyles.length; index++) {
    const textStyle = localTextStyles[index];

    // NOTE: not all information is extracted
    const { fontName, fontSize, lineHeight } = textStyle;
    const { family, style } = fontName;

    const newTypographyToken = {
      $type: "typography",
      $value: {
        fontFamily: family,
        fontWeight: FONT_WEIGHT_MAPPING[style] || 400, // default to 400 / regular
        fontSize: fontSize + "px", // Figma fontSize is unit-less
        lineHeight: extractLineHeight(lineHeight),
      },
    };

    const objPaths = textStyle.name.split("/");
    newTheme = updateTheme(newTheme, newTypographyToken as any, objPaths);
  }

  return newTheme;
}
