import { Button, StackLayout, Text } from "@salt-ds/core";
import { Dropdown, FormField } from "@salt-ds/lab";
import React, { useEffect, useId, useRef, useState } from "react";
import {
  ExportColorAllFormats,
  ExportColorFormat,
  FigmaVariableCollection,
  FigmaVariableMode,
  PostToFigmaMessage,
} from "../../shared-src";
import { FigmaToUIMessageEvent } from "../types";

export const VariableJsonView = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const copyButtonRef = useRef<HTMLButtonElement>(null);

  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");

  const [collections, setCollections] = useState<FigmaVariableCollection[]>([]);
  const [selectedCollection, setSelectedCollection] =
    useState<FigmaVariableCollection | null>(null);
  const [modes, setModes] = useState<FigmaVariableMode[]>([]);
  const [selectedMode, setSelectedMode] = useState<FigmaVariableMode | null>(
    null
  );

  const exportLabel = useId();

  useEffect(() => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "get-variable-collections",
        } satisfies PostToFigmaMessage,
      },
      "*"
    );
  }, []);

  const onExport = () => {
    if (selectedCollection && selectedMode)
      parent.postMessage(
        {
          pluginMessage: {
            type: "export-variable-to-json",
            collectionId: selectedCollection.id,
            modeId: selectedMode.modeId,
          } satisfies PostToFigmaMessage,
        },
        "*"
      );
  };

  const onCopy = () => {
    textareaRef.current?.select();
    document.execCommand("copy");
    copyButtonRef.current?.focus();
  };

  const handleMessage = (event: FigmaToUIMessageEvent) => {
    const pluginMessage = event.data.pluginMessage;
    switch (pluginMessage.type) {
      case "get-variable-collections-result": {
        setCollections(pluginMessage.collections);
        break;
      }
      case "get-variable-modes-result": {
        setModes(pluginMessage.modes);
        break;
      }
      case "export-variable-to-json-result":
        setFileName(pluginMessage.fileName);

        setText(pluginMessage.body);
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

  return (
    <StackLayout gap={1}>
      <FormField label="Collection">
        <Dropdown
          source={collections}
          selected={selectedCollection}
          itemToString={(item) => item?.name}
          onSelectionChange={(_, item) => {
            setSelectedCollection(item);
            if (item) {
              setSelectedMode(null);
              parent.postMessage(
                {
                  pluginMessage: {
                    type: "get-variable-modes",
                    collectionId: item.id,
                  } satisfies PostToFigmaMessage,
                },
                "*"
              );
            }
          }}
        />
      </FormField>
      <FormField label="Mode">
        <Dropdown
          source={modes}
          selected={selectedMode}
          itemToString={(item) => item?.name}
          onSelectionChange={(_, item) => {
            setSelectedMode(item);
          }}
        />
      </FormField>
      <Button
        disabled={selectedCollection === null || selectedMode === null}
        onClick={onExport}
      >
        Export
      </Button>
      <Text styleAs="label" as="label" id={exportLabel}>
        {fileName || "Export result"}
      </Text>
      <textarea
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        ref={textareaRef}
        spellCheck={false}
        aria-labelledby={exportLabel}
      ></textarea>
      <Button onClick={onCopy} ref={copyButtonRef}>
        Copy
      </Button>
    </StackLayout>
  );
};
