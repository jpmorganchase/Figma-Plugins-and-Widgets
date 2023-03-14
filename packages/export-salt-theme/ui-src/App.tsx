import { SaltProvider } from "@salt-ds/core";
import React, { useEffect } from "react";
import { PostToFigmaMessage } from "../shared-src";
import { CornerResizer } from "./components/CornerResizer";
import { useFigmaPluginTheme } from "./components/hooks";
import { ExportJsonView } from "./views/ExportJsonView";

import "./App.css";

function App() {
  const [theme] = useFigmaPluginTheme();

  useEffect(() => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "ui-ready",
        } as PostToFigmaMessage,
      },
      "*"
    );
  }, []);

  return (
    <SaltProvider mode={theme} applyClassesTo="root">
      <div className="appRoot">
        <ExportJsonView />
        <CornerResizer />
      </div>
    </SaltProvider>
  );
}

export default App;
