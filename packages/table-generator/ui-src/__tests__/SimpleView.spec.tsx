import { render, screen, fireEvent } from "@testing-library/react";
import userEvents from "@testing-library/user-event";
import React from "react";
import { ConfigView } from "../view/ConfigView";

describe("ConfigView", () => {
  beforeEach(() => {
    window.parent.postMessage = jest.fn();
    render(<ConfigView />);
  });
  test("renders title", () => {
    expect(screen.getByText("Table Config")).toBeInTheDocument();
  });
  test.skip("sends export message to figma when clicking export", async () => {
    await userEvents.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(window.parent.postMessage).toHaveBeenCalledTimes(1);
    expect(window.parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginMessage: { type: "export-csv-file" },
      }),
      "*"
    );
  });
});
