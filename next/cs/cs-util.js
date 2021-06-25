import * as openSimp from "open-simplex-noise";
import * as ao from "../../index"
import { changed, co_loop, ease, fetchYamlAsync, three, yaml } from "../../index";
import { threePerspectiveCamera } from "../../fx/three-util.js";
import { comp_three, reg_component } from "./cs.js";
import { defaultDatGUI, inspect, m_func, m_number, m_text, prep } from "../../prototyping/buildr/lite";
import { comp_base, comp_vue } from "..";

export class cs_vue_instancer extends comp_base {
    constructor(key, data) {
        super(key, data);

        this.data = {
            vue_data: {},
            ...this.data
        };

    }
    onInit() {
        super.onInit();
        for (var i in this.data.vue_data) {
            new comp_vue(
                i,
                {
                    viz: this.data.vue_data[i].viz ?? 1,
                    tweak: this.data.vue_data[i].tweak ?? 0,
                    vtype: this.data.vue_data[i].vue ?? this.data.vue_data[i].vtype
                },
                this.data.vue_data[i]
            )
            console.log(i, this.data.vue_data[i]);
        }
    }
}

reg_component("vue_instancer", cs_vue_instancer);