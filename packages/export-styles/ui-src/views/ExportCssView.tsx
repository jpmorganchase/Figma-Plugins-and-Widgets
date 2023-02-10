import { Button, FlexItem, FlexLayout, StackLayout } from "@salt-ds/core";
import { Checkbox, Dropdown, FormField, Input } from "@salt-ds/lab";
import React, { useEffect, useRef, useState } from "react";
import {
  ExportColorAllFormats,
  ExportColorFormat,
  PostToFigmaMessage,
} from "../../shared-src";
import { FigmaToUIMessageEvent } from "../types";

export const ExportCssView = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const copyButtonRef = useRef<HTMLButtonElement>(null);

  const [text, setText] = useState("");
  const [prefix, setPrefix] = useState("");
  const [format, setFormat] = useState<ExportColorFormat>(
    ExportColorAllFormats[0]
  );
  const [ignoreFirstGroup, setIgnoreFirstGroup] = useState(false);
  const [ignoreDefaultEnding, setIgnoreDefaultEnding] = useState(false);

  const onExport = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "export-css",
          prefix,
          format,
          ignoreFirstGroup,
          ignoreDefaultEnding,
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
      case "generated":
        setText(pluginMessage.data);
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
      <FormField label="Prefix" labelPlacement="left">
        <Input
          value={prefix}
          onChange={(e) => setPrefix(e.currentTarget.value)}
          inputProps={{ placeholder: "e.g. brand-" }}
        ></Input>
      </FormField>
      <FormField label="Format" labelPlacement="left">
        <Dropdown
          source={ExportColorAllFormats}
          selected={format}
          onSelectionChange={(_, item) => {
            if (item) {
              setFormat(item);
            }
          }}
        />
      </FormField>
      <FlexItem>
        <FlexLayout>
          <Checkbox
            label="Extract by first group"
            checked={ignoreFirstGroup}
            onChange={(_, checked) => setIgnoreFirstGroup(checked)}
          />
          <Checkbox
            label="Trim default ending"
            checked={ignoreDefaultEnding}
            onChange={(_, checked) => setIgnoreDefaultEnding(checked)}
          />
        </FlexLayout>
      </FlexItem>
      <Button onClick={onExport}>Export</Button>
      <textarea
        aria-label="Code exported"
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        ref={textareaRef}
        spellCheck={false}
      ></textarea>
      <Button onClick={onCopy} ref={copyButtonRef}>
        Copy
      </Button>
    </StackLayout>
  );
};
