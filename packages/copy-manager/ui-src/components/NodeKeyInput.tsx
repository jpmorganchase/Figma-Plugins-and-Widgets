import { Button, Input } from "@salt-ds/core";
import { CloseSmallIcon, WarningIcon } from "@salt-ds/icons";
import React from "react";
import { SelectableTextNodeInfo } from "../../shared-src/messages";

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
      inputProps={{
        placeholder: nodeInfo.name,
        onBlur: (e) => {
          const updatedValue = e.target.value;
          onUpdateNodeKey(nodeInfo.id, updatedValue);
        },
      }}
      endAdornment={
        nodeInfo.key ? (
          <Button onClick={() => onUpdateNodeKey(nodeInfo.id, "")}>
            <CloseSmallIcon />
          </Button>
        ) : (
          <WarningIcon />
        )
      }
    />
  );
};
