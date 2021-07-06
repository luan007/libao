/**
 * 
 * another very tiny ecs, maybe
 * 
 * Mike Luan 2021
 * 
 */

import { changed, co_loop, ease, fetchYamlAsync, three, yaml, Vue } from "../../index";
import { defaultDatGUI, inspect, m_func, m_number, m_text, prep } from "../../prototyping/buildr/lite";
import { nanoid } from 'nanoid'
import * as _ from "lodash"
import * as res from "resolve-relative-url";
import * as nextComps from "../vue_comps/*.vue";
import * as ev2 from "eventemitter2";

var bus = new ev2.EventEmitter2({
    wildcard: true,
    maxListeners: 1000
});

prep();
export function cs_vue2ImportNext(prefix = "") {
    for (var i in nextComps) {
        if (i == 'default') continue;
        console.log(i);
        Vue.component(prefix + i, nextComps[i].default)
    }
}

function difference(object, base) {
    function changes(object, base) {
        return _.transform(object, function (result, value, key) {
            if (!_.isEqual(value, base[key])) {
                result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
            }
        });
    }
    return changes(object, base);
}


var _proto = {};
export var cs_comps = {};
export var cs_pure_data = {}; //modify this
export var cs_defaults_data = {}; //according to this

var cs_hidden_comps = {};

export function reg_component(key, constructor) {
    _proto[key] = constructor;
}

export function reg_component_by_type(creator) {
    _proto[creator.name] = creator;
}

export function build(chunk) {
    if (cs_comps[chunk.key]) {
        cs_comps[chunk.key].apply(chunk);
        console.log("Apply data to", chunk.key);
    }
    else if (chunk.type && _proto[chunk.type]) {
        new _proto[chunk.type](chunk.key, chunk);
        console.log("Creating new comp of", chunk.type, chunk.key);
    }
    else {
        console.error("Unknown component / type", chunk.type, chunk.key)
    }
}

/**
 * Returns some component
 * @param {*} key 
 * @returns {comp_base}
 */
export function cs_get(key) {
    return cs_comps[key];
}

/**
 * @template T
 * @param {*} key 
 * @param {new ()=>T} type
 * @returns {T}
 */
export function cs_get_key_comp(key, type) {
    return cs_comps[key];
}

/**
 * @template T
 * @param {*} key 
 * @param {new ()=>T} type
 * @returns {T}
 */
export function cs_get_comp(type) {
    for (var i in cs_comps) {
        if (cs_comps[i] instanceof type) {
            return cs_comps[i];
        }
    }
    console.warn("Component required by others", type.name);
    return null;
}

/**
 * 
 * @param {*} _key 
 * @param {*} cfg 
 * @param {(t: comp_base)=>any} ctr_fn 
 * @returns 
 */
export function comp_local(_key, cfg, ctr_fn) {
    var mgr = new (class extends comp_base {
        constructor(key, data) {
            super(key, data);
            this.data = {
                ...this.data,
                ...cfg.data ?? {}
            };
            this.eased = {
                ...this.eased,
                ...cfg.eased ?? {}
            };
            this.meta = {
                ...this.meta,
                ...cfg.meta ?? {}
            };
            this.fn = ctr_fn;
        }
        onInit() {
            super.onInit();
            this.fn(this);
        }
    })(_key, {});
    return mgr;
}


var rng = 0;
export class comp_base {
    constructor(key, data, no_registry = false) {
        if (key) {
            this.key = key;
            cs_comps[key] = this;
            this.has_data = !no_registry;
        }
        else {
            this.key = nanoid();
            cs_hidden_comps[key] = this;
        }


        /**
         * @member events 
         * 
         * 事件节点 (IoC Pattern)
         * 
         * [ **当前** ]Component独有的事件发射、接收器。
         */
        this.events = new ev2.EventEmitter2({
            wildcard: true
        });

        /**
         * @member bus 
         * 
         * 事件总线 (IoC Pattern)
         * 
         * [ **所有** ]Component共享的事件发射、接收器。
         */
        this.bus = bus;

        this.data = {
            viz: 1,
        }
        _.merge(this.data, data); //why? intellisense
        this.eased = {
            viz: 0
        };
        this.meta = {
            ...m_number('viz', { min: 0, max: 1, step: 0.2 })
        };
        co_loop((t, dt) => { this.update(t, dt) });
        this.inited = false;
        this.mgmt_loops = [];
    }

    changed(key, cb) {
        var prev = null;
        co_loop(() => {
            if (prev != this.data[key]) {
                prev = this.data[key];
                cb(this.data[key]);
            }
        });
    }

    co_loop(fn) {
        var lp = co_loop(fn); //creates a managed loop when viz > 0
        this.mgmt_loops.push(lp);
    }

    onInit() {
        if (this.has_data && this.data.tweak) {
            this.meta = {
                ...this.meta,
                ...m_func("[R] Reset", {
                    func: () => {
                        console.log("Ready!");
                        _.merge(this.data, cs_defaults_data[this.key]);
                    }
                }),
                ...m_func("[E] Capture Diff", {
                    func: () => {
                        var diff = difference(this.data, cs_defaults_data[this.key]);
                        var exp = {};
                        exp[this.key] = diff;
                        var str = yaml.dump(exp, {})
                        console.log(str);
                        navigator.clipboard.writeText(str)
                    }
                })
            };
        }
        this.data.tweak && inspect(this.data, this.constructor.name + "#" + this.key, this.meta);
        if (this.has_data) {
            cs_pure_data[this.key] = this.data; //link to data now
            cs_defaults_data[this.key] = this.no_defaults ? {} : _.cloneDeep(this.data);
        }
    }

    apply(data) {
        for (var i in data) {
            this.data[i] = data[i];
        }
    }

    update(t, dt) {
        if (!this.inited) {
            this.onInit();
            this.inited = true;
        }
        for (var i in this.eased) {
            if (this.data[i] != undefined) {
                this.eased[i] = ease(this.eased[i], this.data[i], this.data[i + "_e"] || 0.1, this.data[i + "_p"] || 0.00000001);
            }
        }

        this.mgmt_loops.forEach((v) => {
            v.enabled = this.eased.viz > 0;
        });
    }
}

export class comp_three extends comp_base {
    constructor(key, data) {
        super(key, data);
        this.g = new three.Group();
    }

    onInit() {
        super.onInit();
        //attach
        if (this.data.attach) {
            var target = cs_get(this.data.attach);
            target.g.add(this.g);
        }
    }

    update(t, dt) {
        super.update(t, dt);
        this.g.visible = this.eased.viz > 0;
    }
}

export class comp_vue extends comp_base {
    constructor(key, data, vue_data) {
        super(key, data);

        this.data = {
            viz: 0,
            threshold: 0.9,
            ...this.data
        };

        this.runtime = {};
        this.data.vdata = this.data.vdata || {};

        if (vue_data) {
            this.data.vdata = _.mergeWith(this.data.vdata, vue_data);
        }

        this.cfg = {
            selected: 0,
            viz: 0,
            offset: { x: 0, y: 0 },
            show: 0, //opacity, transition & so on
            disp: 0, //display: none?
        };

        this.vue_chunk = {
            vtype: this.data.vtype,
            data: {
                cfg: this.cfg, data: this.data.vdata, runtime: this.runtime
            }
        }

        this.eased = {
            ...this.eased
        };

        this.meta = {
            ...this.meta,
            ...m_number("viz", { min: 0, max: 1, step: 1 }),
        };

        co_loop(() => {
            this.cfg.show = this.eased.viz > this.data.threshold && this.data.viz > 0; //give a bit
            this.cfg.disp = this.eased.viz > 0 || this.data.viz > 0; //safe?
            this.cfg.viz = ease(this.cfg.viz, this.data.viz, 0.1, 0.0001);
            this.cfg.offset.x = this.data.vdata.x ?? 0;
            this.cfg.offset.y = this.data.vdata.y ?? 0;
        });

        ui_add_vue(this.vue_chunk);
    }
}


function macro(chunk) {
    var res = [];
    var clone = chunk;
    while (clone.length > 0) {
        var tbp = clone.shift(); //to be processed
        if (tbp.macro || tbp.macro_fn) {
            var fn = null;
            if (tbp.macro) {
                //load macro!
                fn = eval(tbp.macro);
            }
            else if (tbp.macro_fn) {
                //functional
                fn = cs_get_fn(tbp.macro_fn);
            }
            if (fn) {
                //
                var macro_res = fn(tbp.opts);
                var final = macro_res;
                if (tbp.template) {
                    //good, now apply them.
                    final = macro_res.map(v => {
                        return _.merge(
                            _.cloneDeep(tbp.template),
                            v
                        )
                    });
                }
                console.log("Exec Macro - Result", final);
                if (final) {
                    clone = final.concat(clone);
                }
            }
        }
        else {
            res.push(tbp); //out of loop
        }
    }
    // console.log(res);
    return res;
}

export async function cs_load_config_file(root, file) {
    //load seed
    console.log("Loading Config", root, file);
    var file = yaml.load(await (await fetch(res.default(file, root))).text());
    file && await cs_parse_config_file(file);
    if (file && Array.isArray(file.refs)) {
        for (var i = 0; i < file.refs.length; i++) {
            var j = file.refs[i];
            await cs_load_config_file(root, j);
        }
    }
}

export async function cs_parse_config_file(file) {
    if (Array.isArray(file)) {
        return await cs_load_config(components);
    }
    if (Array.isArray(file.configurations)) {
        for (var i = 0; i < file.configurations.length; i++) {
            var j = file.configurations[i];
            cs_load_config(file[j]);
        }
    }
}

export async function cs_load_config(components) {
    components = macro(components);
    components.forEach(v => {
        build(v)
    });
}


import { Router } from "routes";
import { ui_add_vue } from "../ui";
import { vue2ImportAll } from "../../fx";
function noop() { }

export class cs_comp_route_mgr extends comp_base {
    constructor(key, data) {
        super(key, data, true);

        this.router = Router();

        this.data = {
            route: "",
            routes: {}, //route, directives
            ...this.data
        };
        this.meta = {
            ...this.meta,
            ...m_text("route")
        }
    }

    applyRoute() {
        var u = new URL(this.data.route, "route://./");
        var path = u.pathname.substr('//.'.length);
        var match = this.router.match(path);
        window.u = u;
        if (match) {
            match = { ...match, hash: Object.fromEntries(new URLSearchParams(u.hash.replace("#", ""))), query: Object.fromEntries(u.searchParams) };
            //good?
            console.log("URL:", path, ' -> ', path, match);
            this.handler(match, this.data.routes[match.route]);
        }
        else {
            console.log(this.data.route);
        }
    }

    handler(match, route_cfg = {}) {
        var final = {};
        var mergeSet = (o, p, v) => (
            _.set(o, p, _.merge(_.get(o, p), v))
        )
        if (!route_cfg.preserve) {
            final = _.merge(final, cs_defaults_data);
        }
        function exec(settings, ctx) {
            settings = _.cloneDeep(settings);
            console.log(settings);
            if (settings.macro) {
                eval(settings.macro)(settings, ctx);
            }
            if (settings.apply) {
                for (var i in settings.apply) {
                    mergeSet(final, i, settings.apply[i])
                }
            }
            if (settings.set) {
                for (var i in settings.set) {
                    _.set(final, i, settings.set[i])
                }
            }
            if (settings.override) {
                for (var i in settings.override) {
                    _.set(cs_pure_data, i, settings.override[i])
                }
            }
            if (settings.filters) {
                settings.filters.forEach((f) => {
                    _.filter(final, f[0]).forEach(v => {
                        _.merge(v, f[1]);
                    });
                });
            }
        }
        if (route_cfg.ref) {
            for (var i = 0; i < route_cfg.ref.length; i++) {
                var r = route_cfg.ref[i];
                if (this.data.routes[r]) {
                    //apply this
                    exec(this.data.routes[r], false)
                }
            }
        }
        exec(route_cfg, match)
        _.merge(cs_pure_data, final);
    }

    onInit() {
        var meta2 = {};
        for (var i in this.data.routes) {
            ((i) => {
                if (this.data.routes[i].hidden) {
                    return;
                }
                meta2 = {
                    ...meta2,
                    ...m_func(i, {
                        func: () => {
                            this.data.route = i
                            console.log(i);
                        }
                    })
                };
            })(i);
        }
        inspect(meta2, "Route Ctrl", meta2);
        // super.onInit();
        super.onInit();
        for (var i in this.data.routes) {
            this.router.addRoute(i, noop);
            console.log("Router Reg", i)
        }
        this.co_loop((t) => {
            if (changed("route", this.data.route)) {
                this.applyRoute();
            }
        })

        setTimeout(() => {
            this.applyRoute();
        }, 500);

        //add safety check.
    }
}

export class cs_comp_cfg_exporter extends comp_base {
    constructor(key, data) {
        super(key, data, true);

        //https://gist.github.com/Yimiprod/7ee176597fef230d1451
        inspect(
            {},
            "kommander",
            {
                ...m_func("[R*] Reset All", {
                    func() {
                        _.merge(cs_pure_data, cs_defaults_data);
                    }
                }),
                ...m_func("[E] Capture Diff", {
                    func() {
                        var diff = difference(cs_pure_data, cs_defaults_data);
                        console.log("Diff", diff)
                        var str = yaml.dump(diff, {})
                        console.log(str);
                        navigator.clipboard.writeText(str)
                    }
                })
            }
        )
    }
}

reg_component("route_mgr", cs_comp_route_mgr)
reg_component("cfg_exporter", cs_comp_cfg_exporter)
reg_component("vue", comp_vue);
reg_component("three", comp_three);
