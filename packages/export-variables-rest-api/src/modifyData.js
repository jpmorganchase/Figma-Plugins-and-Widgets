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
export function updateApiResponse(data) {
  // New data object
  const newData = { variableCollections: {}, variables: {} };

  // Find all non-remote collections
  const nonRemoteCollections = Object.values(data.variableCollections).filter(
    (c) => !c.remote
  );
  // Add collection to new object.variableCollections
  nonRemoteCollections.forEach((c) => (newData.variableCollections[c.id] = c));

  // Filter and group non-remote variables by collections
  const variablesByGroup = {};
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
      newData.variables[element.id] = element;

      if (prevVariable !== undefined) {
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
