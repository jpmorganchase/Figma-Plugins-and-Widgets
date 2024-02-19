import { Color } from "./types";

function toHex(value: number) {
  const hex = Math.round(value * 255).toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

/**
 * Converts RGB[A] color to hex value
 * @link https://design-tokens.github.io/community-group/format/#color
 */
export function stringifyRGBA(color: Color) {
  if ("a" in color) {
    const { r, g, b, a } = color; // To HEX
    if (a !== 1) {
      return `#${[toHex(r), toHex(g), toHex(b), toHex(a)].join("")}`;
    } else {
      const hex = [toHex(r), toHex(g), toHex(b)].join("");
      return `#${hex}`;
    }
  }
  const { r, g, b } = color; // To HEX
  const hex = [toHex(r), toHex(g), toHex(b)].join("");
  return `#${hex}`;

  // According https://design-tokens.github.io/community-group/format/#color
  // Should only use hex
  // To RGBA
  // if ("a" in color) {
  //   const { r, g, b, a } = color;

  //   if (a !== 1) {
  //     return `rgba(${[r, g, b]
  //       .map((n) => Math.round(n * 255))
  //       .join(", ")}, ${a.toFixed(4)})`;
  //   }
  //   // To RGB
  //   return `rgb(${[r, g, b].map((n) => Math.round(n * 255)).join(", ")})`;
  // }
  // const { r, g, b } = color; // To HEX
  // return `rgb(${[r, g, b].map((n) => Math.round(n * 255)).join(", ")})`;
}

const isValidHex = (hex: string) => /^#([A-Fa-f0-9]{3,4}){1,2}$/.test(hex);

const getChunksFromString = (st: string, chunkSize: number) =>
  st.match(new RegExp(`.{${chunkSize}}`, "g"));

const convertHexUnitTo256 = (hexStr: string) =>
  parseInt(hexStr.repeat(2 / hexStr.length), 16);

const getAlphaFloat = (a: number, alpha?: number) => {
  if (typeof a !== "undefined") {
    return a / 255;
  }
  if (typeof alpha != "number" || alpha < 0 || alpha > 1) {
    return 1;
  }
  return alpha;
};

const to2Dp = (num: number) => {
  return Number.parseInt((num * 100).toFixed(0)) / 100;
};

/** Based on https://stackoverflow.com/a/53936623 */
export const hexToRGBA = (hex: string, alpha?: number) => {
  if (!isValidHex(hex)) {
    throw new Error("Invalid HEX");
  }
  const chunkSize = Math.floor((hex.length - 1) / 3);
  const hexArr = getChunksFromString(hex.slice(1), chunkSize);
  const [r, g, b, a] = hexArr!.map(convertHexUnitTo256);
  const alphaFloat = getAlphaFloat(a, alpha);
  if (alphaFloat === 1) {
    return `rgb(${r}, ${g}, ${b})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${to2Dp(alphaFloat)})`;
};
