import {
  Button,
  StackLayout,
  FormField,
  FormFieldLabel,
  Dropdown,
  Option,
} from "@salt-ds/core";
import React, { useEffect, useRef, useState } from "react";
import {
  ExportColorAllFormats,
  ExportColorFormat,
  PostToFigmaMessage,
} from "../../shared-src";
import { FigmaToUIMessageEvent } from "../types";

export const ExportJsonView = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const copyButtonRef = useRef<HTMLButtonElement>(null);

  const [text, setText] = useState("");
  const [format, setFormat] = useState<ExportColorFormat>(
    ExportColorAllFormats[0]
  );

  const onExport = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "export-json",
          format,
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
      <Button onClick={onExport}>Export</Button>
      <textarea
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
