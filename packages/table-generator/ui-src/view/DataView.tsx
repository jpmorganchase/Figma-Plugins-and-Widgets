import React from "react";
import {
  Button,
  FlexItem,
  FlexLayout,
  H2,
  StackLayout,
  Tooltip,
} from "@salt-ds/core";
import { GridHeaderValueProps, Grid, GridColumn } from "@salt-ds/data-grid";
import { FavoriteIcon } from "@salt-ds/icons";
import { Input } from "@salt-ds/lab";

import "./DataView.css";

const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const getColName = (n: number) => {
  const s: string[] = [];
  s.push(abc[n % abc.length]);

  while (n > abc.length - 1) {
    n = Math.floor(n / abc.length) - 1;
    s.push(abc[n % abc.length]);
  }

  s.reverse();
  return s.join("");
};
const dummyColumnNames = [...new Array(5).keys()].map((i) => getColName(i));

function randomString(length: number = 20) {
  const abc = "abcdefghijklmnopqrstuvwxyz";
  const name: string[] = [];
  for (let i = 0; i < length; ++i) {
    name.push(abc[Math.floor(Math.random() * abc.length)]);
  }
  return name.join("");
}
const dummyData = [...new Array(10).keys()].map((i) => {
  const row: any = {
    id: `row${i}`,
  };
  dummyColumnNames.forEach((c) => {
    row[c] = randomString(5);
  });
  return row;
});

const CustomEditableHeader = (props: GridHeaderValueProps<any>) => {
  const { column } = props;
  return (
    <div>
      <FavoriteIcon />
      <Input defaultValue={column.info.props.name} />
    </div>
  );
};

export const DataView = (props: { onToggleView: () => void }) => {
  const updateData = () => {
    console.log("Update data");
  };
  const hasValidGridSelected = false;
  return (
    <StackLayout className="data-view" align="stretch" gap={0}>
      <H2>Data</H2>
      <FlexItem grow={1} shrink={1} style={{ overflow: "auto" }}>
        <Grid
          rowData={dummyData}
          style={{
            height: "100%",
            // width: "var(--grid-total-width)",
          }}
        >
          {dummyColumnNames.map((name) => (
            <GridColumn
              key={name}
              name={name}
              id={name}
              defaultWidth={100}
              getValue={(x) => x[name]}
              headerValueComponent={CustomEditableHeader}
            />
          ))}
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
            onClick={updateData}
          >
            Update
          </Button>
        </Tooltip>
      </FlexLayout>
    </StackLayout>
  );
};
