import {
  Button,
  FlexItem,
  FlexLayout,
  StackLayout,
  Checkbox,
  FormField,
  FormFieldLabel,
  Dropdown,
  Option,
  Input,
} from "@salt-ds/core";
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
    <StackLayout gap={1} className="viewRoot">
      <FormField labelPlacement="left">
        <FormFieldLabel>Prefix</FormFieldLabel>
        <Input
          value={prefix}
          inputProps={{
            placeholder: "e.g. brand-",
            onChange: (e) => setPrefix(e.target.value),
          }}
        ></Input>
      </FormField>
      <FormField labelPlacement="left">
        <FormFieldLabel>Format</FormFieldLabel>
        <Dropdown
          selected={[format]}
          onSelectionChange={(_, items) => {
            const item = items[0];
            if (item) {
              setFormat(item);
            }
          }}
        >
          {ExportColorAllFormats.map((f) => (
            <Option key={f} value={f} />
          ))}
        </Dropdown>
      </FormField>
      <FlexItem>
        <FlexLayout>
          <Checkbox
            label="Extract by first group"
            checked={ignoreFirstGroup}
            onChange={(event) => setIgnoreFirstGroup(event.target.checked)}
          />
          <Checkbox
            label="Trim default ending"
            checked={ignoreDefaultEnding}
            onChange={(event) => setIgnoreDefaultEnding(event.target.checked)}
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
