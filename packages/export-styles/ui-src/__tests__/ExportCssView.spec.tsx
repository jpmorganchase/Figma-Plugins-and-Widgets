import { render, screen, fireEvent } from "@testing-library/react";
import userEvents from "@testing-library/user-event";
import React from "react";
import { ExportCssView } from "../views/ExportCssView";

describe("ExportCssView", () => {
  beforeEach(() => {
    window.parent.postMessage = jest.fn();
    render(<ExportCssView />);
  });
  test("renders export button", () => {
    expect(screen.getByText("Export")).toBeInTheDocument();
  });
  test("sends export message to figma when clicking export", async () => {
    await userEvents.click(screen.getByRole("button", { name: "Export" }));
    expect(window.parent.postMessage).toHaveBeenCalledTimes(1);
    expect(window.parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginMessage: {
          format: "RGB",
          ignoreDefaultEnding: false,
          ignoreFirstGroup: false,
          prefix: "",
          type: "export-css",
        },
      }),
      "*"
    );
  });
  test("set value in textarea from message sent from Figma", async () => {
    const expectedText = "text to be filled in";
    fireEvent(
      window,
      new MessageEvent("message", {
        data: {
          pluginMessage: {
            type: "generated",
            data: expectedText,
          },
        },
      })
    );
    const textarea = screen.getByLabelText("Code exported");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue(expectedText);
  });
});
