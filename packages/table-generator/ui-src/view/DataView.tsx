import {
  Button,
  FlexItem,
  FlexLayout,
  H2,
  StackLayout,
  Tooltip,
} from "@salt-ds/core";
import React, { useCallback, useEffect, useReducer, useState } from "react";
import { PostToFigmaMessage, PostToUIMessage } from "../../shared-src";
import { ViewSharedProps } from "./types";
import { tableReducer } from "../components/TableControlReducer";
import { parse, ParseResult, unparse } from "papaparse";
import { TableControl } from "../components/TableControl";

import "./DataView.css";

export const DataView = ({
  onToggleView,
  validTableSelected,
}: ViewSharedProps) => {
  const [tableState, dispatch] = useReducer(tableReducer, {
    cellValues: [],
    headerValues: [],
  });

  const [csvResults, setCsvResults] = useState<ParseResult<File> | undefined>();
  const [csvFile, setCsvFile] = useState<File | null>(null);

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

  return (
    <StackLayout className="data-view" align="stretch" gap={0}>
      {/* <H2>Data</H2> */}
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
        <Button variant="primary" onClick={onToggleView}>
          Back
        </Button>
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
