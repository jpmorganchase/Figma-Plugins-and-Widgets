import {
  Button,
  FlexItem,
  FlexLayout,
  H3,
  StackLayout,
  Tooltip,
} from "@salt-ds/core";
import { CsvIcon, DownloadIcon } from "@salt-ds/icons";
import { parse, ParseResult, unparse } from "papaparse";
import React, { useCallback, useEffect, useReducer, useState } from "react";
import { PostToFigmaMessage, PostToUIMessage } from "../../shared-src";
import { TableControl } from "../components/TableControl";
import { tableReducer } from "../components/TableControlReducer";
import { ViewSharedProps } from "./types";

import { FileUploadButton } from "../components/FileUploadButton";
import { downloadBlob, maskArrayToLength } from "../components/utils";

import "./DataView.css";

export const DataView = ({
  onToggleView,
  validTableSelected,
  tableConfig,
}: ViewSharedProps) => {
  const [tableState, dispatch] = useReducer(tableReducer, {
    cellValues: [],
    headerValues: [],
  });

  const [csvResults, setCsvResults] = useState<ParseResult<File> | undefined>();
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [csvSyncHeader, setCsvSyncHeader] = useState<boolean>(false);
  const [autoPopulateCsvColumns, setAutoPopulateCsvColumns] =
    useState<boolean>(false);

  useEffect(() => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "read-table-data",
        } satisfies PostToFigmaMessage,
      },
      "*"
    );
  }, []);

  const handleWindowMessage = useCallback(
    (event: {
      data: {
        pluginMessage: PostToUIMessage;
      };
    }) => {
      if (event.data.pluginMessage) {
        const { pluginMessage } = event.data;

        switch (pluginMessage.type) {
          case "read-table-data-result": {
            console.log("pluginMessage", pluginMessage);
            const { data } = pluginMessage;
            const { cellValues, headerValues } = data;

            dispatch({
              type: "UPDATE_ALL_VALUES",
              headerValues,
              cellValues,
            });
            break;
          }
          default:
        }
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("message", handleWindowMessage);
    return () => {
      window.removeEventListener("message", handleWindowMessage);
    };
  }, [handleWindowMessage]);

  const updateDataInFigma = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "set-table-data",
          data: {
            headerValues: tableState.headerValues,
            cellValues: tableState.cellValues,
          },
        } satisfies PostToFigmaMessage,
      },
      "*"
    );
  };

  const handleFilesUpload = (files: FileList | null) => {
    const file = files?.[0];
    if (file) {
      parse<File, File>(file, {
        header: true,
        complete: function (results, file) {
          console.log("CSV parse complete:", results, file);
          setCsvResults(results);
          setCsvFile(file);

          if (autoPopulateCsvColumns) {
            const headerValues = maskArrayToLength(
              results.meta.fields || [],
              tableConfig.columns,
              ""
            );

            const cellValues = maskArrayToLength(
              results.data.map((rowData) => {
                return headerValues.map(
                  (headerCell) =>
                    (rowData as unknown as { [k: string]: string })[
                      headerCell
                    ] || ""
                );
              }),
              tableConfig.rows,
              Array(headerValues.length).fill("")
            );

            dispatch({
              type: "UPDATE_ALL_VALUES",
              cellValues: cellValues,
              headerValues: csvSyncHeader
                ? headerValues
                : tableState.headerValues,
              groupHeaderValues: tableState.groupHeaderValues,
            });
          }
        },
      });
    }
  };

  const onDownload = () => {
    const csv = unparse({
      fields: tableState.headerValues,
      data: tableState.cellValues,
    });
    const blobToDownload = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const fileName = "Grid Data.csv";
    // Use blob instead of plain text downloadDataUri, as Safari wipes out new line
    downloadBlob(blobToDownload, fileName);
  };

  return (
    <StackLayout className="data-view" align="stretch" gap={0}>
      <H3>Configure Data</H3>
      <FlexItem grow={1} shrink={1} style={{ overflow: "auto" }}>
        <TableControl
          editableHeader
          dispatch={dispatch}
          tableState={tableState}
          disableRowEdit
          csvImportResults={csvResults}
          disableNewRowFromCsv
          // TODO: enable via setting
          // updateColumnNameOnCsvSelect={csvSyncHeader}
        />
      </FlexItem>
      <FlexLayout justify="space-between" className="button-bar">
        <FlexLayout gap={1} align="center">
          <Button variant="primary" onClick={onToggleView}>
            Back
          </Button>

          <FileUploadButton
            disabled={!validTableSelected}
            accept=".csv"
            onFilesChanged={handleFilesUpload}
            TooltipProps={{
              content: validTableSelected
                ? "Upload CSV to update data"
                : "Only available when a valid grid is selected",
            }}
          >
            <CsvIcon />
          </FileUploadButton>

          <Tooltip
            placement="top"
            content={
              validTableSelected
                ? "Download all data as CSV"
                : "Only available when a valid grid is selected"
            }
          >
            <Button
              focusableWhenDisabled
              onClick={onDownload}
              disabled={!validTableSelected}
            >
              <DownloadIcon />
            </Button>
          </Tooltip>
        </FlexLayout>

        <Tooltip
          content="Select a grid created by the plugin to update data"
          disabled={validTableSelected}
        >
          <Button
            variant="cta"
            disabled={!validTableSelected}
            focusableWhenDisabled
            onClick={updateDataInFigma}
          >
            Update
          </Button>
        </Tooltip>
      </FlexLayout>
    </StackLayout>
  );
};
