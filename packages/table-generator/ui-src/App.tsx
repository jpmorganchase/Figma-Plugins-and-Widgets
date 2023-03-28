import { SaltProvider } from "@salt-ds/core";
import React, { useEffect, useState } from "react";
import { PostToFigmaMessage } from "../shared-src";
import { useFigmaPluginTheme } from "./components/useFigmaPluginTheme";
import { CornerResizer } from "./components/CornerResizer";
import { ConfigView } from "./view/ConfigView";

import "./App.css";
import { DataView } from "./view/DataView";

function App() {
  const [theme] = useFigmaPluginTheme();
  const [viewShown, setViewShown] = useState<"Config" | "Data">("Config");

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
        <ConfigView onToggleView={() => setViewShown("Data")} />
      )}
      {viewShown === "Data" && (
        <DataView onToggleView={() => setViewShown("Config")} />
      )}
      <CornerResizer />
    </SaltProvider>
  );
}

export default App;
