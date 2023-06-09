import {
  Button,
  FlexItem,
  FlexLayout,
  H2,
  StackLayout,
  Tooltip,
} from "@salt-ds/core";
import {
  CellEditor,
  Grid,
  GridColumn,
  TextCellEditor,
} from "@salt-ds/data-grid";
import React, { useCallback, useEffect, useState } from "react";
import { PostToFigmaMessage, PostToUIMessage } from "../../shared-src";
import {
  CustomEditableHeader,
  CustomGridContext,
} from "../components/GridCustomization";
import { ViewSharedProps } from "./types";

import "./DataView.css";

export const DataView = ({
  onToggleView,
  validTableSelected,
}: ViewSharedProps) => {
  const [headerValues, setHeaderValues] = useState<string[]>([]);
  const [bodyValues, setBodyValues] = useState<string[][]>([]);

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

            setHeaderValues(headerValues);
            setBodyValues(cellValues);
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
            headerValues,
            cellValues: bodyValues,
          },
        } satisfies PostToFigmaMessage,
      },
      "*"
    );
  };

  const onUpdateHeaderValue = (newValue: string, colIndex: number) => {
    setHeaderValues((prev) => [
      ...prev.slice(0, colIndex),
      newValue,
      ...prev.slice(colIndex + 1),
    ]);
  };

  return (
    <StackLayout className="data-view" align="stretch" gap={0}>
      {/* <H2>Data</H2> */}
      <FlexItem grow={1} shrink={1} style={{ overflow: "auto" }}>
        <CustomGridContext.Provider
          value={{
            rows: bodyValues,
            onUpdateHeaderValue,
          }}
        >
          <Grid
            rowData={bodyValues}
            style={{
              height: "100%",
            }}
          >
            {headerValues.map((header, colIndex) => {
              const id = `col-${colIndex}`;
              return (
                <GridColumn
                  key={id}
                  name={header}
                  id={id}
                  defaultWidth={100}
                  getValue={(x) => x[colIndex]}
                  // TODO: Salt Grid intercepts keyboard events so custom input doesn't work in header
                  // headerValueComponent={CustomEditableHeader}
                  onChange={(row: string[], rowIndex, newValue) => {
                    console.log({ row, rowIndex, colIndex, newValue });
                    const newRowData = [
                      ...row.slice(0, colIndex),
                      newValue,
                      ...row.slice(colIndex + 1),
                    ];
                    setBodyValues((prevBodyValues) => [
                      ...prevBodyValues.slice(0, rowIndex),
                      newRowData,
                      ...prevBodyValues.slice(rowIndex + 1),
                    ]);
                  }}
                >
                  <CellEditor>
                    <TextCellEditor />
                  </CellEditor>
                </GridColumn>
              );
            })}
          </Grid>
        </CustomGridContext.Provider>
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
