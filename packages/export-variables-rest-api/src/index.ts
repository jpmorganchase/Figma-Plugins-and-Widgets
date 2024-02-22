import * as https from "node:https";
import {
  lstatSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  readFileSync,
} from "node:fs";
import { join, basename, extname } from "node:path";
import { ProxyAgent } from "proxy-agent";
import "dotenv/config";

import { updateApiResponse, toCamelCase } from "./modifyData.js";

import StyleDictionary from "style-dictionary-utils";
import { w3cTokenJsonParser } from "style-dictionary-utils/dist/parser/w3c-token-json-parser.js";
import {
  SALT_SPECIAL_PREFIX_MAP,
  ThemeRoot,
  generateCssFromJson,
} from "./tokenUtils.js";
import {
  Color,
  GetFileNodesResponse,
  GetPublishedStylesResponse,
  GetVariableResponse,
  RGBA,
  Variable,
} from "./types.js";
import { stringifyRGBA } from "./colorUtils.js";

// Make style dictionary aware of W3C file format, e.g. $value key
StyleDictionary.registerParser(w3cTokenJsonParser);

const figmaFileId = process.env.FIGMA_FILE_ID;
const figmaAccessToken = process.env.FIGMA_ACCESS_TOKEN;

const TOKEN_PREFIX = "salt";
const TOKEN_FOLDER = "./tokens";
const CODE_OUTPUT_FOLDER = "./build";
const CHARACTERISTICS_TOKEN_FILE = "CHARACTERISTICS_TOKEN.json";
const LOCAL_VARIABLE_EXAMPLE_FILE = "salt-example.json";
const LOCAL_STYLE_NODES_EXAMPLE_FILE = "salt-style-nodes-example.json";
// Leave blank if you don't want to save the response from REST API call. Give it a name so API response will be saved to be used in `loadLocalMockData`, e.g. LOCAL_EXAMPLE_FILE
const SAVE_VARIABLE_API_RESPONSE_PATH = LOCAL_VARIABLE_EXAMPLE_FILE;
const SAVE_STYLE_NODES_API_RESPONSE_PATH = LOCAL_STYLE_NODES_EXAMPLE_FILE;

const processData = processWithCustomCSSGeneration;

/** Either call API or use local mock data */
// callFigmaVariableAPI(processData);
loadLocalMockData(processData);

function loadLocalMockData(
  successCallback: (
    meta: GetVariableResponse["meta"],
    styleNodes: GetFileNodesResponse["nodes"]
  ) => void
) {
  const data = readFileSync(LOCAL_VARIABLE_EXAMPLE_FILE, { encoding: "utf8" });
  const parsedData = JSON.parse(data);
  const styleNodeData = readFileSync(LOCAL_STYLE_NODES_EXAMPLE_FILE, {
    encoding: "utf8",
  });
  const parsedStyleNodeData = JSON.parse(styleNodeData);
  successCallback(parsedData.meta, parsedStyleNodeData.nodes);
}

function callFigmaAPI(endpoint: string): Promise<string> {
  return new Promise(function (resolve, reject) {
    // The correct proxy `Agent` implementation to use will be determined
    // via the `http_proxy` / `https_proxy` / `no_proxy` / etc. env vars
    const agent = new ProxyAgent();

    // HTTP request will now go through proxy
    https.get(
      `https://api.figma.com${endpoint}`,
      {
        agent,
        headers: {
          "X-FIGMA-TOKEN": figmaAccessToken,
        },
      },
      (res) => {
        // console.log(res.statusCode, res.headers);
        // res.pipe(process.stdout);

        const { statusCode } = res;
        const contentType = res.headers["content-type"];

        let error;
        // Any 2xx status code signals a successful response but
        // here we're only checking for 200.
        if (statusCode !== 200) {
          error = new Error(
            "Request Failed to " +
              endpoint +
              ".\n" +
              `Status Code: ${statusCode}`
          );
        } else if (!contentType || !/^application\/json/.test(contentType)) {
          error = new Error(
            "Invalid content-type.\n" +
              `Expected application/json but received ${contentType}`
          );
        }
        if (error) {
          // Consume response data to free up memory
          res.resume();
          reject(error);
          return;
        }

        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          try {
            resolve(rawData);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
  });
}

async function callFigmaVariableAPI(
  successCallback: (
    meta: GetVariableResponse["meta"],
    styleNodes: GetFileNodesResponse["nodes"]
  ) => void
) {
  const rawData = await callFigmaAPI(
    `/v1/files/${figmaFileId}/variables/local`
  );

  if (SAVE_VARIABLE_API_RESPONSE_PATH) {
    writeFileSync(SAVE_VARIABLE_API_RESPONSE_PATH, rawData);
  }
  const { meta } = JSON.parse(rawData) as GetVariableResponse;

  const styles = await getColorStylesFromAPI();
  const styleNodes = await getNodeDetailFromAPI(styles.map((s) => s.node_id));

  successCallback(meta, styleNodes);
}

async function getColorStylesFromAPI() {
  const rawData = await callFigmaAPI(`/v1/files/${figmaFileId}/styles`);
  const parsedData = JSON.parse(rawData) as GetPublishedStylesResponse;
  return parsedData.meta.styles;
}

async function getNodeDetailFromAPI(nodeIds: string[]) {
  const rawData = await callFigmaAPI(
    `/v1/files/${figmaFileId}/nodes?ids=${nodeIds.join(",")}`
  );
  if (SAVE_STYLE_NODES_API_RESPONSE_PATH) {
    writeFileSync(SAVE_STYLE_NODES_API_RESPONSE_PATH, rawData);
  }
  const parsedData = JSON.parse(rawData) as GetFileNodesResponse;
  return parsedData.nodes;
}

function processWithCustomCSSGeneration(
  data: GetVariableResponse["meta"],
  styleNodes: GetFileNodesResponse["nodes"]
) {
  console.debug("processWithCustomCSSGeneration", { data, styleNodes });

  // No need to add default to grouping using custom implementation
  const newData = updateApiResponse(data, {
    addDefault: false,
  });

  const charTokens = extractTokenFromStyles(newData, styleNodes);

  const tokens = extractTokenFromVariables(newData.variables);
  // TODO: where to insert `palette` prefix? some name conflict e.g. accent
  // console.debug("extracted full tokens:", tokens);

  writeTokensToFile(newData, tokens, charTokens);

  generateCustomCSS();
}

function processWithStyleDictionary(
  data: GetVariableResponse["meta"],
  styleNodes: GetFileNodesResponse["nodes"]
) {
  console.log("processWithStyleDictionary", data);

  const newData = updateApiResponse(data, { addDefault: true });
  console.log("data with default name suffix", newData);
  const charTokens = extractTokenFromStyles(newData, styleNodes);

  const tokens = extractTokenFromVariables(newData.variables);
  console.log("extracted full tokens:", tokens);

  writeTokensToFile(newData, tokens, charTokens);

  buildUsingStyleDictionary();
}

function writeTokensToFile(
  data: GetVariableResponse["meta"],
  tokens: Record<string, Record<string, ThemeRoot>>,
  charTokens: ThemeRoot
) {
  const allCollections = data.variableCollections;

  for (const [collectionId, collectionTokens] of Object.entries(tokens)) {
    // skip remote collections
    if (allCollections[collectionId].remote) {
      continue;
    }

    const collectionName = allCollections[collectionId].name;
    const dirPath = join(TOKEN_FOLDER, collectionName);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
    for (const [modeId, modeTokens] of Object.entries(collectionTokens)) {
      const modeName = allCollections[collectionId].modes.find(
        (m) => m.modeId === modeId
      )?.name;
      const tokenFilePath = join(dirPath, modeName + ".json");

      // const defaultTransformed = addDefaultToNestedTokens(tokens);
      // TODO: we can add default to tokens, what about reference names?

      writeFileSync(tokenFilePath, JSON.stringify(modeTokens, null, 2));
      console.log("Written token to", tokenFilePath);
    }
  }

  const charTokenFilePath = join(TOKEN_FOLDER, CHARACTERISTICS_TOKEN_FILE);
  writeFileSync(charTokenFilePath, JSON.stringify(charTokens, null, 2));

  console.log("Written characteristics token to", charTokenFilePath);
}

function extractTokenFromStyles(
  newData: GetVariableResponse["meta"],
  styleNodes: GetFileNodesResponse["nodes"]
) {
  const fullTokens: ThemeRoot = {};

  Object.values(styleNodes).forEach((node) => {
    const filesBoundVars = node.document.boundVariables["fills"];
    if (filesBoundVars && Array.isArray(filesBoundVars)) {
      const boundVariable = newData.variables[filesBoundVars[0].id];
      const tokenName = node.document.name;

      let obj: any = fullTokens;

      tokenName.split("/").forEach((groupName) => {
        const camelGroupName = toCamelCase(groupName);
        obj[camelGroupName] = obj[camelGroupName] || {};
        obj = obj[camelGroupName] as any;
      });

      // TODO: resolvedType: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR"
      obj.$type = boundVariable.resolvedType === "COLOR" ? "color" : "number";
      obj.$value = `{${boundVariable.name
        .split("/")
        .map(toCamelCase)
        .join(".")}}`;
    } else {
      // No fills found?
      throw new Error(
        "No fills boundVariable found for node," + node.document.name
      );
    }
  });
  return fullTokens;
}

function extractTokenFromVariables(
  allVariablesObj: Record<string, Variable>
): Record<string, Record<string, ThemeRoot>> {
  // Full token should have nesting of { collectionId: { modeId: TOKENS} }
  const fullTokens: Record<string, Record<string, ThemeRoot>> = {};

  for (const variable of Object.values(allVariablesObj)) {
    const { name, resolvedType, valuesByMode, variableCollectionId } = variable;

    for (const [modeId, value] of Object.entries(valuesByMode)) {
      // const value = modeValue

      // Only export color or number variables
      if (value !== undefined && ["COLOR", "FLOAT"].includes(resolvedType)) {
        let obj: any = createMissingNesting(
          fullTokens,
          variableCollectionId,
          modeId
        );
        name.split("/").forEach((groupName) => {
          const camelGroupName = toCamelCase(groupName);
          obj[camelGroupName] = obj[camelGroupName] || {};
          obj = obj[camelGroupName] as any;
        });
        // TODO: resolvedType: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR"
        obj.$type = resolvedType === "COLOR" ? "color" : "number";
        if (
          typeof value === "object" &&
          "type" in value &&
          value.type === "VARIABLE_ALIAS"
        ) {
          obj.$value = `{${allVariablesObj[value.id].name
            .split("/")
            .map(toCamelCase)
            .join(".")}}`;
        } else {
          obj.$value =
            resolvedType === "COLOR" ? stringifyRGBA(value as Color) : value;
        }
      }
    }
  }
  return fullTokens;
}

function createMissingNesting(
  fullTokens: Record<string, Record<string, ThemeRoot>>,
  collectionId: string,
  modeId: string
) {
  if (fullTokens[collectionId]) {
    if (fullTokens[collectionId][modeId]) {
      // existed, do nothing
    } else {
      fullTokens[collectionId][modeId] = {};
    }
  } else {
    fullTokens[collectionId] = { [modeId]: {} };
  }
  return fullTokens[collectionId][modeId];
}

function generateCustomCSS() {
  /**
   * Map each individual JSON file to CSS, keeping their folder structure.
   * This enables potential offering of isolated Salt stylesheets (e.g. per mode, per density).
   **/

  /**
   * Each file will contain specific class name according to their file name:
   * - If matching options from Salt Provider/theme, e.g. density, mode, then add code like `.salt-theme[data-mode='light']`
   * - Otherwise add `.salt-theme`
   **/

  for (const dirContent of readdirSync(TOKEN_FOLDER, { withFileTypes: true })) {
    if (dirContent.isDirectory()) {
      const outputFolder = join(CODE_OUTPUT_FOLDER, dirContent.name);
      if (!existsSync(outputFolder)) {
        mkdirSync(outputFolder, { recursive: true });
      }
      const tokenFolder = join(TOKEN_FOLDER, dirContent.name);
      for (const tokenFileName of readdirSync(tokenFolder)) {
        // console.debug({ tokenFileName });
        const tokenInput = readFileSync(join(tokenFolder, tokenFileName), {
          encoding: "utf-8",
        });
        const outputCss = generateCssFromJson(tokenInput, {
          prefix: "salt",
          rgbaFormat: true,
          specialPrefixMap: SALT_SPECIAL_PREFIX_MAP,
          removeSuffixDefault: true,
          kebabCase: true,
        });
        // console.debug({ outputCss });
        const outputFilePath = join(
          outputFolder,
          basename(tokenFileName, extname(tokenFileName)) + ".css"
        );
        // TODO: prettier
        writeFileSync(outputFilePath, ":root {\n" + outputCss + "\n}\n", {
          encoding: "utf8",
        });
        console.log("CSS output written to", outputFilePath);
      }
    } else if (
      dirContent.isFile() &&
      dirContent.name === CHARACTERISTICS_TOKEN_FILE
    ) {
      const tokenInput = readFileSync(join(TOKEN_FOLDER, dirContent.name), {
        encoding: "utf-8",
      });

      const outputCss = generateCssFromJson(tokenInput, {
        prefix: "salt",
        rgbaFormat: true,
        specialPrefixMap: SALT_SPECIAL_PREFIX_MAP,
        removeSuffixDefault: true,
        kebabCase: true,
        ignoreNameSpecialPrefix: true,
      });

      const transformedOutputCss = outputCss.replace(
        /-border-/g,
        "-borderColor-"
      );

      const outputFilePath = join(
        CODE_OUTPUT_FOLDER,
        basename(dirContent.name, extname(dirContent.name)) + ".css"
      );
      // TODO: prettier
      writeFileSync(
        outputFilePath,
        ":root {\n" + transformedOutputCss + "\n}\n",
        {
          encoding: "utf8",
        }
      );
      console.log("CSS output written to", outputFilePath);
    }
  }
}

function buildUsingStyleDictionary() {
  // Example: https://dbanks.design/blog/dark-mode-with-style-dictionary/#Token-structure
  // https://github.com/lukasoppermann/style-dictionary-utils?tab=readme-ov-file#-parsers

  const getModePlatform = (mode: string) => ({
    web_mode: {
      transformGroup: "web",
      buildPath: `${CODE_OUTPUT_FOLDER}/web/${mode}/`,
      prefix: TOKEN_PREFIX,
      files: [
        {
          destination: `${mode}.css`,
          format: "css/variables",
          options: {
            outputReferences: true,
          },
        },
      ],
    },
    ios_mode: {
      transformGroup: "ios",
      buildPath: `${CODE_OUTPUT_FOLDER}/ios/${mode}/`,
      prefix: TOKEN_PREFIX,
      files: [
        {
          destination: `${mode}.swift`,
          format: "ios-swift/enum.swift",
          options: {
            outputReferences: true,
          },
        },
      ],
    },
  });
  const getDensityPlatform = (
    density: string,
    subfolder: string,
    cornerRadiusMode: string
  ) => ({
    web_density: {
      // WARNING: `web` includes 'size/px' transform, but it only matches when: token.attributes.category === 'size'
      // TODO: find out why size tokens, e.g. `--size-unit` is not getting `px`
      transformGroup: "web",
      buildPath: `${CODE_OUTPUT_FOLDER}/web/${density}/${subfolder}/`,
      prefix: TOKEN_PREFIX,
      files: [
        {
          destination: `${cornerRadiusMode}.css`,
          format: "css/variables",
          options: {
            outputReferences: true,
          },
        },
      ],
    },
    ios_density: {
      transformGroup: "ios",
      buildPath: `${CODE_OUTPUT_FOLDER}/ios/${density}/${subfolder}/`,
      prefix: TOKEN_PREFIX,
      files: [
        {
          destination: `${cornerRadiusMode}.swift`,
          format: "ios-swift/enum.swift",
          options: {
            outputReferences: true,
          },
        },
      ],
    },
  });
  console.log(
    "Build using StyleDictionary into directory:",
    CODE_OUTPUT_FOLDER
  );

  // Build both light and dark modes
  ["Light", "Dark"].forEach((mode) => {
    StyleDictionary.extend({
      source: [
        `${TOKEN_FOLDER}/Mode/${mode}.json`,
        // `${OUTPUT_FOLDER}/Raw/*.json`,
        `${TOKEN_FOLDER}/Foundation/*.json`,
      ],
      platforms: getModePlatform(mode),
    }).buildAllPlatforms();
  });
  const subfolder = "Corner Radius";
  const subfolderModes = readdirSync(`${TOKEN_FOLDER}/${subfolder}/`).map((f) =>
    basename(f, extname(f))
  );
  ["HD", "MD", "LD", "TD"].forEach((density) => {
    subfolderModes.forEach((sfMode) => {
      StyleDictionary.extend({
        source: [
          `${TOKEN_FOLDER}/Density/${density}.json`,
          `${TOKEN_FOLDER}/${subfolder}/${sfMode}.json`,
        ],
        platforms: getDensityPlatform(density, subfolder, sfMode),
      }).buildAllPlatforms();
    });
  });
  console.log("StyleDictionary build done");
}
