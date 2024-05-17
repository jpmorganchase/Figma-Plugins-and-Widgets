import { fireEvent, render, screen } from "@testing-library/react";
import userEvents from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ExportJsonView } from "../views/ExportJsonView";

describe("ExportJsonView", () => {
  beforeEach(() => {
    window.parent.postMessage = vi.fn<any>();
    render(<ExportJsonView />);
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
          type: "export-json",
        },
      }),
      "*"
    );
  });
  test("update format and sends updated export message to figma when clicking export", async () => {
    await userEvents.click(screen.getByRole("combobox", { name: "Format" }));
    await userEvents.click(screen.getByRole("option", { name: "HEX" }));

    await userEvents.click(screen.getByRole("button", { name: "Export" }));
    expect(window.parent.postMessage).toHaveBeenCalledTimes(1);
    expect(window.parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginMessage: {
          format: "HEX",
          type: "export-json",
        },
      }),
      "*"
    );
  });
});
