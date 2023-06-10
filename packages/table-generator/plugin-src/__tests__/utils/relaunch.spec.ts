import { setRelaunchButton } from "../../utils/relaunch";

describe("setRelaunchButton", () => {
  test("sets relaunch data with empty string", () => {
    const mockSet = jest.fn();
    setRelaunchButton({ setRelaunchData: mockSet } as any);

    expect(mockSet).toBeCalledWith({ "edit-table": "" });
  });
});
