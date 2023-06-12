import { updateColumn } from "../../utils/generate-table";

describe("updateColumn", () => {
  test("not adding or removing when config rows stays the same", () => {
    const mockRemove = jest.fn();
    const mockAppendChild = jest.fn();
    const mockColumn = {
      type: "FRAME",
      appendChild: mockAppendChild,
      children: [
        { type: "INSTANCE", remove: mockRemove }, // header
        { type: "INSTANCE", remove: mockRemove }, // cell 1
      ],
    } as any;

    const mockComponent = {
      type: "COMPONENT",
      createInstance: () => ({ type: "INSTANCE", layoutAlign: "INHERIT" }),
    } as any;

    updateColumn(mockColumn, 1, mockComponent);
    expect(mockAppendChild).not.toBeCalled();
    expect(mockRemove).not.toBeCalled();
  });

  test("removes excess cells when new config has less rows", () => {
    const mockRemove = jest.fn();
    const mockAppendChild = jest.fn();
    const mockColumn = {
      type: "FRAME",
      appendChild: mockAppendChild,
      children: [
        { type: "INSTANCE", remove: mockRemove }, // header
        { type: "INSTANCE", remove: mockRemove }, // cell 1
        { type: "INSTANCE", remove: mockRemove }, // cell 2
        { type: "INSTANCE", remove: mockRemove }, // cell 3
      ],
    } as any;

    const mockComponent = {
      type: "COMPONENT",
      createInstance: () => ({ type: "INSTANCE", layoutAlign: "INHERIT" }),
    } as any;

    updateColumn(mockColumn, 1, mockComponent);
    expect(mockAppendChild).not.toBeCalled();
    expect(mockRemove).toBeCalledTimes(2);
  });

  test("adds missing cells when new config has more rows", () => {
    const mockRemove = jest.fn();
    const mockAppendChild = jest.fn();
    const mockColumn = {
      type: "FRAME",
      appendChild: mockAppendChild,
      children: [
        { type: "INSTANCE", remove: mockRemove }, // header
        { type: "INSTANCE", remove: mockRemove }, // cell 1
      ],
    } as any;

    const mockComponent = {
      type: "COMPONENT",
      createInstance: () => ({ type: "INSTANCE", layoutAlign: "INHERIT" }),
    } as any;

    updateColumn(mockColumn, 3, mockComponent);
    expect(mockAppendChild).toBeCalledTimes(2);
    expect(mockRemove).not.toBeCalled();
  });
});
