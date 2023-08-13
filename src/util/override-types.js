import { includes } from "./includes";
import { devLibs } from "./dev-libs";

function sorter(first, second) {
  return first.moduleName > second.moduleName;
}

export const getOverrideTypes = (
  currentPageMap,
  nextPageMap,
  notOverriddenMap,
  filterModuleNames
) => {
  const overriddenModules = [],
    nextOverriddenModules = [],
    disabledOverrides = [],
    defaultModules = [],
    externalOverrideModules = [],
    pendingRefreshDefaultModules = [],
    devLibModules = [];

  const overrideMap = window.importMapOverrides.getOverrideMap(true).imports;
  const notOverriddenKeys = Object.keys(notOverriddenMap.imports);
  const disabledModules = window.importMapOverrides.getDisabledOverrides();

  notOverriddenKeys
    .filter(filterModuleNames ? filterModuleNames : () => true)
    .forEach((moduleName) => {
      const mod = {
        moduleName,
        defaultUrl: notOverriddenMap.imports[moduleName],
        overrideUrl: overrideMap[moduleName],
        disabled: includes(disabledModules, moduleName),
      };
      if (mod.disabled) {
        disabledOverrides.push(mod);
      } else if (overrideMap[moduleName]) {
        if (currentPageMap.imports[moduleName] === overrideMap[moduleName]) {
          if (
            devLibs[moduleName] &&
            devLibs[moduleName](currentPageMap.imports[moduleName]) ===
              overrideMap[moduleName]
          ) {
            devLibModules.push(mod);
          } else {
            overriddenModules.push(mod);
          }
        } else {
          nextOverriddenModules.push(mod);
        }
      } else if (
        notOverriddenMap.imports[moduleName] ===
        currentPageMap.imports[moduleName]
      ) {
        defaultModules.push(mod);
      } else if (
        notOverriddenMap.imports[moduleName] === nextPageMap.imports[moduleName]
      ) {
        pendingRefreshDefaultModules.push(mod);
      } else {
        externalOverrideModules.push(mod);
      }
    });

  Object.keys(overrideMap)
    .filter(filterModuleNames)
    .forEach((moduleName) => {
      if (!includes(notOverriddenKeys, moduleName)) {
        const mod = {
          moduleName,
          defaultUrl: null,
          overrideUrl: overrideMap[moduleName],
          disabled: includes(disabledModules, moduleName),
        };

        if (mod.disabled) {
          disabledOverrides.push(mod);
        } else if (
          currentPageMap.imports[moduleName] === overrideMap[moduleName]
        ) {
          overriddenModules.push(mod);
        } else {
          nextOverriddenModules.push(mod);
        }
      }
    });

  overriddenModules.sort(sorter);
  defaultModules.sort(sorter);
  nextOverriddenModules.sort(sorter);

  return {
    nextOverriddenModules,
    pendingRefreshDefaultModules,
    disabledOverrides,
    overriddenModules,
    externalOverrideModules,
    devLibModules,
    defaultModules,
  };
};
