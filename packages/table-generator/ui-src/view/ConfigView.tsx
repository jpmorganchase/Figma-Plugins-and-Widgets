import {
  Button,
  FlexLayout,
  H2,
  StackLayout,
  Card,
  Label,
  FlexItem,
  Text,
  Tooltip,
} from "@salt-ds/core";
import { FormField, Input } from "@salt-ds/lab";
import React, { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_TABLE_CONFIG,
  PostToFigmaMessage,
  PostToUIMessage,
  TableConfig,
} from "../../shared-src";

import "./ConfigView.css";

export const ConfigView = () => {
  const [tableConfig, setTableConfig] =
    useState<TableConfig>(DEFAULT_TABLE_CONFIG);

  const handleWindowMessage = useCallback(
    (event: {
      data: {
        pluginMessage: PostToUIMessage;
      };
    }) => {
      if (event.data.pluginMessage) {
        const { pluginMessage } = event.data;
        console.log("handleWindowMessage pluginMessage", pluginMessage);
        switch (pluginMessage.type) {
          case "update-header-cell": {
            setTableConfig((prev) => ({
              ...prev,
              headerCell: pluginMessage.cell,
            }));
            break;
          }
          case "update-body-cell": {
            setTableConfig((prev) => ({
              ...prev,
              bodyCell: pluginMessage.cell,
            }));
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

  const onHeaderCellCardClick = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "set-table-header-cell",
        } satisfies PostToFigmaMessage,
      },
      "*"
    );
  };

  const onBodyCellCardClick = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "set-table-body-cell",
        } satisfies PostToFigmaMessage,
      },
      "*"
    );
  };

  const hasCellValuesSet =
    tableConfig.headerCell !== null && tableConfig.bodyCell !== null;

  return (
    <StackLayout className="config-view" align="stretch" gap={0}>
      <H2>Table Config</H2>
      <StackLayout style={{ flexGrow: 1 }}>
        <FlexLayout>
          <FlexItem grow={1} style={{ flexBasis: "50%" }}>
            <Card
              interactable
              className="cell-set-card"
              onClick={onHeaderCellCardClick}
            >
              <Text styleAs="h4">
                {tableConfig.headerCell?.name || "Click to set"}
              </Text>
              <Label variant="secondary">Header Cell</Label>
            </Card>
          </FlexItem>
          <FlexItem grow={1} style={{ flexBasis: "50%" }}>
            <Card
              interactable
              className="cell-set-card"
              onClick={onBodyCellCardClick}
            >
              <Text styleAs="h4">
                {tableConfig.bodyCell?.name || "Click to set"}
              </Text>
              <Label variant="secondary">Body Cell</Label>
            </Card>
          </FlexItem>
        </FlexLayout>
        <FlexLayout>
          <FormField
            label="Columns"
            // fullWidth={false}
            variant="secondary"
          >
            <Input
              type="number"
              inputProps={{ min: 1, max: 50 }}
              value={tableConfig.columns as any}
              onChange={(e) => {
                const newColumns = Number.parseInt(e.target.value);
                setTableConfig({ ...tableConfig, columns: newColumns });
              }}
            />
          </FormField>
          <FormField label="Rows" variant="secondary">
            <Input
              type="number"
              inputProps={{ min: 1, max: 50 }}
              value={tableConfig.rows as any}
              onChange={(e) => {
                const newRows = Number.parseInt(e.target.value);
                setTableConfig({ ...tableConfig, rows: newRows });
              }}
            />
          </FormField>
        </FlexLayout>
      </StackLayout>
      <FlexLayout justify="space-between">
        <Tooltip
          content="Set header and body cells before continue"
          disabled={hasCellValuesSet}
        >
          <Button
            variant="cta"
            disabled={!hasCellValuesSet}
            focusableWhenDisabled
          >
            Create
          </Button>
        </Tooltip>
      </FlexLayout>
    </StackLayout>
  );
};
