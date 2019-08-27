import yaml from 'yaml'
import jsonQuery from 'json-query'
import jsonPath from 'jsonpath'
import deepmerge from "deepmerge";
const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray

const SHARED_CTX = false; //danger
const ENGINE_TAG = Math.random();
const FUNCTION_TAG = ENGINE_TAG + 1;

const PRESERVED = [
    "state", "base", "children"
];

export var world = {
    registry: {},
    components: {},
    env: {},
    instances: [],
    prev_env: {},
    prev_instances: [],
    global_opts: {}
};

export function register_global_opts(o) {
    for (var i in o) {
        world.global_opts[i] = o[i];
    }
}

function _build_common_ctx(world, instance, global_opts, _comp) {
    var ctx = {
        ...global_opts
    };
    ctx.env = world.env;
    ctx.prev_env = world.prev_env;
    ctx.state = instance.state;
    ctx.prev_state = instance.prev_state;
    ctx.def = instance.def;
    ctx.instance = instance;
    if (_comp) {
        ctx.comp = _comp;
    }
    return ctx;
}

function _apply_inherit(item, ref) {
    ref = ref || [];
    // var cloned = deepmerge({}, item);
    // cloned.base = undefined;
    var root = {};
    var bases = (item.base || "").trim().split(",").filter((v) => {
        return world.registry[v.trim()];
    }).map((v) => {
        ref.push(v.trim());
        return world.registry[v.trim()];
    });
    for (var i = 0; i < bases.length; i++) {
        root = deepmerge(root, _apply_inherit(bases[i], ref), {
            arrayMerge: overwriteMerge
        });
    }
    return deepmerge(root, item, {
        arrayMerge: overwriteMerge
    });
}

export function register_class(key, item) {
    // var obj = {};
    world.registry[key] = _apply_inherit(item, []);
}

export function register_env(env) {
    world.env = deepmerge(world.env, env || {}, {
        arrayMerge: overwriteMerge
    });
}

export function register_component(key, in_comp_class) {
    world.components[key] = in_comp_class; //support ECS model for better efficiency
    //a. input: class, instanciate during init
    //b. input: object, pure call back (fn based) - fast
}

function _instanciate_component(type, ctx) {
    if (world.components[type] && typeof (world.components[type]) == 'function') {
        var c = new world.components[type](ctx); //construct new comp
        c.raw_data = ctx.comp;
        ctx.comp = expand_object(ctx.comp, ctx);
        for (var i in ctx.comp) {
            c[i] = ctx.comp[i];
        }
        c.init && c.init(ctx);
        c.tag = ENGINE_TAG;
        return c;
    }


    var _raw_data = ctx.comp;
    var raw = {
        raw_data: {
            ...ctx.comp
        }
    }
    for (var i in ctx.comp) {
        raw[i] = ctx.comp[i];
    }
    if (world.components[type] && typeof (world.components[type]) == 'object') {
        for (var i in world.components[type]) {
            raw[i] = world.components[type][i]; //attach
        }
    } else if (typeof (ctx.comp) == 'object') {
        //do nothing
    } else {
        //console.warn("Component type unknown - ", type);
        return ctx.comp;
    }

    //call init procedure
    ctx.comp = expand_object(ctx.comp, ctx);
    ctx.raw_data = raw.raw_data;
    raw.init && raw.init(ctx);
    return raw;
}

//expand $eval tag
export function expand_object(obj, ctx) {
    //currently supports 1 layer - execution
    var evaluated = {};
    for (var i in obj) {
        if (obj[i] && (typeof (obj[i])).toLowerCase() == 'function' && obj[i].tag == ENGINE_TAG) {
            evaluated[i] = obj[i](ctx);
        } else {
            evaluated[i] = obj[i];
        }
    }
    return evaluated;
}

function _instanciate(type, item) {
    if (item.children) {
        for (var i in item.children) {
            item.children[i] = _instanciate(item.children[i].type, item.children[i]);
        }
    }
    var children = item.children;
    var instance = {};
    item = item || {};
    delete item.type;
    delete item.children;
    if (!world.registry[type]) {
        console.error("Instanciate Failed, type not found (", type, ")");
        return;
    }
    // item.type = type;
    instance = deepmerge(instance, world.registry[type].state || {}, {
        arrayMerge: overwriteMerge
    });
    instance = deepmerge(instance, item), {
        arrayMerge: overwriteMerge
    };

    var comps = {};
    var _built_instance = {
        state: instance,
        prev_state: instance,
        components: comps,
        def: world.registry[type],
        type: type
    }

    if (children) {
        _built_instance.children = children;
    }

    for (var c in world.registry[type]) {
        if (PRESERVED.indexOf(c) >= 0) continue;
        var comp_instance = _instanciate_component(
            c, _build_common_ctx(world, _built_instance, world.global_opts, world.registry[type][c])
        );
        comps[c] = (comp_instance);
    }

    return _built_instance;
}

export function instanciate(type, item) {
    world.instances.push(_instanciate(type, item));
}

export function parseYaml(str) {
    const evaler = {
        tag: '!eval',
        resolve(doc, cst) {
            return {
                inline_eval: true,
                code: cst.strValue
            }
        }
    }
    const fnevaler = {
        tag: '!fn',
        resolve(doc, cst) {
            //   const match = cst.strValue.match(/^\/([\s\S]+)\/([gimuy]*)$/)
            //   return new RegExp(match[1], match[2])
            return {
                fn_eval: true,
                code: cst.strValue
            }
        }
    }
    const methodeval = {
        tag: '!method',
        resolve(doc, cst) {
            //   const match = cst.strValue.match(/^\/([\s\S]+)\/([gimuy]*)$/)
            //   return new RegExp(match[1], match[2])
            return {
                method_eval: true,
                code: cst.strValue
            }
        }
    }

    var docs =
        yaml.parseAllDocuments(
            str, {
                customTags: [
                    evaler,
                    fnevaler,
                    methodeval
                ]
            }
        );


    const expander = `
        var state = ctx.state;
        var env = ctx.env;
        var def = ctx.def;
        var instance = ctx.instance;
        var prev_env = ctx.prev_env;
        var prev_state = ctx.prev_state;
        var comp = ctx.comp;
    `
    for (var q = 0; q < docs.length; q++) {
        docs[q] = docs[q].toJSON();
        jsonPath.apply(
            docs[q],
            '$..[?(@.inline_eval)]',
            (x) => {
                var nf = new Function("ctx", expander + "return " + x.code);
                nf.tag = ENGINE_TAG;
                return nf;
            }
        )
        jsonPath.apply(
            docs[q],
            '$..[?(@.fn_eval)]',
            (x) => {
                var nf = new Function("ctx", expander + x.code);
                nf.tag = ENGINE_TAG;
                return nf;
            }
        )
        jsonPath.apply(
            docs[q],
            '$..[?(@.method_eval)]',
            (x) => {
                var nf = new Function("ctx", expander + x.code);
                nf.tag = FUNCTION_TAG;
                return nf;
            }
        )
    }



    for (var q = 0; q < docs.length; q++) {
        if (Array.isArray(docs[q])) {
            //instances
            for (var i = 0; i < docs[q].length; i++) {
                docs[q][i] && instanciate(docs[q][i].type, docs[q][i]);
            }
        } else {
            for (var i in docs[q]) {
                if (i == 'env') {
                    register_env(docs[q][i]);
                } else {
                    register_class(i, docs[q][i]);
                }
            }
        }
    }
    return docs;
}

function _update_instance(instance, opts) {

    //bottom up?
    if (instance.children) {
        for (var i in instance.children) {
            _update_instance(instance.children[i], opts);
        }
    }
    // console.log('update', instance);


    var ctx = SHARED_CTX ? _build_common_ctx(world, instance, opts) : undefined;

    for (var i in instance.components) {
        ctx = SHARED_CTX ? ctx : _build_common_ctx(world, instance, opts); //safer - slower
        //update components
        var c = instance.components[i];
        if (c && c.tag == ENGINE_TAG) {
            ctx.raw_data = c.raw_data;
            ctx.comp = expand_object(ctx.raw_data, ctx);
            for (var i in ctx.comp) {
                c[i] = ctx.comp[i];
            }
            c.update && c.update(ctx);
        } else if (typeof (c) == 'object') {
            //state less component
            ctx.raw_data = c.raw_data;
            ctx.comp = expand_object(ctx.raw_data, ctx);
            for (var i in ctx.comp) {
                c[i] = ctx.comp[i];
            }
            ctx.comp = c; //fix
            c.update && c.update(ctx);
        } else if (typeof (c) == 'function') {
            c(ctx);
        }
    }
    for (var i in instance.components) {
        ctx = SHARED_CTX ? ctx : _build_common_ctx(world, instance, opts); //safer - slower
        var c = instance.components[i];
        if (c.late_update && (typeof (c.late_update)).toLowerCase() == 'function') {
            ctx.comp = c; //fix
            c.late_update(ctx);
        }
    }
}


export function tick(_opts) {
    // world.prev_instances = JSON.parse(JSON.stringify(world.instances));

    var opts = {
        ..._opts,
        ...world.global_opts
    }


    for (var i = 0; i < world.instances.length; i++) {
        var ctx = _build_common_ctx(world, world.instances[i], opts);
        _update_instance(world.instances[i],
            ctx
        );
        world.instances[i].prev_state = JSON.parse(JSON.stringify(ctx.state));
    }
    world.prev_env = JSON.parse(JSON.stringify(world.env));
}

// window.tick = tick;
// window.world = world;