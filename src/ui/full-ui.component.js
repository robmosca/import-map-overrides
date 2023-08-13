import { h, Component } from "preact";
import Popup from "./popup.component";
import DevLibOverrides from "./dev-lib-overrides.component";
import { overridesBesidesDevLibs } from "../util/dev-libs";
import { getOverrideTypes } from "../util/override-types";

function validateTriggerPosition(position) {
  const validPositions = [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
  ];

  return validPositions.indexOf(position) >= 0 ? position : "bottom-right";
}

function TriggerButton({
  triggerPosition,
  toggleTrigger,
  atLeastOneOverride,
  pendingOverrides,
}) {
  return (
    <div>
      <button
        onClick={toggleTrigger}
        className={`imo-unstyled imo-trigger imo-trigger-${triggerPosition} ${
          atLeastOneOverride
            ? pendingOverrides
              ? "imo-trigger-pending-overrides"
              : "imo-trigger-applied-overrides"
            : ""
        }`}
      >
        {"{\u00B7\u00B7\u00B7}"}
      </button>
    </div>
  );
}

export default class FullUI extends Component {
  state = {
    showingPopup: false,
  };

  componentDidMount() {
    window.addEventListener("import-map-overrides:change", this.doUpdate);
  }

  componentWillUnmount() {
    window.removeEventListener("import-map-overrides:change", this.doUpdate);
  }

  doUpdate = () => this.forceUpdate();

  render(props, state) {
    const shouldShow =
      !props.customElement.hasAttribute("show-when-local-storage") ||
      localStorage.getItem(
        props.customElement.getAttribute("show-when-local-storage")
      ) === "true";

    const triggerPosition = validateTriggerPosition(
      props.customElement.getAttribute("trigger-position")
    );

    if (!shouldShow) {
      return null;
    }

    return (
      <div>
        {!state.showingPopup && (
          <TriggerButton
            triggerPosition={triggerPosition}
            toggleTrigger={this.toggleTrigger}
            atLeastOneOverride={this.atLeastOneOverride()}
            pendingOverrides={this.pendingOverrides()}
          />
        )}
        {this.useDevLibs() && <DevLibOverrides />}
        {state.showingPopup && (
          <Popup
            close={this.toggleTrigger}
            importMapChanged={this.importMapChanged}
          />
        )}
      </div>
    );
  }

  toggleTrigger = () => {
    this.setState((prevState) => ({
      showingPopup: !prevState.showingPopup,
    }));
  };

  importMapChanged = () => {
    this.forceUpdate();
  };

  useDevLibs = () => {
    const localStorageValue = localStorage.getItem(
      "import-map-overrides-dev-libs"
    );
    return localStorageValue
      ? localStorageValue === "true"
      : this.props.customElement.hasAttribute("dev-libs");
  };

  pendingOverrides = () => {
    const { nextOverriddenModules, pendingRefreshDefaultModules } =
      getOverrideTypes(this.filterModuleNames);

    return (
      nextOverriddenModules.length > 0 ||
      pendingRefreshDefaultModules.length > 0
    );
  };

  atLeastOneOverride = () => {
    if (this.useDevLibs()) {
      return overridesBesidesDevLibs();
    } else {
      return (
        Object.keys(window.importMapOverrides.getOverrideMap().imports).length >
        0
      );
    }
  };
}
