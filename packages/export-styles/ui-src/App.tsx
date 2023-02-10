import { SaltProvider } from "@salt-ds/core";
import React, { useEffect, useState } from "react";
import { PluginCommandType, PostToFigmaMessage } from "../shared-src";
import { CornerResizer } from "./components/CornerResizer";
import { useFigmaPluginTheme } from "./components/hooks";
import { FigmaToUIMessageEvent } from "./types";
import { ExportCssView } from "./views/ExportCssView";
import { ExportJsonView } from "./views/ExportJsonView";

import "./App.css";

function App() {
  const [theme] = useFigmaPluginTheme();
  const [launchCommand, setLaunchCommand] =
    useState<PluginCommandType>("export-css-var");

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

  const handleMessage = (event: FigmaToUIMessageEvent) => {
    const msg = event.data.pluginMessage;
    switch (msg.type) {
      case "launch-view":
        setLaunchCommand(msg.command);
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
    <SaltProvider mode={theme} applyClassesTo="child">
      <div className="appRoot">
        {launchCommand === "export-css-var" && <ExportCssView />}
        {launchCommand === "export-json" && <ExportJsonView />}
        <CornerResizer />
      </div>
    </SaltProvider>
  );
}

export default App;
