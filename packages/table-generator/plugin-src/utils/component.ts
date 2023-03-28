// we need this map as import component doesn't work on local ones
const localComponentMap: Map<string, ComponentNode> = new Map();

export const loadLocalComponent = () => {
  // TODO: any easier way to find local components
  const list = figma.root.findAllWithCriteria({ types: ["COMPONENT"] });
  list.forEach((comp) => {
    localComponentMap.set(comp.key, comp);
  });
};

export const getComponentByKey = async (key: string) => {
  if (localComponentMap.has(key)) {
    return localComponentMap.get(key);
  } else {
    return await figma.importComponentByKeyAsync(key);
  }
};

export const getComponentDisplayName = (node: ComponentNode): string => {
  if (node.variantProperties) {
    if (node.parent && node.parent.type === "COMPONENT_SET") {
      return node.parent.name;
    }
  }

  // Fall back to node name
  return node.name;
};
