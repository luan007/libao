//inner peace - minimal particle system

// //one array is enough for us
// export function allocate(capacity) {
//     return new Array(capacity);
// }

import * as glMatrix from "gl-matrix";
import { loop } from "../core";

const MIN_FPS_INT = 1 / 20 * 1000;

export var vec2 = glMatrix.vec2;
export var vec3 = glMatrix.vec3;
export var vec = glMatrix.vec3;
export var vec4 = glMatrix.vec4;
export var mat2 = glMatrix.mat2;
export var mat2d = glMatrix.mat2d;
export var mat3 = glMatrix.mat3;
export var mat4 = glMatrix.mat4;
export var mat = glMatrix.mat4;

export var VEC3_BUF = [0, 0, 0];
export var VEC_BUF = [0, 0, 0];
export var VEC2_BUF = [0, 0];
export var VEC4_BUF = [0, 0, 0, 0];

const ABORT = -999;

function runtime_run_pgm_on_index(runtime, i, p, pgm_seq, seq_name) {
    for (var j = 0; j < pgm_seq.length; j++) {
        if (pgm_seq[j](p, i, runtime, seq_name) == ABORT) {
            return ABORT; //something happened;
        }
    }
}

export function form(capacity = 1000) {
    var container = [];
    var spaces = [];
    var alive = [];
    var program = {
        tick: [],       //called for runtime only (on_tick)
        built: [],      //called for runtime only (on_built)
        def: [],        //called for each particle [build]
        emit: [],       //called for each particle (on_emit)
        main: [],       //called for each particle (main_seq)
        postprocess: [],//when enabled, called for each particle no matter real of fake
        kill: []        //called for each particle (on_kill)
    };
    var runtime = {
        t: 0,
        dt: 0,
        time_mult: 1,
        capacity: capacity,
        updated: 0,
        program: program,
        spaces: spaces,
        alive: alive,
        container: container,
        bag: {},

        _built: false,
        build: function () {
            while (container.length < capacity) {
                spaces.push(container.length);
                let obj = {};
                // container.push(obj);
                runtime_run_pgm_on_index(runtime, container.length, obj, program.def, 'def');
                container.push(obj);
                alive.push(0);
            }
            runtime_run_pgm_on_index(runtime, container.length, null, program.built, 'built');
            runtime._built = true;
        },
        emit: function () {
            //allocate one particle
            if (!runtime._built) throw 'Please call engine.build() before first action';
            if (spaces.length > 0) {
                let i = spaces.pop();
                alive[i] = 1;
                runtime_run_pgm_on_index(runtime, i, container[i], program.emit, 'emit');
                return container[i];
            }
            return null;
        },
        emitBatch: function (count = runtime.capacity) {
            if (!runtime._built) throw 'Please call engine.build() before first action';
            for (var i = 0; i < count; i++) {
                let q = runtime.emit();
                if (q == null) return i;
            }
            return count;
        },
        killAt: function (i) {
            if (!runtime._built) throw 'Please call engine.build() before first action';
            if (alive[i] > 0) {
                //ok to kill
                alive[i] = 0;
                spaces.push(i);
                runtime_run_pgm_on_index(runtime, i, container[i], program.kill, 'kill');
                return true;
            }
            return false;
        },
        kill: function (p) {
            if (!runtime._built) throw 'Please call engine.build() before first action';
            return runtime.killAt(container.indexOf(p));
        },
        tick: function (t, dt) {
            if (!runtime._built) throw 'Please call engine.build() before first action';
            runtime.t = t || (Date.now() / 1000);
            runtime.dt = dt || (runtime.t - (runtime.prevT || runtime.t));
            runtime.dt = runtime.dt > MIN_FPS_INT ? MIN_FPS_INT : runtime.dt; //limit this to reasonable value, or verlet will crash
            runtime.prevT = runtime.t;

            runtime.t *= runtime.time_mult;
            runtime.dt *= runtime.time_mult;
            // runtime.prevT *= runtime.time_mult;

            runtime.updated = 0;
            for (var i = 0; i < capacity; i++) { //O(n) but not perfect
                if (!alive[i]) continue; //cost too much, maybe - but for now it seems enough
                let p = container[i];
                runtime_run_pgm_on_index(runtime, i, p, program.main, 'main');
                runtime.updated++;
            }
            //note: runtime.container vs container - 
            //container is localized in mem while runtime.container contains ALL particle
            //TODO: reconsider this maybe
            if (runtime.program.postprocess.length > 0) {
                for (var i = 0; i < runtime.container.length; i++) { //O(n) but not perfect
                    let p = runtime.container[i];
                    runtime_run_pgm_on_index(runtime, i, p, program.postprocess, 'postprocess');
                    runtime.updated++;
                }
            }

            for (var i = 0; i < runtime.program.tick.length; i++) {
                runtime.program.tick[i](runtime, t, dt);
            }
        }
    }
    return runtime;
}

/**
 * physical acc / vel / pos
 */
export function attach_avp(runtime) {
    var params = {
    };

    runtime.program.a = runtime.program.a || [];
    runtime.program.v = runtime.program.v || [];
    runtime.program.p = runtime.program.p || [];

    runtime.program.def.push(function (p, i, runtime, stage) {
        p.a = [0, 0, 0];
        p.v = [0, 0, 0];
        p.p = [0, 0, 0];
    });

    runtime.program.main.push(function (p, i, runtime, stage) {
        var t = runtime.t;
        var dt = runtime.dt;
        p.a[0] = 0;
        p.a[1] = 0;
        p.a[2] = 0;
        runtime_run_pgm_on_index(runtime, i, p, runtime.program.a, 'a')
        p.v[0] += p.a[0] * dt;
        p.v[1] += p.a[1] * dt;
        p.v[2] += p.a[2] * dt;
        runtime_run_pgm_on_index(runtime, i, p, runtime.program.v, 'v')
        p.p[0] += p.v[0] * dt;
        p.p[1] += p.v[1] * dt;
        p.p[2] += p.v[2] * dt;
        runtime_run_pgm_on_index(runtime, i, p, runtime.program.p, 'p')
    });

    return params;
}

/**
 * physical rotations (acc / vel / pos), requires avp pass!
 */
export function attach_rarvr(runtime) {
    var params = {
    };
    runtime.program.ra = runtime.program.ra || [];
    runtime.program.rv = runtime.program.rv || [];
    runtime.program.rp = runtime.program.rp || [];
    runtime.program.def.push(function (p, i, runtime, stage) {
        p.ra = [0, 0, 0];
        p.rv = [0, 0, 0];
        p.rp = [0, 0, 0];
    });
    runtime.program.a.push(function (p, i, runtime, stage) {
        p.ra[0] = 0;
        p.ra[1] = 0;
        p.ra[2] = 0;
    });
    runtime.program.v.push(function (p, i, runtime, stage) {
        var dt = runtime.dt;
        p.rv[0] += p.ra[0] * dt;
        p.rv[1] += p.ra[1] * dt;
        p.rv[2] += p.ra[2] * dt;
    });
    runtime.program.p.push(function (p, i, runtime, stage) {
        var dt = runtime.dt;
        p.rp[0] += p.rv[0] * dt;
        p.rp[1] += p.rv[1] * dt;
        p.rp[2] += p.rv[2] * dt;
    });
    return params;
}

export function attach_looper(runtime, time_mult = 1) {
    runtime.time_mult = time_mult;
    function tick() {
        runtime.tick();
    }
    loop(tick);
    return tick;
}

export function attach_perf_tag(runtime, key, { groups = 5, auto_tag = true }) {
    var params = { groups: groups, auto_tag: auto_tag };
    runtime.tags = runtime.tags || {};
    runtime.tags[key] = 0;
    runtime.program.tick.push(() => {
        runtime.tags[key]++;
        runtime.tags[key] = runtime.tags[key] % params.groups;
    });
    runtime.program.def.push(function (p, i, runtime, stage) {
        p.tags = p.tags || {};
        p.tags[key] = -1;
    });
    var seq = 0;
    runtime.program.emit.push(function (p, i, runtime, stage) {
        if (params.auto_tag) {
            p.tags[key] = seq++;
            seq = seq % params.groups;
        }
    });
    return params;
}

export function has_shadow_tag(key, runtime, p) {
    return p.is_shadow && p.tags.shadow_tag == key;
}

export function has_perf_tag(key, runtime, p) {
    var cur = runtime.tags[key];
    var me = p.tags[key];
    return cur == me;
}

export function attach_param(runtime, key, default_value = 0) {
    runtime.program.def.push(function (p, i, runtime, stage) {
        p[key] = p[key] || JSON.parse(JSON.stringify(default_value));
    });
}

export function attach_shared_param(runtime, key, shared_obj = {}) {
    runtime.program.def.push(function (p, i, runtime, stage) {
        p[key] = shared_obj;
    });
}

export function attach_life(runtime, { do_not_stop = true }) {
    var params = { do_not_stop: do_not_stop };
    var reset = function (p, i, runtime, stage) {
        p.l = 1;
        p.vl = 0.1;
        p.dead = false;
    };
    runtime.program.def.push(reset);
    runtime.program.emit.push(reset);
    runtime.program.main.push(function (p, i, runtime, stage) {
        p.l -= p.vl * runtime.dt;
        p.l = p.l <= 0 ? 0 : p.l; //clamp
        p.dead = p.l <= 0;
        if (p.dead) {
            runtime.killAt(i);
            if (!params.do_not_stop) ABORT;
        }
    });
    return params;
}

export function attach_shadowing(runtime, { shadow_tag = null, extra_def = () => { }, boost = 0, grouping = 0 }) {
    var params = { boost, grouping, extra_def, shadow_tag };
    var inserted = [];

    runtime.program.shadow = runtime.program.shadow || [];
    on_built(runtime, () => {
        for (var i = 0; i < boost; i++) {
            var obj = {};
            obj.is_shadow = true;
            obj.id = i;
            obj.tags = obj.tags || {};
            obj.tags.shadow_tag = shadow_tag;
            obj.rnd = Math.random();
            obj.real = runtime.container[i % runtime.capacity];
            obj.pid = i % runtime.capacity;
            obj.global_id = runtime.container.length + inserted.length;
            runtime_run_pgm_on_index(runtime, runtime.container.length + inserted.length, obj, runtime.program.def, 'def'); //call def only
            extra_def(obj, i, runtime);
            obj.shadow_grp = grouping > 0 ? (i % grouping) : 0;
            inserted.push(obj);
        }
        runtime.container = runtime.container.concat(inserted);
    });

    on_tick(runtime, () => {
        for (var i = 0; i < inserted.length; i++) {
            runtime_run_pgm_on_index(runtime,
                inserted[i].global_id, inserted[i],
                runtime.program.shadow, 'shadow'); //call def only
        }
    });

    return params;
}


export function attach(cb_returns_hook, seq, runtime, params) {
    if (Array.isArray(seq)) return attach_multi(cb_returns_hook, seq, runtime, params);
    runtime.program[seq].push(
        cb_returns_hook(params)
    )
    return params;
}
export function attach_multi(cb_returns_hook, seq_array, runtime, params) {
    var fn = cb_returns_hook(params);
    for (var i = 0; i < seq_array.length; i++) {
        runtime.program[seq_array[i]].push(
            fn
        )
    }
    return params;
}
export function on_def(runtime, def_fn) {
    runtime.program["def"].push(def_fn);
}
export function on_main(runtime, main_fn) {
    runtime.program["main"].push(main_fn);
}
export function on_emit(runtime, emit_fn) {
    runtime.program["emit"].push(emit_fn);
}
export function on_kill(runtime, kill_fn) {
    runtime.program["kill"].push(kill_fn);
}
export function on_seq(runtime, seq, fn) {
    runtime.program[seq].push(fn);
}
export function build(runtime) {
    return runtime.build();
}

export function on_built(runtime, main_fn) {
    runtime.program["built"].push(main_fn);
}
export function on_tick(runtime, main_fn) {
    runtime.program["tick"].push(main_fn);
}

export var def = on_def;
export var act = on_seq;
export var on = on_seq;