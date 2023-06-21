type StoredColorStyleInfo = {
  name: string;
  color: { r: number; g: number; b: number };
  opacity: number;
};
export const storeLibraryStyles = async () => {
  const styles = figma.getLocalPaintStyles();
  const styleNameToDataMap = styles.reduce((into, current) => {
    const paints = current.paints.filter(({ visible }) => visible);
    if (paints.length > 1) {
      // do something different i guess
    } else {
      const paint0 = paints[0];
      if (paint0.type !== "SOLID") {
        // do something different i guess
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
            opacity: opacity || 1,
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

  createTokens(
    storedInfo,
    collectionName,
    modeName,
    aliasCollectionName,
    aliasModeName
  );
};

function createTokens(
  styleData: StoredColorStyleInfo[],
  collectionName: string,
  modeName: string,
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

  styleData.forEach(({ name, color, opacity }) => {
    // Alias path
    if (aliasCollectionName && aliasModeName) {
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
