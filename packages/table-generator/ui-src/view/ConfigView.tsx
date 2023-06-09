import {
  Button,
  InteractableCard,
  FlexItem,
  FlexLayout,
  H3,
  Label,
  StackLayout,
  Text,
  Tooltip,
} from "@salt-ds/core";
import { FormField, Input } from "@salt-ds/lab";
import React from "react";
import { PostToFigmaMessage } from "../../shared-src";
import { ViewSharedProps } from "./types";

import "./ConfigView.css";

export const ConfigView = ({
  onToggleView,
  setTableConfig,
  tableConfig,
}: ViewSharedProps) => {
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

  const createTable = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "generate-table",
          config: tableConfig,
        } satisfies PostToFigmaMessage,
      },
      "*"
    );
  };

  const hasCellValuesSet =
    tableConfig.headerCell !== null && tableConfig.bodyCell !== null;

  return (
    <StackLayout className="config-view" align="stretch" gap={0}>
      <H3>Table Config</H3>
      <StackLayout style={{ flexGrow: 1 }}>
        <FlexLayout>
          <FlexItem grow={1} style={{ flexBasis: "50%" }}>
            <InteractableCard
              className="cell-set-card"
              onClick={onHeaderCellCardClick}
            >
              <Text styleAs="h4" maxRows={1}>
                {tableConfig.headerCell?.name || "Click to set"}
              </Text>
              <Label variant="secondary">Header Cell</Label>
            </InteractableCard>
          </FlexItem>
          <FlexItem grow={1} style={{ flexBasis: "50%" }}>
            <InteractableCard
              className="cell-set-card"
              onClick={onBodyCellCardClick}
            >
              <Text styleAs="h4" maxRows={1}>
                {tableConfig.bodyCell?.name || "Click to set"}
              </Text>
              <Label variant="secondary">Body Cell</Label>
            </InteractableCard>
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
            variant="primary"
            disabled={!hasCellValuesSet}
            focusableWhenDisabled
            onClick={onToggleView}
          >
            Configure Data
          </Button>
        </Tooltip>

        <Tooltip
          content="Set header and body cells before continue"
          disabled={hasCellValuesSet}
        >
          <Button
            variant="cta"
            disabled={!hasCellValuesSet}
            focusableWhenDisabled
            onClick={createTable}
          >
            Create
          </Button>
        </Tooltip>
      </FlexLayout>
    </StackLayout>
  );
};
