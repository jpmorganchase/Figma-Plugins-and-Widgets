import {
  RenderResult,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvents from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { DEFAULT_TABLE_CONFIG } from "../../../shared-src/messages";
import { DataView } from "../../view/DataView";

describe("DataView", () => {
  let renderResult: RenderResult;
  beforeEach(() => {
    window.parent.postMessage = vi.fn<any>();
    renderResult = render(
      <DataView
        setTableConfig={() => {}}
        tableConfig={DEFAULT_TABLE_CONFIG}
        validTableSelected={false}
        initializing
      />
    );
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("settings", async () => {
    beforeEach(() => {
      fireEvent(
        window,
        new MessageEvent("message", {
          data: {
            pluginMessage: {
              type: "read-data-table-setting-result",
              setting: {
                syncCsvHeader: true, // making menu to true
                autoPopulateCsvColumns: true, // making menu to true
              },
            },
          },
        })
      );
    });

    test("syncCsvHeader", async () => {
      await userEvents.click(
        screen.getByRole("button", { name: "Open setting menu" })
      );
      const menu = await screen.findByRole("menu");
      await userEvents.click(
        await within(menu).findByRole("menuitem", {
          name: "Sync CSV Header enabled", // note "enabled" here
        })
      );

      expect(window.parent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          pluginMessage: {
            type: "set-data-table-setting",
            setting: {
              syncCsvHeader: false, // turned to false
              autoPopulateCsvColumns: true,
            },
          },
        }),
        "*"
      );
    });

    test("autoPopulateCsvColumns", async () => {
      await userEvents.click(
        screen.getByRole("button", { name: "Open setting menu" })
      );
      const menu = await screen.findByRole("menu");
      await userEvents.click(
        await within(menu).findByRole("menuitem", {
          name: "Auto populate columns enabled", // note "enabled" here
        })
      );

      expect(window.parent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          pluginMessage: {
            type: "set-data-table-setting",
            setting: {
              syncCsvHeader: true,
              autoPopulateCsvColumns: false, // turned to false
            },
          },
        }),
        "*"
      );
    });
  });
});
