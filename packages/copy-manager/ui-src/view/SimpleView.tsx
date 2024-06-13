import {
  Button,
  Checkbox,
  Dropdown,
  FileDropZone,
  FileDropZoneIcon,
  FileDropZoneTrigger,
  FormField,
  FormFieldLabel,
  Option,
  StackLayout,
} from "@salt-ds/core";
import React, { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_LANG,
  PostToFigmaMessage,
  PostToUIMessage,
} from "../../shared-src/messages";
import { downloadDataUri } from "../components/utils";

import "./SimpleView.css";

export const SimpleView = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLangs, setCsvLangs] = useState<string[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>(DEFAULT_LANG);
  const [persistChecked, setPersistChecked] = useState(true);

  const handleWindowMessage = useCallback(
    (event: {
      data: {
        pluginMessage: PostToUIMessage;
      };
    }) => {
      if (event.data.pluginMessage) {
        const { pluginMessage } = event.data;
        switch (pluginMessage.type) {
          case "file-generated": {
            const { data, defaultFileName } = pluginMessage;
            downloadDataUri(data, defaultFileName);
            break;
          }
          case "available-lang-from-csv": {
            const { langs } = pluginMessage;
            setCsvLangs(langs);
          }
          default:
        }
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("message", handleWindowMessage);
    return () => {
      window.removeEventListener("message", handleWindowMessage);
    };
  }, [handleWindowMessage]);

  const onExportCsv = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "export-csv-file",
        } satisfies PostToFigmaMessage,
      },
      "*"
    );
  };

  const onUpdateCsv = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "update-content-with-lang",
          lang: selectedLang,
          persistInFigma: persistChecked,
        } satisfies PostToFigmaMessage,
      },
      "*"
    );
  };

  const onFileDrop = (_: any, files: readonly File[]) => {
    if (files.length && files[0] !== null) {
      const csv = files[0];
      setCsvFile(csv);
      var reader = new FileReader();
      reader.readAsText(csv, "UTF-8");
      reader.onload = function (evt) {
        const fileReadString = evt.target?.result as any;
        console.log({ fileReadString });
        parent.postMessage(
          {
            pluginMessage: {
              type: "detect-available-lang-from-csv",
              csvString: fileReadString,
            } satisfies PostToFigmaMessage,
          },
          "*"
        );
      };
      reader.onerror = function (evt) {
        console.error("error reading file");
        setCsvFile(null);
      };
    } else {
      setCsvFile(null);
    }
  };

  const revisionsAvailable = csvLangs.length > 0;

  return (
    <StackLayout className="simple-view" align="center">
      <Button onClick={onExportCsv}>Export CSV</Button>
      {csvFile === null ? (
        <FileDropZone
          style={{ width: 300 }}
          onDrop={onFileDrop}
          aria-label="File drop zone"
        >
          <FileDropZoneIcon />
          <strong>Drop files here or</strong>
          <FileDropZoneTrigger accept=".csv" onChange={onFileDrop} />
        </FileDropZone>
      ) : (
        <StackLayout gap={1}>
          <p>{csvFile.name}</p>
          <Checkbox
            label="Persist in Figma"
            checked={persistChecked}
            onChange={(event) => setPersistChecked(event.target.checked)}
          />
        </StackLayout>
      )}
      {revisionsAvailable && (
        <FormField className="language-formField">
          <FormFieldLabel>Version</FormFieldLabel>
          <Dropdown
            variant="secondary"
            selected={[selectedLang]}
            onSelectionChange={(_, items) => {
              const selected = items[0];
              selected && setSelectedLang(selected);
            }}
          >
            {csvLangs.map((l) => (
              <Option value={l} key={l} />
            ))}
          </Dropdown>
        </FormField>
      )}
      <Button onClick={onUpdateCsv}>Update</Button>
    </StackLayout>
  );
};
