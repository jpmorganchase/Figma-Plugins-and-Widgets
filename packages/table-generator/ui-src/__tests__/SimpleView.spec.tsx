import {
  render,
  screen,
  fireEvent,
  RenderResult,
} from "@testing-library/react";
import userEvents from "@testing-library/user-event";
import React from "react";
import { DEFAULT_TABLE_CONFIG } from "../../shared-src";
import { ConfigView } from "../view/ConfigView";

describe("ConfigView", () => {
  let renderResult: RenderResult;
  beforeEach(() => {
    window.parent.postMessage = jest.fn();
    renderResult = render(
      <ConfigView
        setTableConfig={() => {}}
        tableConfig={DEFAULT_TABLE_CONFIG}
        validTableSelected={true}
      />
    );
  });
  afterEach(() => jest.resetAllMocks());
  test("renders title", () => {
    expect(screen.getByText("Table Config")).toBeInTheDocument();
  });
  test("create button is disabled by default", () => {
    expect(screen.getByRole("button", { name: "Create" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });
  test("sends create message to figma when clicking create", async () => {
    renderResult?.rerender(
      <ConfigView
        setTableConfig={() => {}}
        tableConfig={{
          ...DEFAULT_TABLE_CONFIG,
          headerCell: {
            name: "Test header",
            key: "abc",
          },
          bodyCell: {
            name: "Test cell",
            key: "def",
          },
        }}
        validTableSelected={true}
      />
    );
    await userEvents.click(screen.getByRole("button", { name: "Create" }));
    expect(window.parent.postMessage).toHaveBeenCalledTimes(1);
    expect(window.parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginMessage: {
          type: "generate-table",
          config: {
            rows: 3,
            columns: 3,
            headerCell: {
              name: "Test header",
              key: "abc",
            },
            bodyCell: {
              name: "Test cell",
              key: "def",
            },
          },
        },
      }),
      "*"
    );
  });
});
