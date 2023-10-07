import { setRelaunchButton } from "../../utils/relaunch";
import { vi, test, expect, describe } from "vitest";

describe("setRelaunchButton", () => {
  test("sets relaunch data with empty string", () => {
    const mockSet = vi.fn();
    setRelaunchButton({ setRelaunchData: mockSet } as any);

    expect(mockSet).toBeCalledWith({ "edit-table": "" });
  });
});
