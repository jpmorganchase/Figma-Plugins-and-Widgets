import { fireEvent, render, screen } from "@testing-library/react";
import userEvents from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { SimpleView } from "../view/SimpleView";

describe("SimpleView", () => {
  beforeEach(() => {
    window.parent.postMessage = vi.fn<any>();
    render(<SimpleView />);
  });
  test("renders export button", () => {
    expect(screen.getByText("Export CSV")).toBeInTheDocument();
  });
  test("sends export message to figma when clicking export", async () => {
    await userEvents.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(window.parent.postMessage).toHaveBeenCalledTimes(1);
    expect(window.parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginMessage: { type: "export-csv-file" },
      }),
      "*"
    );
  });
  test.skip("reacts to failure message sent from Figma", async () => {
    fireEvent(
      window,
      new MessageEvent("message", {
        data: {
          pluginMessage: {
            type: "created-nodes-result",
            success: false,
          },
        },
      })
    );
    expect(
      await screen.findByRole("button", { name: /❌/i })
    ).toBeInTheDocument();
  });
});
