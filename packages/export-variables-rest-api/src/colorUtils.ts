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
  // // To RGBA
  // if (a !== 1) {
  //   return `rgba(${[r, g, b]
  //     .map((n) => Math.round(n * 255))
  //     .join(", ")}, ${a.toFixed(4)})`;
  // }
  // // To RGB
  // return `rgb(${[r, g, b].map((n) => Math.round(n * 255)).join(", ")})`;
}
