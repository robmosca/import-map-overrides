import { h, Component, render } from "preact";
import { includes } from "../../util/includes.js";
import ModuleDialog from "./module-dialog.component";
import ExternalImportMap from "./external-importmap-dialog.component";
import { getOverrideTypes } from "../../util/override-types.js";

function SearchIcon() {
  return (
    <div className="imo-icon imo-list-search-icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="17"
        viewBox="0 0 16 17"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M10.9748 10.9683C10.985 10.9773 10.995 10.9867 11.0047 10.9965L13.8047 13.7965C14.0651 14.0568 14.0651 14.479 13.8047 14.7393C13.5444 14.9997 13.1223 14.9997 12.8619 14.7393L10.0619 11.9393C10.0522 11.9295 10.0428 11.9196 10.0337 11.9094C9.19238 12.5525 8.14081 12.9346 7 12.9346C4.23858 12.9346 2 10.696 2 7.93457C2 5.17315 4.23858 2.93457 7 2.93457C9.76142 2.93457 12 5.17315 12 7.93457C12 9.07538 11.6179 10.127 10.9748 10.9683ZM7 11.6012C9.02504 11.6012 10.6667 9.95961 10.6667 7.93457C10.6667 5.90953 9.02504 4.2679 7 4.2679C4.97496 4.2679 3.33333 5.90953 3.33333 7.93457C3.33333 9.95961 4.97496 11.6012 7 11.6012Z"
        />
      </svg>
    </div>
  );
}
function SearchBox({ value, onInput, inputRef }) {
  return (
    <div className="imo-list-search-container">
      <SearchIcon />
      <input
        aria-label="Search modules"
        placeholder="Search modules..."
        value={value}
        onInput={onInput}
        ref={inputRef}
      />
    </div>
  );
}

function PlusIcon() {
  return (
    <div className="imo-icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="17"
        viewBox="0 0 16 17"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M8.82358 8.11099H12.1764C12.6313 8.11099 13 8.47972 13 8.93457C13 9.38942 12.6313 9.75815 12.1764 9.75815H8.82358V13.111C8.82358 13.5658 8.45485 13.9346 8 13.9346C7.54515 13.9346 7.17642 13.5658 7.17642 13.111V9.75815H3.82358C3.36873 9.75815 3 9.38942 3 8.93457C3 8.47972 3.36873 8.11099 3.82358 8.11099H7.17642V4.75815C7.17642 4.3033 7.54515 3.93457 8 3.93457C8.45485 3.93457 8.82358 4.3033 8.82358 4.75815V8.11099Z"
        />
      </svg>
    </div>
  );
}

export default class List extends Component {
  state = {
    notOverriddenMap: { imports: {} },
    currentPageMap: { imports: {} },
    nextPageMap: { imports: {} },
    dialogModule: null,
    dialogExternalMap: null,
    searchVal: "",
  };

  componentDidMount() {
    window.importMapOverrides.getDefaultMap().then((notOverriddenMap) => {
      this.setState({ notOverriddenMap });
    });
    window.importMapOverrides.getCurrentPageMap().then((currentPageMap) => {
      this.setState({ currentPageMap });
    });
    window.importMapOverrides.getNextPageMap().then((nextPageMap) => {
      this.setState({ nextPageMap });
    });
    window.addEventListener("import-map-overrides:change", this.doUpdate);
    this.inputRef.focus();
  }

  componentWillUnmount() {
    window.removeEventListener("import-map-overrides:change", this.doUpdate);
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.dialogModule && this.state.dialogModule) {
      this.dialogContainer = document.createElement("div");
      document.body.appendChild(this.dialogContainer);
      render(
        <ModuleDialog
          module={this.state.dialogModule}
          cancel={this.cancel}
          updateModuleUrl={this.updateModuleUrl}
          addNewModule={this.addNewModule}
        />,
        this.dialogContainer
      );
    } else if (prevState.dialogModule && !this.state.dialogModule) {
      render(null, this.dialogContainer);
      this.dialogContainer.remove();
      delete this.dialogContainer;
    }

    if (!prevState.dialogExternalMap && this.state.dialogExternalMap) {
      this.dialogContainer = document.createElement("div");
      document.body.appendChild(this.dialogContainer);
      render(
        <ExternalImportMap
          dialogExternalMap={this.state.dialogExternalMap}
          cancel={this.cancel}
        />,
        this.dialogContainer
      );
    } else if (prevState.dialogExternalMap && !this.state.dialogExternalMap) {
      render(null, this.dialogContainer);
      this.dialogContainer.remove();
      delete this.dialogContainer;
    }
  }

  render() {
    const {
      overriddenModules,
      nextOverriddenModules,
      disabledOverrides,
      defaultModules,
      externalOverrideModules,
      pendingRefreshDefaultModules,
      devLibModules,
    } = getOverrideTypes(
      this.state.currentPageMap,
      this.state.nextPageMap,
      this.state.notOverriddenMap,
      this.filterModuleNames
    );

    const { brokenMaps, workingCurrentPageMaps, workingNextPageMaps } =
      getExternalMaps();

    return (
      <div className="imo-list-container">
        <div className="imo-table-toolbar">
          <SearchBox
            value={this.state.searchVal}
            onInput={(evt) => this.setState({ searchVal: evt.target.value })}
            inputRef={(ref) => (this.inputRef = ref)}
          />
          <button onClick={() => window.importMapOverrides.resetOverrides()}>
            Reset all overrides
          </button>
        </div>
        <table className="imo-overrides-table">
          <thead>
            <tr>
              <th>Module Status</th>
              <th>Module Name</th>
              <th>Domain</th>
              <th>Filename</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {nextOverriddenModules.map((mod) => (
              <tr
                role="button"
                tabIndex={0}
                onClick={() => this.setState({ dialogModule: mod })}
                key={mod.moduleName}
                className="imo-table-row-next"
              >
                <td>
                  <div className="imo-status imo-next-override" />
                  Inline Override
                </td>
                <td>{mod.moduleName}</td>
                <td>{toDomain(mod)}</td>
                <td>{toFileName(mod)}</td>
                <td onClick={this.reload} role="button">
                  Refresh to apply changes
                </td>
              </tr>
            ))}
            {pendingRefreshDefaultModules.map((mod) => (
              <tr
                role="button"
                tabIndex={0}
                onClick={() => this.setState({ dialogModule: mod })}
                key={mod.moduleName}
                className="imo-table-row-next"
              >
                <td>
                  <div className="imo-status imo-next-default" />
                  Default
                </td>
                <td>{mod.moduleName}</td>
                <td>{toDomain(mod)}</td>
                <td>{toFileName(mod)}</td>
                <td onClick={this.reload} role="button">
                  Refresh to apply changes
                </td>
              </tr>
            ))}
            {disabledOverrides.map((mod) => (
              <tr
                role="button"
                tabIndex={0}
                onClick={() => this.setState({ dialogModule: mod })}
                key={mod.moduleName}
              >
                <td>
                  <div className="imo-status imo-disabled-override" />
                  Override disabled
                </td>
                <td>{mod.moduleName}</td>
                <td>{toDomain(mod)}</td>
                <td>{toFileName(mod)}</td>
                <td>Enable override</td>
              </tr>
            ))}
            {overriddenModules.map((mod) => (
              <tr
                role="button"
                tabIndex={0}
                onClick={() => this.setState({ dialogModule: mod })}
                key={mod.moduleName}
                className="imo-table-row-current-override"
              >
                <td>
                  <div className="imo-status imo-current-override" />
                  Inline Override
                </td>
                <td>{mod.moduleName}</td>
                <td>{toDomain(mod)}</td>
                <td>{toFileName(mod)}</td>
                <td>Disable override</td>
              </tr>
            ))}
            {externalOverrideModules.map((mod) => (
              <tr
                role="button"
                tabIndex={0}
                onClick={() => this.setState({ dialogModule: mod })}
                key={mod.moduleName}
                className="imo-table-row-external"
              >
                <td>
                  <div className="imo-status imo-external-override" />
                  External Override
                </td>
                <td>{mod.moduleName}</td>
                <td>{toDomain(mod)}</td>
                <td>{toFileName(mod)}</td>
                <td>-</td>
              </tr>
            ))}
            {devLibModules.map((mod) => (
              <tr
                role="button"
                tabIndex={0}
                onClick={() => this.setState({ dialogModule: mod })}
                key={mod.moduleName}
                title="Automatically use dev version of certain npm libs"
              >
                <td>
                  <div className="imo-status imo-dev-lib-override" />
                  Dev Lib Override
                </td>
                <td>{mod.moduleName}</td>
                <td>{toDomain(mod)}</td>
                <td>{toFileName(mod)}</td>
                <td>-</td>
              </tr>
            ))}
            {defaultModules.map((mod) => (
              <tr
                role="button"
                tabIndex={0}
                onClick={() => this.setState({ dialogModule: mod })}
                key={mod.moduleName}
              >
                <td>
                  <div className="imo-status imo-default-module" />
                  Default
                </td>
                <td>{mod.moduleName}</td>
                <td>{toDomain(mod)}</td>
                <td>{toFileName(mod)}</td>
                <td>Override</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(brokenMaps.length > 0 ||
          workingCurrentPageMaps.length > 0 ||
          workingNextPageMaps.length > 0) && (
          <table className="imo-overrides-table">
            <thead>
              <th>Import Map Status</th>
              <th>URL</th>
            </thead>
            <tbody>
              {brokenMaps.map((url) => (
                <tr
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    this.setState({
                      dialogExternalMap: { isNew: false, url },
                    })
                  }
                  key={url}
                >
                  <td>
                    <div className="imo-status imo-disabled-override" />
                    <div>Invalid</div>
                  </td>
                  <td>{url}</td>
                </tr>
              ))}
              {workingNextPageMaps.map((url) => (
                <tr
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    this.setState({
                      dialogExternalMap: { isNew: false, url },
                    })
                  }
                  key={url}
                >
                  <td>
                    <div className="imo-status imo-next-override" />
                    <div>Pending refresh</div>
                  </td>
                  <td>{url}</td>
                </tr>
              ))}
              {workingCurrentPageMaps.map((url) => (
                <tr
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    this.setState({
                      dialogExternalMap: { isNew: false, url },
                    })
                  }
                  key={url}
                >
                  <td>
                    <div className="imo-status imo-current-override" />
                    <div>Override</div>
                  </td>
                  <td>{url}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="imo-table-actions">
          <button
            onClick={() =>
              this.setState({
                dialogModule: { moduleName: "New module", isNew: true },
              })
            }
          >
            <PlusIcon />
            Add new module
          </button>
          <button
            onClick={() => {
              this.setState({
                dialogExternalMap: { url: "", isNew: true },
              });
            }}
          >
            <PlusIcon />
            Add import map
          </button>
        </div>
      </div>
    );
  }

  reload = (evt) => {
    evt.stopPropagation();
    window.location.reload();
  };

  disableOverride(moduleName) {
    window.importMapOverrides.disableOverride(moduleName);
  }

  cancel = () => {
    this.setState({ dialogModule: null, dialogExternalMap: null });
  };

  updateModuleUrl = (newUrl) => {
    newUrl = newUrl || null;

    if (newUrl === null) {
      window.importMapOverrides.removeOverride(
        this.state.dialogModule.moduleName
      );
    } else {
      window.importMapOverrides.addOverride(
        this.state.dialogModule.moduleName,
        newUrl
      );
    }

    this.setState({ dialogModule: null });
  };

  doUpdate = () => {
    this.forceUpdate();
    window.importMapOverrides.getNextPageMap().then((nextPageMap) => {
      this.setState({ nextPageMap });
    });
  };

  addNewModule = (name, url) => {
    if (name && url) {
      window.importMapOverrides.addOverride(name, url);
    }
    this.setState({ dialogModule: null });
  };

  filterModuleNames = (moduleName) => {
    return this.state.searchVal.trim().length > 0
      ? includes(moduleName, this.state.searchVal)
      : true;
  };
}

const currentBase =
  (document.querySelector("base") && document.querySelector("base").href) ||
  location.origin + "/";

function toDomain(mod) {
  const urlStr = toUrlStr(mod);
  const url = toURL(urlStr);
  return url ? url.host : urlStr;
}

function toFileName(mod) {
  const urlStr = toUrlStr(mod);
  const url = toURL(urlStr);
  return url ? url.pathname.slice(url.pathname.lastIndexOf("/") + 1) : urlStr;
}

function toUrlStr(mod) {
  return mod.overrideUrl || mod.defaultUrl;
}

function toURL(urlStr) {
  try {
    return new URL(urlStr, currentBase);
  } catch {
    return null;
  }
}

function getExternalMaps() {
  const allExternalMaps = window.importMapOverrides.getExternalOverrides();
  const allCurrentPageMaps =
    window.importMapOverrides.getCurrentPageExternalOverrides();
  const brokenMaps = [],
    workingCurrentPageMaps = [],
    workingNextPageMaps = [];

  for (let externalMap of allExternalMaps) {
    if (includes(window.importMapOverrides.invalidExternalMaps, externalMap)) {
      brokenMaps.push(externalMap);
    } else {
      if (includes(allCurrentPageMaps, externalMap)) {
        workingCurrentPageMaps.push(externalMap);
      } else {
        workingNextPageMaps.push(externalMap);
      }
    }
  }

  return {
    brokenMaps,
    workingCurrentPageMaps,
    workingNextPageMaps,
  };
}
