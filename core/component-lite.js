//minimal component updator

import { eased, EasedValue, loop, spring, SpringValue } from "./ticker";
import e3 from "eventemitter3";
/**
 * @template T
 * @typedef { {data: T, update: _comp_updator<T>, visibility: EasedValue } } _comp<T>
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


//build a chain-ed clojure component
export function op(data, target = op.default) {
    var ev = new e3.EventEmitter();
    data.viz = data.viz || 0;
    function on(key, fn) {
        ev.on(key, fn);
    }
    var operator = {
        e: ev,
        data: data,
        visibility: eased(0, 1, 0.1),
        on: (key, fn) => { on(key, fn); return operator; },
        setup: (fn) => { on('setup', fn); return operator; },
        update: (fn) => { on('update', fn); return operator; },
        op: (fn) => { fn(operator); return operator; },
        asyncOp: async (fn) => { await fn(operator); return operator; },
        attach: (tg = target) => {
            //attach to target
            tg.push(operator);
            return operator;
        },
        detach: (tg = target) => {
            tg.splice(
                tg.indexOf(operator), 1
            );
            return operator;
        }
    }
    return operator;
}


export function op_tick(t, dt, components = op.default) {
    for (var i = 0; i < components.length; i++) {
        var c = components[i];
        c.visibility.to = c.data.viz; //driven by this
        if (c.visibility.value > 0 || c.visibility.to > 0) {
            c.emit("update", t, dt, c.data, c);
        }
        else {
        }
    }
}

export function op_loop(components = op.default) {
    loop((t, dt) => {
        op_tick(t, dt, components);
    });
}


op.default = [];


/**
 * @template T
 * @param {T} obj 
 * @returns {T}
 */
export function cp(obj, target = cp.default) {
    obj.data = obj.data || {};
    obj.gen = obj.gen || {};
    obj.init && obj.init.call(obj);
    target.push(obj);
    return obj;
}

export function cp_tick(t, dt, comps = cp.default) {
    for (var i = 0; i < comps.length; i++) {
        var c = comps[i];
        if (c.data && (c.data.enabled == false || c.data.disabled == true)) {
            continue;
        }
        if (c.loop) {
            c.loop.call(c, t, dt);
        }
    }
}

export function cp_loop(components = cp.default) {
    loop((t, dt) => {
        cp_tick(t, dt, components);
    });
}


cp.default = [];