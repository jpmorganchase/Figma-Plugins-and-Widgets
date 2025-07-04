import { ParseResult } from "papaparse";
import {
  CSV_HEADER_FIELDS,
  CsvNodeInfo,
  CsvNodeInfoWithLang,
  DEFAULT_LANG,
  PostToFigmaMessage,
  PostToUIMessage,
} from "../shared-src/messages";
import {
  persistInFigma,
  readPersistedData,
  updateNodeKey,
  updateNodeSelected,
} from "./pluginDataUtils";
import {
  csvNodeProcessor,
  csvNodeUpdater,
  csvResultTransformer,
  getNodeInfoMap,
  parseCsvString,
} from "./processors/csvProcessor";
import { scanTextNodesInfo } from "./processors/textNodeInfoProcessor";
import {
  DEFAULT_HEADING_SETTINGS,
  focusNode,
  sendTextNodesInfoToUI,
  setRelaunchButton,
  sortNodeByPosition,
} from "./utils";

// let parsedCsv: ParseResult<CsvNodeInfoWithLang> | null = null;

const MIN_WIDTH = 340;
const MIN_HEIGHT = 350;

figma.showUI(
  `${__html__}<script>const __FIGMA_COMMAND__='${
    // This is used by the UI to toggle default view on load
    typeof figma.command === "undefined" ? "" : figma.command
  }';</script>`,
  {
    themeColors: true,
    width: MIN_WIDTH,
    height: MIN_HEIGHT,
  }
);

figma.ui.onmessage = async (msg: PostToFigmaMessage) => {
  if (msg.type === "read-persisted-data") {
    detectPersistedData();
  } else if (msg.type === "export-csv-file") {
    await exportCsvFile();
  } else if (msg.type === "resize-window") {
    const { width, height } = msg;
    figma.ui.resize(Math.max(width, MIN_WIDTH), Math.max(height, MIN_HEIGHT));
  } else if (msg.type === "detect-available-lang-from-csv") {
    await parseCsvAndDetectRevision(msg.csvString, msg.persistInFigma);
  } else if (msg.type === "update-content-with-lang") {
    await updateWithLang(msg.lang);
  } else if (msg.type === "focus-node") {
    void focusNode(msg.id);
  } else if (msg.type === "scan-text-node-info") {
    const nodesInfo = await scanTextNodesInfo(msg.autoTrigger);
    sendTextNodesInfoToUI(nodesInfo);
  } else if (msg.type === "update-node-key") {
    await updateNodeKey(msg.nodeId, msg.key);
    figma.ui.postMessage({
      type: "partial-update-text-node-info-result",
      partialTextNodesInfo: [{ id: msg.nodeId, key: msg.key }],
    } satisfies PostToUIMessage);
  } else if (msg.type === "update-node-selected") {
    await updateNodeSelected(msg.nodeId, msg.checked);
    figma.ui.postMessage({
      type: "partial-update-text-node-info-result",
      partialTextNodesInfo: [{ id: msg.nodeId, checked: msg.checked }],
    } satisfies PostToUIMessage);
  } else if (msg.type === "clear-persisted-data") {
    clearPersistedData();
  }
};

function detectPersistedData() {
  const persistedData = readPersistedData();
  if (persistedData) {
    sendAvailableRevisionToUI(persistedData);
  }
}

function persistDataInFigma(
  parsedCsv: ParseResult<CsvNodeInfoWithLang> | null
) {
  if (parsedCsv !== null) {
    persistInFigma(JSON.stringify(parsedCsv));
    for (const selectedNode of figma.currentPage.selection) {
      setRelaunchButton(selectedNode);
    }
  }
}

function clearPersistedData() {
  persistInFigma("");
}

function sendAvailableRevisionToUI(
  parsedCsv: ParseResult<CsvNodeInfoWithLang> | null
) {
  console.log("sendAvailableRevisionToUI", parsedCsv);

  if (parsedCsv === null) {
    console.error("sendUIAvailableRevision parsedCsv is null");
    return;
  }
  const allFields = parsedCsv.meta.fields || [];

  const additionalLangs = allFields.filter(
    (x) => !CSV_HEADER_FIELDS.includes(x)
  );
  console.log({ allFields, additionalLangs });

  figma.ui.postMessage({
    type: "available-lang-from-csv",
    langs: [DEFAULT_LANG, ...additionalLangs],
  } satisfies PostToUIMessage);
}

async function updateWithLang(lang: string) {
  if (figma.currentPage.selection.length === 0) {
    figma.notify("Please select something to update 😅");
    return;
  }

  const persistedData = readPersistedData();
  if (persistedData === null) {
    figma.notify("Parsed CSV cannot be found, please report a bug", {
      error: true,
    });
    return;
  }

  const topLvlNodes = figma.currentPage.selection
    .slice()
    .sort(sortNodeByPosition);

  const totalTopLvlNodes = topLvlNodes.length;

  const { data } = persistedData;

  let notificationHandle: NotificationHandler = figma.notify("Update start...");

  const infoMap = getNodeInfoMap(data);

  let updatedLayersCount = 0;

  // We want to send figma.notify message between frame processing, thus using Timeout between processing nodes
  async function processFirstNode(nodes: SceneNode[]) {
    const firstNode = nodes[0];

    const notifyMessage = `Updating frame: ${firstNode.name} (${
      totalTopLvlNodes - nodes.length + 1
    }/${totalTopLvlNodes})`;
    notificationHandle?.cancel();
    notificationHandle = figma.notify(notifyMessage);
    console.log(notifyMessage);

    updatedLayersCount +=
      (await csvNodeUpdater(firstNode, infoMap, {
        ...DEFAULT_HEADING_SETTINGS,
        selectedLang: lang,
      })) || 0;

    if (nodes.length > 1) {
      setTimeout(() => {
        void processFirstNode(nodes.slice(1));
      }, 20);
    } else {
      notificationHandle?.cancel();
      if (updatedLayersCount) {
        notificationHandle = figma.notify(
          `Updated ${updatedLayersCount} layer` +
            (updatedLayersCount > 1 ? "s" : "" + " 🌟")
        );

        figma.ui.postMessage({
          type: "update-finished",
        } satisfies PostToUIMessage);
      } else {
        notificationHandle = figma.notify("Nothing updated");
      }
    }
  }

  void processFirstNode(topLvlNodes);
}

async function parseCsvAndDetectRevision(
  csvString: string,
  persistInFigma: boolean
) {
  const parsed = parseCsvString<CsvNodeInfoWithLang>(csvString);
  if (parsed === null) {
    figma.notify("Can not parse CSV, check your file and try again?", {
      error: true,
    });
    return;
  }

  const allFields = parsed.meta.fields;

  if (allFields === undefined) {
    figma.notify("Can not parse CSV available fields, check your file", {
      error: true,
    });
    return;
  }

  if (persistInFigma) {
    persistDataInFigma(parsed);
  }

  sendAvailableRevisionToUI(parsed);
}

async function exportCsvFile() {
  if (figma.currentPage.selection.length === 0) {
    figma.notify("Please select something to export 😅");
    return;
  }

  const topLvlNodes = figma.currentPage.selection
    .slice()
    .sort(sortNodeByPosition);

  const totalTopLvlNodes = topLvlNodes.length;

  let notificationHandle: NotificationHandler = figma.notify("Export start...");

  const processedInfo: {
    results: CsvNodeInfo[];
    topLvlNode: SceneNode;
  }[] = [];

  // We want to send figma.notify message between frame processing, thus using Timeout between processing nodes
  async function processFirstNode(nodes: SceneNode[]) {
    const firstNode = nodes[0];

    const notifyMessage = `Processing frame: ${firstNode.name} (${
      totalTopLvlNodes - nodes.length + 1
    }/${totalTopLvlNodes})`;
    notificationHandle?.cancel();
    notificationHandle = figma.notify(notifyMessage);
    console.log(notifyMessage);

    const processResult = {
      results: await csvNodeProcessor(firstNode, {
        ...DEFAULT_HEADING_SETTINGS,
        topLvlNodeName: firstNode.name,
      }),
      topLvlNode: firstNode,
    };
    processedInfo.push(processResult);

    if (nodes.length > 1) {
      setTimeout(() => {
        void processFirstNode(nodes.slice(1));
      }, 20);
    } else {
      notificationHandle?.cancel();
      notificationHandle = figma.notify(
        "Generating final document to download"
      );

      setTimeout(async () => {
        const dataReturn = await csvResultTransformer(processedInfo);

        figma.ui.postMessage({
          type: "file-generated",
          data: dataReturn,
          defaultFileName: figma.root.name + ".csv",
        } satisfies PostToUIMessage);

        notificationHandle?.cancel();
        notificationHandle = figma.notify("Done", { timeout: 1000 });
      }, 20);
    }
  }
  void processFirstNode(topLvlNodes);
}
