import { h, Component } from "preact";
import { devLibs } from "../util/dev-libs";

function addDevLibOverrides(notOverriddenMap) {
  Object.keys(notOverriddenMap.imports)
    .filter((libName) => devLibs[libName])
    .forEach((libName) => {
      window.importMapOverrides.addOverride(
        libName,
        devLibs[libName](notOverriddenMap.imports[libName])
      );
    });
}

export default class DevLibOverrides extends Component {
  componentDidMount() {
    window.importMapOverrides.getCurrentPageMap().then(addDevLibOverrides);
  }

  render() {
    return null;
  }
}
