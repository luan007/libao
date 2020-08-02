import * as gui from "dat.gui";

var g = new gui.GUI();

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
export var m_text = (key, _meta, onChange) => meta(key, "text", meta, onChange);
export var m_color = (key, _meta, onChange) => meta(key, "color", meta, onChange);
export var m_useMeta = (key, { _meta, ...other }, onChange) => meta(key, "template", { _meta, ...other }, onChange);
export var m_hook = (key, { fn, ...props }) => meta("$$hook_" + key, "hook", { fn, ...props })
export var h_onchange = (fn) => m_hook("update", { fn })


var test = {
    a: 5,
    b: 7,
    check: true,
    action_1() {
        console.log(this, 123);
    },
    some_group: {
        x: "selection1",
        ...m_opts('x', { items: ['selection1', 'selection2', 'selection3'] })
    },
    ...m_bool('check', 'bool'),
    ...m_number('a', { min: 5, max: 8, step: 0.1 }, (v) => { console.log(v) }),
    ...m_number('b', { min: 5, max: 8, step: 0.1 }),
    ...m_func('action_1', {}),
    ...h_onchange(function (level, key, value) {
    }),
    ...m_hook("demo", {
        fn: function () {
            console.log("demo triggered", this)
        }
    })
};

export function lit(obj, name, meta_source = null, gui = g, global_onchanged) {
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
    what_ever_keys.forEach((v) => {
        var item = null;
        var meta = null;
        if (all_keys.indexOf(v) > -1) {
            meta = meta_source['__meta__$$' + v];
            if (typeof (obj[v]) == 'object') {
                return lit(obj[v], v,
                    (meta && meta.type == "template") ? meta.meta : meta_source[v], folder, on_changed);
            }
            if (good_meta.indexOf(v) < 0) {
                return;
            }
            if (meta.type == 'options') {
                item = folder.add(obj, v, meta.items)
            } else if (meta.type == 'number') {
                item = folder.add(obj, v, meta.min || -Infinity, meta.max || +Infinity, meta.step || 0.1)
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
        }
        else if (all_hooks.indexOf(v.replace("__meta__$$$$hook_", "")) > -1 && meta_source[v] && v.startsWith('__meta__$$$$hook_')) {
            console.log(meta_source[v]);
            meta = meta_source[v];
            var display = v.replace("__meta__$$$$hook_", "");
            meta_source[v][display] = meta.fn.bind(obj);
            item = folder.add(meta_source[v], display)
        }

        if (item && meta) {
            if (!meta.silent) {
                item.listen();
            }
            item.onChange((value) => {
                meta.onChange && meta.onChange(value);
                on_changed(obj, v, value);
            });
        }
    });
}

lit(test, 'test object');