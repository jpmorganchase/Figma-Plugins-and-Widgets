import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  FlexItem,
  FlexLayout,
  H2,
  StackLayout,
  Tooltip,
} from "@salt-ds/core";
import {
  GridHeaderValueProps,
  Grid,
  GridColumn,
  CellEditor,
  TextCellEditor,
} from "@salt-ds/data-grid";
import { FavoriteIcon } from "@salt-ds/icons";
import { Input } from "@salt-ds/lab";

import "./DataView.css";
import { PostToFigmaMessage, PostToUIMessage } from "../../shared-src";

const CustomEditableHeader = (props: GridHeaderValueProps<any>) => {
  const { column } = props;
  return (
    <div>
      <Input defaultValue={column.info.props.name} />
    </div>
  );
};

export const DataView = (props: { onToggleView?: () => void }) => {
  const [headerValues, setHeaderValues] = useState<string[]>([]);
  const [bodyValues, setBodyValues] = useState<string[][]>([]);

  // const [tableData, setTableData] = useState<ColumnData[]>([]);

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
    console.log("Update data dummy");
  };

  const onBodyDataChange = useCallback(
    (row: string[], rowIndex: number, value: string) => {
      console.log({ row, rowIndex, value });
      // setTableData((x) => {
      //   x = [...x];
      //   x[rowIndex] = { ...x[rowIndex], name: value };
      //   return x;
      // });
    },
    []
  );

  const hasValidGridSelected = false;
  return (
    <StackLayout className="data-view" align="stretch" gap={0}>
      <H2>Data</H2>
      <FlexItem grow={1} shrink={1} style={{ overflow: "auto" }}>
        <Grid
          rowData={bodyValues}
          style={{
            height: "100%",
          }}
        >
          {headerValues.map((header, colIndex) => {
            const id = `${header}-col-${colIndex}`;
            return (
              <GridColumn
                key={id}
                name={header}
                id={id}
                defaultWidth={100}
                getValue={(x) => x[colIndex]}
                headerValueComponent={CustomEditableHeader}
                onChange={onBodyDataChange}
              >
                <CellEditor>
                  <TextCellEditor />
                </CellEditor>
              </GridColumn>
            );
          })}
        </Grid>
      </FlexItem>
      <FlexLayout justify="space-between" className="button-bar">
        <Button variant="primary" onClick={props.onToggleView}>
          Back
        </Button>
        <Tooltip
          content="Select a grid created by the plugin to update data"
          disabled={hasValidGridSelected}
        >
          <Button
            variant="cta"
            disabled={!hasValidGridSelected}
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
