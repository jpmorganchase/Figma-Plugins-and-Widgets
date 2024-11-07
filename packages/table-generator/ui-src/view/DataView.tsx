import {
  Button,
  FlexItem,
  FlexLayout,
  H3,
  StackLayout,
  Tooltip,
} from "@salt-ds/core";
import { CsvIcon, DownloadIcon } from "@salt-ds/icons";
import { ContentStatus } from "../components/ContentStatus";
import { ParseResult, parse, unparse } from "papaparse";
import { useCallback, useEffect, useReducer, useState } from "react";
import { PostToFigmaMessage, PostToUIMessage } from "../../shared-src/messages";
import { FileUploadButton } from "../components/FileUploadButton";
import {
  SettingMenuButton,
  SettingMenuButtonSetting,
} from "../components/SettingMenuButton";
import { TableControl } from "../components/TableControl";
import { tableReducer } from "../components/TableControlReducer";
import { downloadBlob, maskArrayToLength } from "../components/utils";
import { ViewSharedProps } from "./types";

import "./DataView.css";

const CSV_SYNC_HEADER_LABEL = "Sync CSV Header";
const POPULATE_ALL_CVS_COLUMNS_LABEL = "Auto populate columns";

export const DataView = ({
  onToggleView,
  validTableSelected,
  tableConfig,
  initializing,
}: ViewSharedProps) => {
  const [tableState, dispatch] = useReducer(tableReducer, {
    cellValues: [],
    headerValues: [],
  });

  const [csvResults, setCsvResults] = useState<ParseResult<File> | undefined>();
  // This would contain CSV file name if needed
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
    parent.postMessage(
      {
        pluginMessage: {
          type: "read-data-table-setting",
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
            const { data } = pluginMessage;
            const { cellValues, headerValues } = data;

            dispatch({
              type: "UPDATE_ALL_VALUES",
              headerValues,
              cellValues,
            });
            break;
          }
          case "read-data-table-setting-result": {
            const { setting } = pluginMessage;
            setCsvSyncHeader(setting.syncCsvHeader);
            setAutoPopulateCsvColumns(setting.autoPopulateCsvColumns);
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
    const fileName = "Table Data.csv";
    // Use blob instead of plain text downloadDataUri, as Safari wipes out new line
    downloadBlob(blobToDownload, fileName);
  };

  const onSettingMenuButtonChange = (
    newSetting: SettingMenuButtonSetting[]
  ) => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "set-data-table-setting",
          setting: {
            syncCsvHeader:
              newSetting.find((s) => s.label === CSV_SYNC_HEADER_LABEL)
                ?.selected || false,
            autoPopulateCsvColumns:
              newSetting.find((s) => s.label === POPULATE_ALL_CVS_COLUMNS_LABEL)
                ?.selected || false,
          },
        } satisfies PostToFigmaMessage,
      },
      "*"
    );
  };

  return (
    <StackLayout className="data-view" align="stretch" gap={0}>
      <H3>Configure Data</H3>
      <FlexItem grow={1} shrink={1} style={{ overflow: "auto" }}>
        {tableConfig && !validTableSelected ? (
          initializing ? (
            <ContentStatus
              message="Please wait while parsing the data."
              title="Initializing"
            />
          ) : (
            <ContentStatus
              message="Please select a table generated by the plugin to populate data."
              title="Invalid selection"
            />
          )
        ) : (
          <TableControl
            editableHeader
            dispatch={dispatch}
            tableState={tableState}
            disableRowEdit
            csvImportResults={csvResults}
            disableNewRowFromCsv
            updateColumnNameOnCsvSelect={csvSyncHeader}
          />
        )}
      </FlexItem>

      <FlexLayout justify="space-between" className="button-bar">
        <FlexLayout gap={1} align="center">
          <Button variant="primary" onClick={onToggleView}>
            Back
          </Button>

          <FileUploadButton
            // key={Math.random()} // TODO: how to resolve selecting the same file doesn't get callback?
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
          <SettingMenuButton
            settings={[
              { label: CSV_SYNC_HEADER_LABEL, selected: csvSyncHeader },
              {
                label: POPULATE_ALL_CVS_COLUMNS_LABEL,
                selected: autoPopulateCsvColumns,
              },
            ]}
            onSettingsChanged={onSettingMenuButtonChange}
          />
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
