import React, { useCallback, useEffect, useState } from "react";
import { Input } from "@salt-ds/lab";
import { SelectableTextNodeInfo } from "../../shared-src";
import { Button } from "@salt-ds/core";
import { CloseSmallIcon, WarningIcon } from "@salt-ds/icons";

export const NodeKeyInput = ({
  nodeInfo,
  onUpdateNodeKey,
}: {
  nodeInfo: SelectableTextNodeInfo;
  onUpdateNodeKey: (id: string, key: string) => void;
}) => {
  // console.log("NodeKeyInput nodeInfo", nodeInfo);
  return (
    <Input
      // Use `key` to force rerender a new Input when nodeInfo key changes
      key={`input-${nodeInfo.key}`}
      defaultValue={nodeInfo.key}
      inputProps={{ placeholder: nodeInfo.name }}
      endAdornment={
        nodeInfo.key ? (
          <Button onClick={() => onUpdateNodeKey(nodeInfo.id, "")}>
            <CloseSmallIcon />
          </Button>
        ) : (
          <WarningIcon />
        )
      }
      onBlur={(e) => {
        const updatedValue = e.currentTarget.value;
        onUpdateNodeKey(nodeInfo.id, updatedValue);
      }}
    />
  );
};
