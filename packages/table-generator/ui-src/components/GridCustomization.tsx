import { GridHeaderValueProps } from "@salt-ds/data-grid";
import { Input } from "@salt-ds/lab";
import React, { createContext, useContext } from "react";

export const CustomGridContext = createContext<{
  rows: string[][];
  onUpdateHeaderValue: (newValue: string, columnIndex: number) => void;
}>({
  rows: [],
  onUpdateHeaderValue: () => {},
});

export const CustomEditableHeader = (props: GridHeaderValueProps<any>) => {
  const { onUpdateHeaderValue } = useContext(CustomGridContext);
  const { column } = props;
  return (
    <div>
      <Input
        className="custom-editable-header"
        value={column.info.props.name}
        onChange={(event) =>
          onUpdateHeaderValue(event.currentTarget.value, column.index)
        }
      />
    </div>
  );
};
