import { SaltProvider } from "@salt-ds/core";
import React, { useEffect } from "react";
import { PostToFigmaMessage } from "../shared-src";
import { useFigmaPluginTheme } from "./components/useFigmaPluginTheme";
import { CornerResizer } from "./components/CornerResizer";
import { ConfigView } from "./view/ConfigView";

import "./App.css";

function App() {
  const [theme] = useFigmaPluginTheme();

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
      <ConfigView />
      <CornerResizer />
    </SaltProvider>
  );
}

export default App;
