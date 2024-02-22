import { GetVariableResponse, Variable } from "./types";

export function toCamelCase(str: string): string {
  // E.g. CTA => cta
  if (str.toUpperCase() === str) {
    return str.toLowerCase();
  }
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

export function toKebabCase(str: string): string {
  const withoutSpace = str.replace(/\s/g, "-");
  // Ignore name begin with digits
  if (withoutSpace.match(/^\d+/)) {
    return withoutSpace.toLowerCase();
  }
  return withoutSpace.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    ($, ofs) => (ofs ? "-" : "") + $.toLowerCase()
  );
}

/**
 * Filter out remote variables and collections, add "/default" suffix to any
 * variable (in the same collection group) which also served as group name.
 *
 * e.g. when "Black" and "Black/100" both exist, variable with "Black" name
 * will be modified to be "Black/default".
 *
 * @param {*} data Figma variables REST API response's `meta` data
 * @returns new data with remote filtered out and variable name modified
 */
export function updateApiResponse(
  data: GetVariableResponse["meta"],
  options: {
    addDefault: boolean;
    tokenNameTransform?: (name: string) => string;
  } = { addDefault: true }
) {
  const { addDefault, tokenNameTransform } = options;
  // New data object
  const newData: GetVariableResponse["meta"] = {
    variableCollections: {},
    variables: {},
  };

  // Find all non-remote collections
  const nonRemoteCollections = Object.values(data.variableCollections).filter(
    (c) => !c.remote
  );
  // Add collection to new object.variableCollections
  nonRemoteCollections.forEach((c) => (newData.variableCollections[c.id] = c));

  // Filter and group non-remote variables by collections
  const variablesByGroup: Record<string, Variable[]> = {};
  for (const v of Object.values(data.variables)) {
    if (v.remote) {
      continue;
    }
    const collectionId = v.variableCollectionId;
    if (variablesByGroup[collectionId] === undefined) {
      variablesByGroup[collectionId] = [];
    }
    variablesByGroup[collectionId].push(v);
  }

  // In each collection group
  for (const variablesInCollection of Object.values(variablesByGroup)) {
    // Sort variables by name
    variablesInCollection.sort((a, b) => a.name.localeCompare(b.name));

    // Iterate variables, compare name with previous name
    let prevVariable = undefined;
    for (let index = 0; index < variablesInCollection.length; index++) {
      const element = variablesInCollection[index];
      if (tokenNameTransform) {
        element.name = tokenNameTransform(element.name);
      }
      newData.variables[element.id] = element;

      if (addDefault && prevVariable !== undefined) {
        // If name has exactly one more "/", previous one needs to be appended a "default"
        const lastSlashIndex = element.name.lastIndexOf("/");
        if (lastSlashIndex !== -1) {
          if (element.name.substring(0, lastSlashIndex) === prevVariable.name) {
            prevVariable.name = prevVariable.name + "/default";
          }
        }
      }
      prevVariable = element;
    }
  }

  // return new object
  return newData;
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
export function addDefaultToNestedTokens(tokens: any) {
  const newTokens: Record<string, any> = {};

  const allKeys = Object.keys(tokens);
  const nonDollarKeys = allKeys.filter((k) => !k.startsWith("$"));
  if (tokens.$value !== undefined) {
    // Any property with $value and other nested names, create a default object hosting all keys with $ prefix
    if (nonDollarKeys.length > 0) {
      const defaultToken: Record<string, any> = {};
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
