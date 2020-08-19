//inner peace - minimal particle system

// //one array is enough for us
// export function allocate(capacity) {
//     return new Array(capacity);
// }

import * as glMatrix from "gl-matrix";

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
        def: [],
        emit: [],
        main: [],
        kill: []
    };
    var runtime = {
        t: 0,
        dt: 0,
        capacity: capacity,
        updated: 0,
        program: program,
        spaces: spaces,
        alive: alive,
        container: container,
        store: {},
        build: function () {
            runtime_run_pgm_on_index(runtime, -1, runtime.store, program.def, 'def');
            while (container.length < capacity) {
                spaces.push(container.length);
                // container.push(obj);
                container.push(container.length);
                alive.push(0);
            }
        },
        emit: function () {
            //allocate one particle
            if (spaces.length > 0) {
                let i = spaces.pop();
                alive[i] = 1;
                runtime_run_pgm_on_index(runtime, i, runtime.store, program.emit, 'emit');
                return container[i];
            }
            return null;
        },
        emitBatch: function (count) {
            for (var i = 0; i < count; i++) {
                let q = runtime.emit();
                if (q == null) return i;
            }
            return count;
        },
        killAt: function (i) {
            if (alive[i] > 0) {
                //ok to kill
                alive[i] = 0;
                spaces.push(i);
                runtime_run_pgm_on_index(runtime, i, runtime.store, program.kill, 'kill');
                return true;
            }
            return false;
        },
        kill: function (p) {
            return runtime.killAt(container.indexOf(p));
        },
        tick: function (t, dt) {
            runtime.t = t;
            runtime.dt = dt;
            runtime.updated = 0;
            for (var i = 0; i < container.length; i++) { //O(n) but not perfect
                if (!alive[i]) continue; //cost too much, maybe - but for now it seems enough
                runtime_run_pgm_on_index(runtime, i, runtime.store, program.main, 'main');
                runtime.updated++;
            }
        }
    }
    return runtime;
}

export function attach_avp(runtime) {
    var params = {
    };

    runtime.program.a = runtime.program.a || [];
    runtime.program.v = runtime.program.v || [];
    runtime.program.p = runtime.program.p || [];

    runtime.program.def.push(function (store, i, runtime, stage) {
        store.a = new Float32Array(runtime.capacity * 3);
        store.v = new Float32Array(runtime.capacity * 3);
        store.p = new Float32Array(runtime.capacity * 3);
    });

    runtime.program.main.push(function (store, i, runtime, stage) {
        var t = runtime.t;
        var dt = runtime.dt;
        var off = i * 3;
        store.a[off + 0] = 0;
        store.a[off + 1] = 0;
        store.a[off + 2] = 0;
        runtime_run_pgm_on_index(runtime, i, store, runtime.program.a, 'a')
        store.v[off + 0] += store.a[off + 0] * dt;
        store.v[off + 1] += store.a[off + 1] * dt;
        store.v[off + 2] += store.a[off + 2] * dt;
        runtime_run_pgm_on_index(runtime, i, store, runtime.program.v, 'v')
        store.p[off + 0] += store.v[off + 0] * dt;
        store.p[off + 1] += store.v[off + 1] * dt;
        store.p[off + 2] += store.v[off + 2] * dt;
        runtime_run_pgm_on_index(runtime, i, store, runtime.program.p, 'p')
    });

    return params;
}

export function attach_param(runtime, key, default_value = 0) {
    runtime.program.def.push(function (p, i, runtime, stage) {
        p[key] = JSON.parse(JSON.stringify(default_value));
    });
}

export function attach_shared_param(runtime, key, shared_obj = {}) {
    runtime.program.def.push(function (p, i, runtime, stage) {
        p[key] = shared_obj;
    });
}

export function attach_life(runtime, { do_not_stop = true }) {
    var params = { do_not_stop: do_not_stop };
    var reset = function (store, i, runtime, stage) {
        var off = i * 2;
        store.life[off] = 1;
        store.life[off + 1] = 0.1;
    };
    runtime.program.def.push(function (store, i, runtime) {
        store.life = new Float32Array(runtime.capacity * 2);
    });
    runtime.program.emit.push(reset);
    runtime.program.main.push(function (store, i, runtime, stage) {
        var off = i * 2;
        var l = store.life[off];
        var vl = store.life[off + 1];
        l -= vl * runtime.dt;
        l = l <= 0 ? 0 : l; //clamp
        store.life[off] = l;
        store.life[off + 1] = vl;
        var dead = l <= 0;
        if (dead) {
            runtime.killAt(i);
            if (!params.do_not_stop) ABORT;
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

export var def = on_def;
export var act = on_seq;
export var on = on_seq;