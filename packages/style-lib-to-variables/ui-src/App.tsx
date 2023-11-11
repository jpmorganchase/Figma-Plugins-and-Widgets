import { SaltProvider } from "@salt-ds/core";
import React, { useEffect } from "react";
import { PostToFigmaMessage } from "../shared-src";
import { CornerResizer } from "./components/CornerResizer";
import { useFigmaPluginTheme } from "./components/hooks";
import { MainView } from "./views/MainView";

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
        <MainView />
        <CornerResizer />
      </div>
    </SaltProvider>
  );
}

export default App;
