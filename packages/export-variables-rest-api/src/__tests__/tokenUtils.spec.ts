import { describe, expect, test } from "vitest";
import { parseTokenObject, generateCssFromJson } from "../tokenUtils";

const sampleValidColorToken = {
  a: { with6DigitHex: { $type: "color", $value: "#123456" } },
  b: { withAlphaHex: { $type: "color", $value: "#12345678" } },
  c: { withReferenceValue: { $type: "color", $value: "{a.with6DigitHex}" } },
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
--c-withReferenceValue: var(--a-with6DigitHex);`
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
--prefix-c-withReferenceValue: var(--prefix-a-with6DigitHex);`
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
