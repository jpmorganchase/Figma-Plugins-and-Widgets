import React from "react";
import { createRoot } from "react-dom/client";
import "@salt-ds/theme/css/global.css";
import "@salt-ds/theme/css/theme.css";

import App from "./App";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);
