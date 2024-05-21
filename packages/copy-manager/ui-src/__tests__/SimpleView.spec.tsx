import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  test("Adds drop file and change revision via dropdown", async () => {
    const csvData = `id,page,name,characters,v2,listOption,headingLevel
$2:1,Page 1,Page Title,Features,Features v2,NONE,1
$2:1,Page 1,Heading,Body,,NONE,0
    `;
    const file = new File([csvData as BlobPart], "chucknorris.csv", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fireEvent.drop(screen.getByLabelText("File drop zone"), {
      dataTransfer: { files: [file], types: ["Files"] },
    });

    await waitFor(() => {
      expect(window.parent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          pluginMessage: {
            type: "detect-available-lang-from-csv",
            csvString: csvData,
          },
        }),
        "*"
      );
    });

    fireEvent(
      window,
      new MessageEvent("message", {
        data: {
          pluginMessage: {
            type: "available-lang-from-csv",
            langs: ["v2"],
          },
        },
      })
    );

    await userEvents.click(
      await screen.findByRole("combobox", { name: "Version" })
    );
    await userEvents.click(screen.getByRole("option", { name: "v2" }));

    await userEvents.click(screen.getByRole("button", { name: "Update" }));

    expect(window.parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        pluginMessage: {
          type: "update-content-with-lang",
          lang: "v2", // selected 2 lines above
          persistInFigma: true,
        },
      }),
      "*"
    );
  });
});
