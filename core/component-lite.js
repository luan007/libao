//minimal component updator

import { eased, EasedValue, loop, spring, SpringValue } from "./ticker";

/**
 * @template T
 * @typedef { {data: T, update: _comp_updator<T>, visibility: SpringValue } } _comp<T>
 */

/**
 * @template T
 * @typedef {(t: number, dt: number, data: T, comp: _comp<T>) => void} _comp_updator<T>
 */

/**
 * @template {{viz: number}} T
 * @param {T} obj 
 * @param {_comp_updator<T>} update_function 
 * @param {Array} target 
 * @returns {_comp<T>}
 */
 export function component(obj, update_function, target = component.default) {
    obj.viz = obj.viz == undefined ? 1 : obj.viz;
    var comp = {
        data: obj,
        update: update_function,
        // visibility: spring({
        //     damping: 0.8
        // }),
        visibility: eased(0, 1, 0.1, 0.0000001)
    };
    target.push(comp);
    return comp;
}

component.default = [];

export function component_tick(t, dt, components = component.default) {
    for (var i = 0; i < components.length; i++) {
        var c = components[i];
        c.visibility.to = c.data.viz; //driven by this
        if (c.visibility.value > 0 || c.visibility.to > 0) {
            c.update(t, dt, c.data, c);
        }
        else {
            //skip
        }
    }
}

export function component_loop(components = component.default) {
    loop((t, dt) => {
        component_tick(t, dt, components);
    });
}
