import { Button, StackLayout } from "@salt-ds/core";
import { FormField, Input, List } from "@salt-ds/lab";
import React, { useEffect, useRef, useState } from "react";
import { PostToFigmaMessage } from "../../shared-src";
import { FigmaToUIMessageEvent } from "../types";

export const MainView = () => {
  const [libraries, setLibraries] = useState<string[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<null | string>(null);

  const [collectionName, setCollectionName] =
    useState<string>("New Collection");
  const [modeName, setModeName] = useState<string>("Style");

  const [aliasCollectionName, setAliasCollectionName] = useState<string>("");
  const [aliasModeName, setAliasModeName] = useState<string>("");

  const onRefreshList = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "read-available-library",
        } satisfies PostToFigmaMessage,
      },
      "*"
    );
  };

  // Refresh list on load
  useEffect(() => {
    onRefreshList();
  }, []);

  const handleMessage = (event: FigmaToUIMessageEvent) => {
    const msg = event.data.pluginMessage;
    switch (msg.type) {
      case "read-available-library-result":
        setLibraries(msg.libraries);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const onStore = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "store-library-styles",
        } satisfies PostToFigmaMessage,
      },
      "*"
    );
  };

  const onCreateVariables = () => {
    if (selectedLibrary) {
      parent.postMessage(
        {
          pluginMessage: {
            type: "create-variables-from-library",
            selectedLibrary: selectedLibrary,
            collectionName,
            modeName,
            aliasCollectionName,
            aliasModeName,
          } satisfies PostToFigmaMessage,
        },
        "*"
      );
    }
  };

  return (
    <StackLayout gap={1}>
      <Button onClick={onStore}>Store Style</Button>
      <List
        source={libraries}
        onSelectionChange={(_, selected) => setSelectedLibrary(selected)}
      ></List>
      <FormField label="Collection Name">
        <Input
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
        />
      </FormField>
      <FormField label="Mode Name">
        <Input value={modeName} onChange={(e) => setModeName(e.target.value)} />
      </FormField>
      <Button onClick={onCreateVariables} disabled={selectedLibrary === null}>
        Create Variables
      </Button>
      <FormField label="Alias Collection Name">
        <Input
          value={aliasCollectionName}
          onChange={(e) => setAliasCollectionName(e.target.value)}
        />
      </FormField>
      <FormField label="Alias Mode Name">
        <Input
          value={aliasModeName}
          onChange={(e) => setAliasModeName(e.target.value)}
        />
      </FormField>
    </StackLayout>
  );
};
