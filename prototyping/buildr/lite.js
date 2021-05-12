import * as gui from "dat.gui";

export var defaultDatGUI;

export function prep() {
    defaultDatGUI = new gui.GUI()
}

export function meta(key, type, meta = {}, onChange) {
    var mounted = {};
    mounted["__meta__$$" + key] = {
        type, ...meta, onChange
    };
    return mounted;
}

//alias
export var m_bool = (key, _meta, onChange) => meta(key, "bool", _meta, onChange);
export var m_number = (key, { min = -999, max = 999, step = 0.1, ...other }, onChange) => meta(key, "number", { min, max, step, ...other }, onChange);
export var m_opts = (key, { items = [], ...other }, onChange) => meta(key, "options", { items, ...other }, onChange);
export var m_func = (key, { func = null, ...other }, onChange) => meta(key, "func", { func, ...other }, onChange);
export var m_text = (key, _meta, onChange) => meta(key, "text", _meta, onChange);
export var m_color = (key, _meta, onChange) => meta(key, "color", _meta, onChange);
export var m_useMeta = (key, { _meta, ...other }, onChange) => meta(key, "template", { _meta, ...other }, onChange);
export var m_hook = (key, { fn, ...props }) => meta("$$hook_" + key, "hook", { fn, ...props })
export var h_onchange = (fn) => m_hook("update", { fn })

export var proxy_ao_eased = (name, prop = 'to') => ({
    mute: true,
    get(meta, obj) {
        return obj[name][prop];
    },
    set(meta, obj, value) {
        return obj[name][prop] = value;
    }
});

export var proxy_three_color = (name) => ({
    mute: true,
    _arr: [0, 0, 0],
    get(meta, obj) {
        meta._arr[0] = obj[name].r * 255;
        meta._arr[1] = obj[name].g * 255;
        meta._arr[2] = obj[name].b * 255;
        return meta._arr;
    },
    set(meta, obj, value) {
        obj[name].setRGB(value[0] / 255, value[1] / 255, value[2] / 255);
    }
})


/**
 * @template T
 * @param {T} obj
 * @returns {T}
 */
export function inspect(obj, name, meta_source = null, gui = defaultDatGUI, global_onchanged) {
    meta_source = meta_source ? ({ ...meta_source, ...obj }) : obj;


    var good_meta = Object.keys(meta_source).filter((v => v.startsWith("__meta__$$"))).map((v) => (v.replace("__meta__$$", "")));
    var all_keys = Object.keys(obj).filter((v => obj.hasOwnProperty(v) && !v.startsWith("__meta__$$")));
    var all_hooks = Object.keys(meta_source).filter((v => v.startsWith("__meta__$$$$hook_"))).map((v) => (v.replace("__meta__$$$$hook_", "")));
    var what_ever_keys = new Set(Object.keys(obj).filter(v => obj.hasOwnProperty(v)).concat(Object.keys(meta_source)));

    var local_changed = global_onchanged;
    var hook_update = meta_source['__meta__$$' + '$$hook_update'];
    hook_update = hook_update ? hook_update.fn.bind(obj) : null;
    all_hooks = all_hooks.filter((v) => v != "update");

    var on_changed = (level, key, value) => {
        hook_update && hook_update(level, key, value);
        local_changed && local_changed(level, key, value);
    };

    var folder = gui.addFolder(name);
    var content = 0;

    function __mount(obj, meta, v) {
        var item;
        if (meta.type == 'options') {
            item = folder.add(obj, v, meta.items)
        } else if (meta.type == 'number') {
            meta.min = meta.min == undefined ? -Infinity : meta.min;
            meta.max = meta.max == undefined ? Infinity : meta.max;
            item = folder.add(obj, v, meta.min, meta.max, meta.step || 0.1)
        } else if (meta.type == 'color') {
            item = folder.addColor(obj, v)
        } else if (meta.type == 'text') {
            item = folder.add(obj, v)
        } else if (meta.type == 'func') {
            if (meta['func']) {
                meta[v] = meta['func'].bind(obj);
                item = folder.add(meta, v)
            }
            else {
                item = folder.add(obj, v)
            }
        } else if (meta.type == 'bool') {
            item = folder.add(obj, v)
        }
        content++;
        return item;
    }

    what_ever_keys.forEach((v) => {
        var item = null;
        var meta = null;
        if (all_keys.indexOf(v) > -1) {
            meta = meta_source['__meta__$$' + v];
            if (obj[v] && typeof (obj[v]) == 'object') {
                return inspect(obj[v], v,
                    (meta && meta.type == "template") ? meta.meta : meta_source[v], folder, on_changed);
            }
            if (good_meta.indexOf(v) < 0) {
                return;
            }
            item = __mount(obj, meta, v);
        }
        else if (v.startsWith('__meta__$$') && !v.startsWith("__meta__$$$$hook_") &&
            all_keys.indexOf(v.replace('__meta__$$', '')) == -1
        ) {
            v = v.replace('__meta__$$', '');
            meta = meta_source['__meta__$$' + v];
            Object.defineProperty(meta, v, {
                get: () => { return meta.get(meta, obj) },
                set: (value) => { return meta.set(meta, obj, value) },
            });
            item = __mount(meta, meta, v);
        }
        else if (all_hooks.indexOf(v.replace("__meta__$$$$hook_", "")) > -1 && meta_source[v] && v.startsWith('__meta__$$$$hook_')) {
            meta = meta_source[v];
            var display = v.replace("__meta__$$$$hook_", "");
            meta_source[v][display] = meta.fn.bind(obj);
            item = folder.add(meta_source[v], display);
            content++;
        }


        if (item && meta) {
            if (!meta.mute) {
                item.listen();
            }
            item.onChange((value) => {
                meta.onChange && meta.onChange(value);
                on_changed(obj, v, value);
            });
        }
    });
    if (content == 0) {
        gui.removeFolder(folder);
    }

    return obj;
}


// var test = {
//     a: 5,
//     b: 7,
//     check: true,
//     action_1() {
//         console.log(this, 123);
//     },
//     some_group: {
//         x: "selection1",
//         ...m_opts('x', { items: ['selection1', 'selection2', 'selection3'] })
//     },
//     ...m_bool('check', 'bool'),
//     ...m_number('a', { min: 5, max: 8, step: 0.1 }, (v) => { console.log(v) }),
//     ...m_number('b', { min: 5, max: 8, step: 0.1 }),
//     ...m_func('action_1', {}),
//     ...h_onchange(function (level, key, value) {
//     }),
//     ...m_hook("demo", {
//         fn: function () {
//             console.log("demo triggered", this)
//         }
//     })
// };

// lit(test, 'test object');