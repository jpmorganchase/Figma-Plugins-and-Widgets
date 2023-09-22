type StoredColorStyleInfo = {
  name: string;
  color: { r: number; g: number; b: number };
  opacity: number;
};
export const storeLibraryStyles = async () => {
  const styles = figma.getLocalPaintStyles();
  const styleNameToDataMap = styles.reduce((into, current) => {
    const paints = current.paints.filter(({ visible }) => visible);
    if (paints.length !== 1) {
      // TODO: warn user
    } else {
      const paint0 = paints[0];
      if (paint0.type !== "SOLID") {
        // TODO: warn user
      } else {
        const {
          blendMode,
          color: { r, g, b },
          opacity,
          type,
        } = paint0;
        // const hex = rgbToHex({ r, g, b });
        if (type === "SOLID" && blendMode === "NORMAL") {
          // const uniqueId = [hex, opacity].join("-");
          into[current.name] = {
            name: current.name,
            color: { r, g, b },
            // hex,
            opacity: opacity === undefined ? 1 : opacity,
            // tokens: [],
          };
          // into[uniqueId].tokens.push(current.name);
        } else {
          // do something different i guess
        }
      }
    }
    return into;
  }, {} as { [name: string]: StoredColorStyleInfo });
  const styleData = Object.values(styleNameToDataMap);

  // Using name for now, if we want rename, then some other key is needed
  await figma.clientStorage.setAsync(figma.root.name, styleData);
};

export const deleteSelectedLibrary = async (libName: string) => {
  await figma.clientStorage.deleteAsync(libName);
};

export const restoreSelectedLibrary = async (
  libName: string,
  collectionName: string,
  modeName: string
) => {
  const storedInfo = (await figma.clientStorage.getAsync(
    libName
  )) as StoredColorStyleInfo[];

  console.log({ storedInfo });

  const collection = figma.variables
    .getLocalVariableCollections()
    .find((x) => x.name === collectionName);

  if (collection === undefined) {
    throw new Error("Collection doesn't exist - " + collectionName);
  }

  const modeId = collection.modes.find((m) => m.name === modeName)?.modeId;

  if (modeId === undefined) {
    throw new Error(
      "Mode doesn't exist in Collection - " + collectionName + " / " + modeName
    );
  }

  // hashed value by `rgbToKey`
  const existingVariables: { [hashedValueKey: string]: Variable } = {};

  // Roundabout way to get variables via name in a collection
  {
    const collectionVariables = figma.variables
      .getLocalVariables()
      .filter((v) => v.variableCollectionId === collection!.id);
    for (const variable of collectionVariables) {
      const value = variable.valuesByMode[modeId];
      if (typeof value === "object") {
        if ("type" in value && value.type === "VARIABLE_ALIAS") {
          const resolvedVar = figma.variables.getVariableById(value.id);
          if (resolvedVar) {
            // TODO: Assume this is foundation color
            const resolvedValue = Object.values(resolvedVar.valuesByMode)[0];
            // console.log("resolved alias value", resolvedValue, "from", value);
            const key = rgbToKey(resolvedValue as any);
            existingVariables[key] = variable;
          } else {
            throw new Error(
              "Cannot resolve variable by id aliased - " + value.id
            );
          }
        } else {
          // TODO: Assume this is color for now
          const key = rgbToKey(value as any);
          existingVariables[key] = variable;
        }
      } else {
        console.warn(
          "Skip var value not object",
          value,
          "in variable",
          variable
        );
      }
    }
  }

  console.log({ existingVariables });

  for (const storedStyle of storedInfo) {
    // opacity is always there, taken care during store time
    const hashValue = rgbToKey({
      ...storedStyle.color,
      a: storedStyle.opacity,
    });
    if (existingVariables[hashValue]) {
      const style = figma.createPaintStyle();
      style.name = storedStyle.name;
      style.paints = [
        figma.variables.setBoundVariableForPaint(
          {
            type: "SOLID",
            opacity: storedStyle.opacity,
            color: storedStyle.color,
          },
          "color",
          existingVariables[hashValue]
        ),
      ];
    } else {
      console.warn("Couldn't variable stored with same value", storedStyle);

      const style = figma.createPaintStyle();
      style.name = storedStyle.name;
      style.paints = [
        {
          type: "SOLID",
          opacity: storedStyle.opacity,
          color: storedStyle.color,
        },
      ];
    }
  }
};

export const getAvailableLibraries = async (): Promise<string[]> => {
  const allKeysStored = await figma.clientStorage.keysAsync();
  return allKeysStored;
};

function rgbToKey({
  r,
  g,
  b,
  a,
}: {
  r: number;
  g: number;
  b: number;
  a: number;
}) {
  const toHex = (value: number) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const hex = [toHex(r), toHex(g), toHex(b), toHex(a)].join("");
  return hex;
  return `#${hex}`;
}

export const createVariablesFromLibrary = async (
  libraryName: string,
  collectionName: string,
  modeName: string,
  useAlias: boolean,
  aliasCollectionName?: string,
  aliasModeName?: string
) => {
  const allKeysStored = await figma.clientStorage.keysAsync();
  if (!allKeysStored.includes(libraryName)) {
    throw new Error("Library couldn't be found");
  }
  const storedInfo = (await figma.clientStorage.getAsync(
    libraryName
  )) as StoredColorStyleInfo[];

  console.log({ storedInfo });

  createTokens(
    storedInfo,
    collectionName,
    modeName,
    useAlias,
    aliasCollectionName,
    aliasModeName
  );
};

function createTokens(
  styleData: StoredColorStyleInfo[],
  collectionName: string,
  modeName: string,
  useAlias: boolean,
  aliasCollectionName?: string,
  aliasModeName?: string
) {
  if (styleData.length <= 0) {
    throw new Error("No convertible styles found. :(");
  }
  console.log({ tokenData: styleData, collectionName, modeName });

  const existingCollections = figma.variables.getLocalVariableCollections();
  const existingCollection = existingCollections.find(
    (x) => x.name === collectionName
  );
  const collection =
    existingCollection ||
    figma.variables.createVariableCollection(collectionName);
  const modeId = existingCollection
    ? collection.modes.find((m) => m.name === modeName)?.modeId ||
      collection.addMode(modeName)
    : collection.modes[0].modeId;
  if (!existingCollection) {
    collection.renameMode(modeId, modeName);
  }
  let aliasCollection: VariableCollection | undefined;

  /**
   * Key is `rgbToKey(rgbaValue)`, value is token id
   * */
  const aliasData: { [key: string]: string } = {};

  if (useAlias && aliasCollectionName && aliasModeName) {
    aliasCollection = existingCollections.find(
      (x) => x.name === aliasCollectionName
    );
    if (!aliasCollection) {
      throw new Error(
        "Cannot find alias collection named: " + aliasCollectionName
      );
    }
    const aliasMode = aliasCollection.modes.find(
      (m) => m.name === aliasModeName
    );
    if (!aliasMode) {
      throw new Error("Cannot find alias mode named: " + aliasModeName);
    }

    const aliasVariables = figma.variables
      .getLocalVariables()
      .filter((v) => v.variableCollectionId === aliasCollection!.id);

    console.log("aliasVariables", aliasVariables);
    console.log("aliasCollection", aliasCollection);

    // TODO: there's no way to get variable from collection / mode ?

    for (const variable of aliasVariables) {
      const value = variable.valuesByMode[aliasMode.modeId];
      if (typeof value === "object") {
        // TODO: Assume this is color for now
        const key = rgbToKey(value as any);
        aliasData[key] = variable.id;
      } else {
        console.warn(
          "Skip var value not object",
          value,
          "in variable",
          variable
        );
      }
    }
  }

  console.log("aliasData", aliasData);

  const existingVariables: { [name: string]: Variable } = {};

  // Roundabout way to get variables via name in a collection
  {
    const collectionVariables = figma.variables
      .getLocalVariables()
      .filter((v) => v.variableCollectionId === collection!.id);
    for (const variable of collectionVariables) {
      existingVariables[variable.name] = variable;
    }
  }

  styleData.forEach(({ name: originalName, color, opacity }) => {
    const name = originalName.replaceAll(".", "-"); // `createVariable` will fail when name contains "."
    // Alias path
    if (useAlias && aliasCollectionName && aliasModeName) {
      // Dirty way to check whether the token existed
      const key = rgbToKey({ ...color, a: opacity });

      const aliasVariableId = aliasData[key];

      if (aliasVariableId) {
        // there is a match, create a reference
        const token =
          existingVariables[name] ||
          figma.variables.createVariable(name, collection.id, "COLOR");
        token.setValueForMode(modeId, {
          type: "VARIABLE_ALIAS",
          id: aliasVariableId,
        });
      } else {
        // There isn't a match, create raw color var
        const token =
          existingVariables[name] ||
          figma.variables.createVariable(name, collection.id, "COLOR");
        token.setValueForMode(modeId, {
          r: color.r,
          g: color.g,
          b: color.b,
          a: opacity,
        });
      }
    } else {
      const token =
        existingVariables[name] ||
        figma.variables.createVariable(name, collection.id, "COLOR");
      token.setValueForMode(modeId, {
        r: color.r,
        g: color.g,
        b: color.b,
        a: opacity,
      });
    }
  });
}

export async function importJson(
  collectionName: string,
  modeName: string,
  aliasCollectionName: string,
  aliasModeName: string,
  jsonContent: string
) {
  const existingCollections = figma.variables.getLocalVariableCollections();
  const existingCollection = existingCollections.find(
    (x) => x.name === collectionName
  );
  const collection =
    existingCollection ||
    figma.variables.createVariableCollection(collectionName);
  const modeId = existingCollection
    ? collection.modes.find((m) => m.name === modeName)?.modeId ||
      collection.addMode(modeName)
    : collection.modes[0].modeId;
  if (!existingCollection) {
    collection.renameMode(modeId, modeName);
  }
  let aliasCollection: VariableCollection | undefined;

  /**
   * Key is `name`, value is token id
   * */
  const aliasData: { [key: string]: string } = {};
  let aliasModeId: string | undefined;

  if (aliasCollectionName && aliasModeName) {
    aliasCollection = existingCollections.find(
      (x) => x.name === aliasCollectionName
    );
    if (!aliasCollection) {
      throw new Error(
        "Cannot find alias collection named: " + aliasCollectionName
      );
    }
    const aliasMode = aliasCollection.modes.find(
      (m) => m.name === aliasModeName
    );
    if (!aliasMode) {
      throw new Error("Cannot find alias mode named: " + aliasModeName);
    }

    const aliasVariables = figma.variables
      .getLocalVariables()
      .filter((v) => v.variableCollectionId === aliasCollection!.id);

    console.log("aliasVariables", aliasVariables);
    console.log("aliasCollection", aliasCollection);

    // TODO: there's no way to get variable from collection / mode ?

    aliasModeId = aliasMode.modeId;

    for (const variable of aliasVariables) {
      const value = variable.valuesByMode[aliasModeId];
      if (typeof value === "object") {
        aliasData[variable.name] = variable.id;
      } else {
        console.warn(
          "Skip var value not object",
          value,
          "in variable",
          variable
        );
      }
    }
  }

  console.log("aliasData", aliasData);

  const existingVariables: { [name: string]: Variable } = {};

  // Roundabout way to get variables via name in a collection
  {
    const collectionVariables = figma.variables
      .getLocalVariables()
      .filter((v) => v.variableCollectionId === collection!.id);
    for (const variable of collectionVariables) {
      existingVariables[variable.name] = variable;
    }
  }

  console.log({ existingVariables });

  const json = JSON.parse(
    jsonContent
      .replaceAll(`"value"`, `"$value"`)
      .replaceAll(`"type"`, `"$type"`)
      .replaceAll(`"transparent"`, `"{Transparent}"`)
  );

  Object.entries(json).forEach(([key, object]) => {
    traverseToken(
      collection,
      modeId,
      json.$type,
      key,
      object,
      aliasData,
      existingVariables,
      aliasCollection!,
      aliasModeId!
    );
  });
}

function isAlias(value: string) {
  return value.toString().trim().charAt(0) === "{";
}

function traverseToken(
  collection: VariableCollection,
  modeId: string,
  type: any, // VariableResolvedDataType
  key: string,
  object: any,
  aliasData: { [key: string]: string },
  existingVariables: { [name: string]: Variable },
  aliasCollection: VariableCollection,
  aliasModeId: string
  // tokens: { [key: string]: Variable },
  // aliases: { [key: string]: { key: string; type: string; valueKey: string } }
) {
  type = type || object.$type;
  // console.log("traverseToken", { type });
  // if key is a meta field, move on
  if (key.charAt(0) === "$") {
    console.log(key, "is a meta field, move on");
    return;
  }
  if (object.$value !== undefined) {
    if (isAlias(object.$value)) {
      const valueKey = saltReferenceKeyTransformer(object.$value.trim())
        .replace(/\./g, "/")
        .replace(/[\{\}]/g, "") as string;
      // console.log("traverseToken", { type, valueKey });
      if (aliasData[valueKey]) {
        // there is a match, create a reference
        const token =
          existingVariables[key] ||
          figma.variables.createVariable(key, collection.id, "COLOR");
        token.setValueForMode(modeId, {
          type: "VARIABLE_ALIAS",
          id: aliasData[valueKey],
        });
      } else {
        const alphaMatch = valueKey.match("\\d{2}A$");
        if (alphaMatch) {
          // e.g. valueKey = Blue/500/40A

          const alpha = Number.parseInt(alphaMatch[0].replace("A", "")) / 100; // 0.4

          const existedKey = valueKey.substring(0, valueKey.lastIndexOf("/")); // -> Blue/500
          const tokenId = aliasData[existedKey];
          if (tokenId) {
            const originalToken = figma.variables.getVariableById(tokenId);
            if (originalToken) {
              const alphaVariant = figma.variables.createVariable(
                valueKey,
                aliasCollection.id,
                "COLOR"
              );
              alphaVariant.setValueForMode(aliasModeId, {
                ...(originalToken.valuesByMode[aliasModeId] as any),
                a: alpha,
              });

              console.info(
                "Created new alpha alias for",
                valueKey,
                "alpha",
                alpha
              );

              // Store to aliasData to be used in another iteration
              aliasData[alphaVariant.name] = alphaVariant.id;

              // there is a match, create a reference
              const token =
                existingVariables[key] ||
                figma.variables.createVariable(key, collection.id, "COLOR");
              token.setValueForMode(modeId, {
                type: "VARIABLE_ALIAS",
                id: aliasData[valueKey],
              });
            } else {
              console.error(
                "Alias not found",
                valueKey,
                "failed to find original token to copy from"
              );
            }
          } else {
            console.error(
              "Alias not found",
              valueKey,
              "failed to create alpha variation"
            );
          }
        } else {
          console.error("Alias not found", valueKey);
        }
      }
    }
    // else if (type === "color") {
    //   tokens[key] = createToken(
    //     collection,
    //     modeId,
    //     "COLOR",
    //     key,
    //     parseColor(object.$value)
    //   );
    // } else if (type === "number") {
    //   tokens[key] = createToken(
    //     collection,
    //     modeId,
    //     "FLOAT",
    //     key,
    //     object.$value
    //   );
    // }
    else {
      console.log("unsupported type", type, object);
    }
  } else {
    Object.entries(object).forEach(([key2, object2]) => {
      if (key2.charAt(0) !== "$") {
        // console.log("traverseToken further", key2, object2);
        traverseToken(
          collection,
          modeId,
          type,
          `${key}/${key2}`,
          object2,
          aliasData,
          existingVariables,
          aliasCollection,
          aliasModeId
        );
      }
    });
  }
}

const replaceStrings = [
  ["fade.background", "40A"],
  ["fade.background.readonly", "15A"],
  ["fade.border", "40A"],
  ["fade.border.readonly", "25A"],
  ["fade.fill", "40A"],
  ["fade.foreground", "70A"],
  ["fade.backdrop", "70A"],
  ["fade.stroke", "40A"],
  ["fade.primary.border", "40A"],
  ["fade.secondary.border", "25A"],
  ["fade.tertiary.border", "15A"],
  ["fade.separatorOpacity.primary", "40A"],
  ["fade.separatorOpacity.secondary", "25A"],
  ["fade.separatorOpacity.tertiary", "15A"],
] as const;

const replacementMap = new Map(replaceStrings);

var replaceRegex = new RegExp(
  ".(" + replaceStrings.map(([from, to]) => from).join("|") + ")$",
  ""
);
var replacer = function (value: string) {
  return "." + (replacementMap.get(value.substring(1) as any) || "");
};

export function saltReferenceKeyTransformer(input: string) {
  const ref = input
    .replace("salt.color.", "")
    .replace(/^{/, "")
    .replace(/}$/, "");
  if (ref.includes("fade")) {
    return capitalizeAllParts(ref.replace(replaceRegex, replacer));
  } else {
    return capitalizeAllParts(ref);
  }
}

function capitalizeAllParts(string: string) {
  return string.split(".").map(capitalizeFirstLetter).join(".");
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
