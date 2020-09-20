import { Vue } from "../"
import * as utilComps from "./vue2comps/*.vue";

export function vue2ImportAll(components, prefix = "") {
    for (var i in components) {
        if (i == 'default') continue;
        Vue.component(prefix + i, components[i].default)
    }
}

export function vue2ImportUtilComps() {
    vue2ImportAll(utilComps);
}