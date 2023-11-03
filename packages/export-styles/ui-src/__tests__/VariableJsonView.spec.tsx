import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvents from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { VariableJsonView } from "../views/VariableJsonView";

describe("VariableJsonView", () => {
  beforeEach(() => {
    window.parent.postMessage = vi.fn<any>();
    render(<VariableJsonView />);
  });
  test("renders export button as disabled", () => {
    expect(screen.getByRole("button", { name: "Export" })).toBeDisabled();
  });
  test("sends export message to figma when selected collection and mode and clicking export", async () => {
    fireEvent(
      window,
      new MessageEvent("message", {
        data: {
          pluginMessage: {
            type: "get-variable-collections-result",
            collections: [
              { name: "Collection 1", id: "collection1" },
              { name: "Collection 2", id: "collection" },
            ],
          },
        },
      })
    );

    await userEvents.click(screen.getByRole("listbox", { name: "Collection" }));
    await userEvents.click(
      screen.getByRole("option", { name: "Collection 1" })
    );

    expect(screen.getByRole("button", { name: "Export" })).toBeDisabled();

    expect(window.parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginMessage: {
          type: "get-variable-modes",
          collectionId: "collection1",
        },
      }),
      "*"
    );

    fireEvent(
      window,
      new MessageEvent("message", {
        data: {
          pluginMessage: {
            type: "get-variable-modes-result",
            modes: [
              { name: "Light", modeId: "light" },
              { name: "Dark", modeId: "dark" },
            ],
          },
        },
      })
    );

    await userEvents.click(screen.getByRole("listbox", { name: "Mode" }));
    await userEvents.click(screen.getByRole("option", { name: "Light" }));
    expect(screen.getByRole("button", { name: "Export" })).not.toBeDisabled();
    await userEvents.click(screen.getByRole("button", { name: "Export" }));

    expect(window.parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginMessage: {
          type: "export-variable-to-json",
          collectionId: "collection1",
          modeId: "light",
        },
      }),
      "*"
    );
  });
  test("set value in textarea from message sent from Figma", async () => {
    const fileName = "filename.json";
    const expectedText = "text to be filled in";
    fireEvent(
      window,
      new MessageEvent("message", {
        data: {
          pluginMessage: {
            type: "export-variable-to-json-result",
            body: expectedText,
            fileName: fileName,
          },
        },
      })
    );
    const textarea = screen.getByLabelText(fileName);
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue(expectedText);
  });
  test("resets mode selection when switch collection selection", async () => {
    fireEvent(
      window,
      new MessageEvent("message", {
        data: {
          pluginMessage: {
            type: "get-variable-collections-result",
            collections: [
              { name: "Collection 1", id: "collection1" },
              { name: "Collection 2", id: "collection" },
            ],
          },
        },
      })
    );

    await userEvents.click(screen.getByRole("listbox", { name: "Collection" }));
    await userEvents.click(
      screen.getByRole("option", { name: "Collection 1" })
    );

    expect(screen.getByRole("button", { name: "Export" })).toBeDisabled();

    expect(window.parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginMessage: {
          type: "get-variable-modes",
          collectionId: "collection1",
        },
      }),
      "*"
    );

    fireEvent(
      window,
      new MessageEvent("message", {
        data: {
          pluginMessage: {
            type: "get-variable-modes-result",
            modes: [
              { name: "Light", modeId: "light" },
              { name: "Dark", modeId: "dark" },
            ],
          },
        },
      })
    );

    await userEvents.click(screen.getByRole("listbox", { name: "Mode" }));
    await userEvents.click(screen.getByRole("option", { name: "Light" }));
    expect(
      within(screen.getByRole("listbox", { name: "Mode" })).getByRole("option")
        .innerHTML
    ).toEqual("Light");
    expect(screen.getByRole("button", { name: "Export" })).not.toBeDisabled();

    await userEvents.click(screen.getByRole("listbox", { name: "Collection" }));
    await userEvents.click(
      screen.getByRole("option", { name: "Collection 2" })
    );
    expect(
      within(screen.getByRole("listbox", { name: "Mode" })).getByRole("option")
        .innerHTML
    ).toEqual("");
    expect(screen.getByRole("button", { name: "Export" })).toBeDisabled();
  });
});
