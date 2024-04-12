import { describe, expect, test } from "vitest";
import {
  parseTokenObject,
  generateCssFromJson,
  updateKeysWithOption,
} from "../tokenUtils";

const sampleValidColorToken = {
  a: { with6DigitHex: { $type: "color", $value: "#123456" } },
  b: { withAlphaHex: { $type: "color", $value: "#12345678" } },
  c: { withReferenceValue: { $type: "color", $value: "{a.with6DigitHex}" } },
  d: { "key with space": { $type: "color", $value: "{a.with6DigitHex}" } },
};

const sampleValidNumberToken = {
  a: { number: { $type: "number", $value: 1 } },
  c: { withReferenceValue: { $type: "color", $value: "{a.number}" } },
};

describe("validateTokenObject", () => {
  test("valid color tokens", () => {
    expect(parseTokenObject(sampleValidColorToken).success).toBe(true);
  });
  test("invalid color tokens", () => {
    expect(
      parseTokenObject({
        a: { with5DigitHex: { $type: "color", $value: "#12345" } },
        b: { with7DigitHex: { $type: "color", $value: "#1234567" } },
      }).success
    ).toBe(false);
  });
  test("valid number tokens", () => {
    expect(parseTokenObject(sampleValidNumberToken).success).toBe(true);
  });
  test("invalid number tokens", () => {
    expect(
      parseTokenObject({
        a: { notNumber: { $type: "color", $value: "string" } },
      }).success
    ).toBe(false);
  });
  test("unsupported token types", () => {
    expect(
      parseTokenObject({
        a: { otherTypes: { $type: "other", $value: "string" } },
      }).success
    ).toBe(false);
  });
});

describe("generateCssFromJson", () => {
  describe("color tokens", () => {
    test("generates css", () => {
      const generatedCss = generateCssFromJson(
        JSON.stringify(sampleValidColorToken)
      );
      expect(generatedCss).toEqual(
        `--a-with6DigitHex: #123456;
--b-withAlphaHex: #12345678;
--c-withReferenceValue: var(--a-with6DigitHex);
--d-keyWithSpace: var(--a-with6DigitHex);`
      );
    });

    test("generates css with prefix when provided", () => {
      const generatedCss = generateCssFromJson(
        JSON.stringify(sampleValidColorToken),
        { prefix: "prefix" }
      );
      expect(generatedCss).toEqual(
        `--prefix-a-with6DigitHex: #123456;
--prefix-b-withAlphaHex: #12345678;
--prefix-c-withReferenceValue: var(--prefix-a-with6DigitHex);
--prefix-d-keyWithSpace: var(--prefix-a-with6DigitHex);`
      );
    });

    test("generates css with rgbaFormat when provided", () => {
      const generatedCss = generateCssFromJson(
        JSON.stringify(sampleValidColorToken),
        { rgbaFormat: true }
      );
      expect(generatedCss).toEqual(
        `--a-with6DigitHex: rgb(18, 52, 86);
--b-withAlphaHex: rgba(18, 52, 86, 0.47);
--c-withReferenceValue: var(--a-with6DigitHex);
--d-keyWithSpace: var(--a-with6DigitHex);`
      );
    });

    test("generates css with kebab case option", () => {
      const generatedCss = generateCssFromJson(
        JSON.stringify(sampleValidColorToken),
        { kebabCase: true, rgbaFormat: true }
      );
      expect(generatedCss).toEqual(
        `--a-with6-digit-hex: rgb(18, 52, 86);
--b-with-alpha-hex: rgba(18, 52, 86, 0.47);
--c-with-reference-value: var(--a-with6-digit-hex);
--d-key-with-space: var(--a-with6-digit-hex);`
      );
    });
  });

  describe("number tokens", () => {
    test("generates css", () => {
      const generatedCss = generateCssFromJson(
        JSON.stringify(sampleValidNumberToken)
      );
      expect(generatedCss).toEqual(
        `--a-number: 1px;
--c-withReferenceValue: var(--a-number);`
      );
    });
    test("generates css with prefix when provided", () => {
      const generatedCss = generateCssFromJson(
        JSON.stringify(sampleValidNumberToken),
        { prefix: "prefix" }
      );
      expect(generatedCss).toEqual(
        `--prefix-a-number: 1px;
--prefix-c-withReferenceValue: var(--prefix-a-number);`
      );
    });
  });
});

describe("updateKeysWithOption", () => {
  const inputKeys = ["a", "b"];
  test("returns same keys if no option provided", () => {
    expect(updateKeysWithOption(inputKeys)).toEqual(inputKeys);
  });
  test("adds prefix when provided in option", () => {
    expect(updateKeysWithOption(inputKeys, { prefix: "abc" })).toEqual([
      "abc",
      ...inputKeys,
    ]);
  });
  test("adds special prefix when first key match in map in option", () => {
    expect(
      updateKeysWithOption(inputKeys, { specialPrefixMap: { a: "abc" } })
    ).toEqual(["abc", ...inputKeys]);
  });
  test("returns same key when first key does not match in map in option", () => {
    expect(
      updateKeysWithOption(inputKeys, { specialPrefixMap: { "not-a": "abc" } })
    ).toEqual(inputKeys);
  });
  test("adds both prefix and special prefix when first key match in map in option", () => {
    expect(
      updateKeysWithOption(inputKeys, {
        prefix: "prefix",
        specialPrefixMap: { a: "abc" },
      })
    ).toEqual(["prefix", "abc", ...inputKeys]);
  });
  test("removes last default key when removeSuffixDefault is true", () => {
    expect(
      updateKeysWithOption([...inputKeys, "default"], {
        removeSuffixDefault: true,
      })
    ).toEqual(inputKeys);
  });
});
