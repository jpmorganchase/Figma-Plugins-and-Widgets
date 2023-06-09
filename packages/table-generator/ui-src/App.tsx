import { SaltProvider } from "@salt-ds/core";
import React, { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_TABLE_CONFIG,
  PostToFigmaMessage,
  PostToUIMessage,
  TableConfig,
} from "../shared-src";
import { CornerResizer } from "./components/CornerResizer";
import { useFigmaPluginTheme } from "./components/useFigmaPluginTheme";
import { ConfigView } from "./view/ConfigView";
import { DataView } from "./view/DataView";
import { PLUGIN_RELAUNCH_KEY_EDIT_TABLE } from "../shared-src/constants";

import "./App.css";

declare const __FIGMA_COMMAND__: string;

function App() {
  const [theme] = useFigmaPluginTheme();
  const [viewShown, setViewShown] = useState<"Config" | "Data">(
    __FIGMA_COMMAND__ === PLUGIN_RELAUNCH_KEY_EDIT_TABLE ? "Data" : "Config"
  );

  const [tableConfig, setTableConfig] =
    useState<TableConfig>(DEFAULT_TABLE_CONFIG);
  const [validTableSelected, setValidTableSelected] = useState(false);

  const handleWindowMessage = useCallback(
    (event: {
      data: {
        pluginMessage: PostToUIMessage;
      };
    }) => {
      if (event.data.pluginMessage) {
        const { pluginMessage } = event.data;

        switch (pluginMessage.type) {
          case "full-config-updated": {
            if (pluginMessage.config) {
              setValidTableSelected(true);
              setTableConfig(pluginMessage.config);
            } else {
              setValidTableSelected(false);
            }
            break;
          }
          case "update-header-cell": {
            setTableConfig((prev) => ({
              ...prev,
              headerCell: pluginMessage.cell,
            }));
            break;
          }
          case "update-body-cell": {
            setTableConfig((prev) => ({
              ...prev,
              bodyCell: pluginMessage.cell,
            }));
            break;
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

  useEffect(() => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "ui-finish-loading",
        } satisfies PostToFigmaMessage,
      },
      "*"
    );
  }, []);

  return (
    <SaltProvider mode={theme}>
      {viewShown === "Config" && (
        <ConfigView
          validTableSelected={validTableSelected}
          setTableConfig={setTableConfig}
          tableConfig={tableConfig}
          onToggleView={() => setViewShown("Data")}
        />
      )}
      {viewShown === "Data" && (
        <DataView
          validTableSelected={validTableSelected}
          setTableConfig={setTableConfig}
          tableConfig={tableConfig}
          onToggleView={() => setViewShown("Config")}
        />
      )}
      <CornerResizer />
    </SaltProvider>
  );
}

export default App;
