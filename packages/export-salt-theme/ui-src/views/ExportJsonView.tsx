import { Button, StackLayout } from "@salt-ds/core";
import React, { useEffect, useRef, useState } from "react";
import { PostToFigmaMessage } from "../../shared-src";
import { FigmaToUIMessageEvent } from "../types";
import { compressToEncodedURIComponent } from "lz-string";

function compressObject(object: object): string {
  const compressed = compressToEncodedURIComponent(JSON.stringify(object));
  return compressed;
}

export const ExportJsonView = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const copyButtonRef = useRef<HTMLButtonElement>(null);

  const [text, setText] = useState("");

  const onExport = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "generate-json",
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

  const onGoSandpack = () => {
    const newTheme = JSON.parse(text);

    console.log("generateSandpackLink", { newTheme });

    const compressed = compressObject(newTheme);

    const PREFIX = "https://origami-z.github.io/stunning-guacamole/#theme/";

    const url = PREFIX + compressed;
    window.open(url, "_blank");
  };

  const handleMessage = (event: FigmaToUIMessageEvent) => {
    const pluginMessage = event.data.pluginMessage;
    switch (pluginMessage.type) {
      case "generate-json-result":
        setText(JSON.stringify(pluginMessage.data, null, 2));
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
      <Button onClick={onGoSandpack}>Preview</Button>
    </StackLayout>
  );
};
