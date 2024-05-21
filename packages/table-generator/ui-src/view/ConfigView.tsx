import {
  Button,
  FlexItem,
  FlexLayout,
  H3,
  InteractableCard,
  StackLayout,
  Text,
  Tooltip,
  FormField,
  FormFieldLabel,
  Input,
} from "@salt-ds/core";
import { PostToFigmaMessage } from "../../shared-src/messages";
import { ViewSharedProps } from "./types";

import "./ConfigView.css";

export const ConfigView = ({
  onToggleView,
  setTableConfig,
  tableConfig,
  validTableSelected,
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

  const updateTable = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "update-table",
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
              disabled={validTableSelected}
              className="cell-set-card"
              onClick={onHeaderCellCardClick}
              accent="bottom"
            >
              <Text styleAs="h4" maxRows={1}>
                {tableConfig.headerCell?.name || "Click to set"}
              </Text>
              <Text variant="secondary" styleAs="label">
                Header Cell
              </Text>
            </InteractableCard>
          </FlexItem>
          <FlexItem grow={1} style={{ flexBasis: "50%" }}>
            <InteractableCard
              disabled={validTableSelected}
              className="cell-set-card"
              onClick={onBodyCellCardClick}
              accent="bottom"
            >
              <Text styleAs="h4" maxRows={1}>
                {tableConfig.bodyCell?.name || "Click to set"}
              </Text>
              <Text variant="secondary" styleAs="label">
                Body Cell
              </Text>
            </InteractableCard>
          </FlexItem>
        </FlexLayout>
        <FlexLayout>
          <FormField>
            <FormFieldLabel>Columns</FormFieldLabel>
            <Input
              variant="secondary"
              inputProps={{
                min: 1,
                max: 50,
                type: "number",
                onChange: (e) => {
                  const newColumns = Number.parseInt(e.target.value);
                  setTableConfig({ ...tableConfig, columns: newColumns });
                },
              }}
              value={tableConfig.columns as any}
            />
          </FormField>
          <FormField>
            <FormFieldLabel>Rows</FormFieldLabel>
            <Input
              variant="secondary"
              inputProps={{
                min: 1,
                max: 50,
                type: "number",
                onChange: (e) => {
                  const newRows = Number.parseInt(e.target.value);
                  setTableConfig({ ...tableConfig, rows: newRows });
                },
              }}
              value={tableConfig.rows as any}
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
            disabled={!hasCellValuesSet || !validTableSelected}
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
            onClick={validTableSelected ? updateTable : createTable}
          >
            {validTableSelected ? "Update" : "Create"}
          </Button>
        </Tooltip>
      </FlexLayout>
    </StackLayout>
  );
};
