import { saltReferenceKeyTransformer } from "../utils";

describe("saltReferenceKeyTransformer", () => {
  test("removes curly braces", () => {
    expect(saltReferenceKeyTransformer("{gray.200}")).toEqual("Gray.200");
  });
  test("capitalize first letter", () => {
    expect(saltReferenceKeyTransformer("gray.200")).toEqual("Gray.200");
  });
  test("removes salt prefix", () => {
    expect(saltReferenceKeyTransformer("salt.color.gray.200")).toEqual(
      "Gray.200"
    );
  });
  test("maps fade separator", () => {
    expect(
      saltReferenceKeyTransformer(
        "salt.color.black.fade.separatorOpacity.secondary"
      )
    ).toEqual("Black.25A");
  });

  test("maps fade", () => {
    expect(
      saltReferenceKeyTransformer("salt.color.blue.30.fade.background.readonly")
    ).toEqual("Blue.30.15A");
  });
});
