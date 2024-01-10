import * as https from "node:https";
import { readFile, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ProxyAgent } from "proxy-agent";
import "dotenv/config";

import StyleDictionary from "style-dictionary-utils";
import { w3cTokenJsonParser } from "style-dictionary-utils/dist/parser/w3c-token-json-parser.js";

// Make style dictionary aware of W3C file format, e.g. $value key
StyleDictionary.registerParser(w3cTokenJsonParser);

const figmaFileId = process.env.FIGMA_FILE_ID;
const figmaAccessToken = process.env.FIGMA_ACCESS_TOKEN;

const OUTPUT_FOLDER = "./tokens";
const SD_BUILD_DIR = "build";
const LOCAL_EXAMPLE_FILE = "salt-example.json";
// Leave blank if you don't want to save the response from REST API call. Give it a name so API response will be saved to be used in `loadLocalMockData`, e.g. LOCAL_EXAMPLE_FILE
const SAVE_API_RESPONSE_PATH = LOCAL_EXAMPLE_FILE;

/** Either call API or use local mock data */
// callFigmaAPI(processData);
loadLocalMockData(processData);

function loadLocalMockData(successCallback) {
  readFile(LOCAL_EXAMPLE_FILE, { encoding: "utf8" }, (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    const parsedData = JSON.parse(data);
    successCallback(parsedData.meta);
  });
}

function callFigmaAPI(successCallback) {
  // The correct proxy `Agent` implementation to use will be determined
  // via the `http_proxy` / `https_proxy` / `no_proxy` / etc. env vars
  const agent = new ProxyAgent();

  // HTTP request will now go through proxy
  https.get(
    `https://api.figma.com/v1/files/${figmaFileId}/variables/local`,
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
        error = new Error("Request Failed.\n" + `Status Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error(
          "Invalid content-type.\n" +
            `Expected application/json but received ${contentType}`
        );
      }
      if (error) {
        console.error(error.message);
        // Consume response data to free up memory
        res.resume();
        return;
      }

      res.setEncoding("utf8");
      let rawData = "";
      res.on("data", (chunk) => {
        rawData += chunk;
      });
      res.on("end", () => {
        try {
          if (SAVE_API_RESPONSE_PATH) {
            writeFileSync(SAVE_API_RESPONSE_PATH, rawData);
          }
          const parsedData = JSON.parse(rawData);
          successCallback(parsedData.meta);
        } catch (e) {
          console.error(e.message);
        }
      });
    }
  );
}

function processData(data) {
  console.log("processData", data);
  const tokens = extractTokenFromVariables(data.variables);
  console.log("extracted full tokens:", tokens);
  // const defaultTransformed = addDefaultToNestedTokens(tokens);
  // TODO: we can add default to tokens, what about references?
  writeTokensToFile(data, tokens);

  buildUsingStyleDictionary();
}

/**
 * StyleDictionary doesn't support tokens nested within another which has value ($value in our case),
 * e.g.
 * ```
 *   color: {
 *     white: {
 *       $value: '#fff',
 *       alpha: {
 *         $value: 'rgba(1,1,1,0.8)',
 *       },
 *     },
 *   }
 * ```
 * So we will add `default` to the token structure
 * ```
 *   color: {
 *     white: {
 *       default: {
 *         $value: "#fff",
 *       },
 *       alpha: {
 *         $value: 'rgba(1,1,1,0.8)',
 *       },
 *     },
 *   }
 * ```
 * See more at https://github.com/amzn/style-dictionary/issues/643#issuecomment-857105609
 */
function addDefaultToNestedTokens(tokens) {
  const newTokens = {};

  const allKeys = Object.keys(tokens);
  const nonDollarKeys = allKeys.filter((k) => !k.startsWith("$"));
  if (tokens.$value !== undefined) {
    // Any property with $value and other nested names, create a default object hosting all keys with $ prefix
    if (nonDollarKeys.length > 0) {
      const defaultToken = {};
      for (const key of allKeys.filter((k) => k.startsWith("$"))) {
        defaultToken[key] = tokens[key];
      }
      newTokens.default = defaultToken;
    } else {
      for (const key of allKeys.filter((k) => k.startsWith("$"))) {
        newTokens[key] = tokens[key];
      }
    }
  }

  // copy over all nested tokens (i.e. not $)
  for (const key of nonDollarKeys) {
    const value = tokens[key];
    newTokens[key] =
      typeof value === "object" ? addDefaultToNestedTokens(value) : value;
  }

  return newTokens;
}

function writeTokensToFile(data, tokens) {
  const allCollections = data.variableCollections;

  for (const [collectionId, collectionTokens] of Object.entries(tokens)) {
    // skip remote collections
    if (allCollections[collectionId].remote) {
      continue;
    }

    const collectionName = allCollections[collectionId].name;
    const dirPath = join(OUTPUT_FOLDER, collectionName);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
    for (const [modeId, modeTokens] of Object.entries(collectionTokens)) {
      const modeName = allCollections[collectionId].modes.find(
        (m) => m.modeId === modeId
      ).name;
      const tokenFilePath = join(dirPath, modeName + ".json");
      writeFileSync(tokenFilePath, JSON.stringify(modeTokens));
      console.log("Written token to", tokenFilePath);
    }
  }
}

function extractTokenFromVariables(allVariablesObj) {
  // Full token should have nesting of { collectionId: {modeId: TOKENS} }
  const fullTokens = {};

  for (const variable of Object.values(allVariablesObj)) {
    const { name, resolvedType, valuesByMode, variableCollectionId } = variable;

    for (const [modeId, value] of Object.entries(valuesByMode)) {
      // const value = modeValue

      // Only export color or number variables
      if (value !== undefined && ["COLOR", "FLOAT"].includes(resolvedType)) {
        let obj = createMissingNesting(
          fullTokens,
          variableCollectionId,
          modeId
        );
        name.split("/").forEach((groupName) => {
          obj[groupName] = obj[groupName] || {};
          obj = obj[groupName];
        });
        obj.$type = resolvedType === "COLOR" ? "color" : "number";
        if (
          typeof value === "object" &&
          "type" in value &&
          value.type === "VARIABLE_ALIAS"
        ) {
          obj.$value = `{${allVariablesObj[value.id].name.replace(
            /\//g,
            "."
          )}}`;
        } else {
          obj.$value = resolvedType === "COLOR" ? rgbToHex(value) : value;
        }
      }
    }
  }
  return fullTokens;
}

function createMissingNesting(fullTokens, collectionId, modeId) {
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

function buildUsingStyleDictionary() {
  // Example: https://dbanks.design/blog/dark-mode-with-style-dictionary/#Token-structure
  // https://github.com/lukasoppermann/style-dictionary-utils?tab=readme-ov-file#-parsers

  const commonSource = [
    `${OUTPUT_FOLDER}/Raw/*.json`,
    `${OUTPUT_FOLDER}/Foundations/*.json`,
  ];

  const getPlatform = (mode) => ({
    web: {
      transformGroup: "web",
      buildPath: `${SD_BUILD_DIR}/web/${mode}/`,
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
    ios: {
      transformGroup: "ios",
      buildPath: `${SD_BUILD_DIR}/ios/${mode}/`,
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
  console.log("Build using StyleDictionary into directory:", SD_BUILD_DIR);

  // Build both light and dark modes
  ["Light", "Dark"].forEach((mode) => {
    StyleDictionary.extend({
      source: [`${OUTPUT_FOLDER}/Mode/${mode}.json`, ...commonSource],
      platforms: getPlatform(mode),
    }).buildAllPlatforms();
  });
  console.log("StyleDictionary build done");
}

function rgbToHex({ r, g, b, a }) {
  if (a !== 1) {
    return `rgba(${[r, g, b]
      .map((n) => Math.round(n * 255))
      .join(", ")}, ${a.toFixed(4)})`;
  }
  const toHex = (value) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const hex = [toHex(r), toHex(g), toHex(b)].join("");
  return `#${hex}`;
}
