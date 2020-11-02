import * as storm from "./storm";
import { curl3d, n3d, rrand, ease } from "../core";
import { three } from "..";

var N3BUF = [0, 0, 0];

export function vec3_fx_normalize(target) {
    storm.vec.normalize(target, target);
    return target;
}

export function vec3_fx_limit(target, lim) {
    var len = storm.vec.len(target);
    if (len > lim) {
        var scaler = lim / len;
        storm.vec.scale(target, target, scaler);
    }
    return target;
}

export function vec3_fx_curl(x, y, z, eps) {
    return curl3d(x, y, z, eps);
}

export function vec3_fx_attract_force(a, pos, attractor, G = 1, lim_d = 0.001, skip_inside = true) {
    //gm1m2 / r2
    var dist = storm.vec.sqrDist(pos, attractor);
    if (skip_inside && dist < lim_d) return a; //dont act
    var scaleF = -G / Math.max(lim_d, dist); //just in case
    //vectorF = normalize(attractor - pos) * scaleF
    var dir = storm.vec.set(N3BUF, 0, 0, 0);
    storm.vec.scaleAndAdd(a, a,
        storm.vec.normalize(dir,
            storm.vec.sub(dir, pos, attractor)
        ),
        scaleF);
    return a;
}

export function vec3_fx_ease_force(a, from, to, lim_max = 10, factor = 0.1, constant) {
    //gm1m2 / r2
    var dir = storm.vec.set(N3BUF, 0, 0, 0);
    storm.vec.sub(dir, to, from);
    if (lim_max > 0) {
        var len = constant || storm.vec.len(dir) * factor;
        if (len < 0.00001) return a;
        if (lim_max > 0) {
            len = len > lim_max ? lim_max : len;
        }
        storm.vec.scaleAndAdd(a, a,
            storm.vec.normalize(dir, dir),
            len);
    }
    else {
        a[0] += dir[0] * factor;
        a[1] += dir[1] * factor;
        a[2] += dir[2] * factor;
    }
    return a;
}

export function vec3_fx_perlin3(x, y, z) {
    N3BUF[0] = n3d(-x, y, z);
    N3BUF[1] = n3d(y, -x, z);
    N3BUF[2] = n3d(z, x, -y);
    return N3BUF;
}

export function vec3_fx_apply_rotation(rot, target, force_or_arr) {
    if (target[0] + target[1] + target[2] == 0) {
        target[0] = 1;
        target[1] = 1;
        target[2] = 1;
    }
    var l = storm.vec.len(target);
    storm.vec.normalize(target, target);
    if (Array.isArray(force_or_arr)) {
        storm.vec.rotateX(target, target, storm.VEC3_BUF, rot[0] * force_or_arr[0])
        storm.vec.rotateY(target, target, storm.VEC3_BUF, rot[1] * force_or_arr[1])
        storm.vec.rotateZ(target, target, storm.VEC3_BUF, rot[2] * force_or_arr[2])
    }
    else {
        storm.vec.rotateX(target, target, storm.VEC3_BUF, rot[0] * force_or_arr)
        storm.vec.rotateY(target, target, storm.VEC3_BUF, rot[1] * force_or_arr)
        storm.vec.rotateZ(target, target, storm.VEC3_BUF, rot[2] * force_or_arr)
    }
    storm.vec.scale(target, target, l);
    return target;
}

export function vec3_fx_scale(target, s) {
    storm.vec.scale(target, target, s);
    return target;
}

export var vec3_fx_damper = vec3_fx_scale;

export function attach_fx_curl_rotation_force(runtime, {
    stage = 'a', target = 'a', grouping = 5,
    power = 1,
    scaler = [0.01, 0.01, 0.01], time = [0.1, 0.1, 0.1], strength = [2, 2, 2] }) {
    var params = {
        stage, target, grouping,
        scaler,
        time,
        strength,
        power
    };
    var rnd = Math.random();
    var key = 'curl_' + rnd;
    storm.attach_perf_tag(runtime, key, { groups: grouping })
    function update(p) {
        if (storm.has_perf_tag(key, runtime, p)) {
            var curl = curl3d(
                p.p[0] * params.scaler[0] + runtime.t * params.time[0],
                p.p[1] * params.scaler[1] + runtime.t * params.time[1],
                p.p[2] * params.scaler[2] + runtime.t * params.time[2], 1);
            storm.vec.copy(p[params.target], curl); //this is the key
            storm.vec.scale(p[params.target], p[params.target], params.power); //this is the key
            vec3_fx_apply_rotation(curl, p[params.target], params.strength)
        }
    }
    storm.on(runtime, stage, update);
    return params;
}

export function attach_fx_curl_rotation_force_individual(runtime, {
    stage = 'a', target = 'a', grouping = 5,
    prefix = "curl_",
    power = 1,
    scaler = [0.01, 0.01, 0.01], time = [0.1, 0.1, 0.1], strength = [2, 2, 2] }) {
    var params = {
        stage, target, grouping
    };
    var rnd = Math.random();
    var key = 'curl_' + rnd;
    storm.attach_perf_tag(runtime, key, { groups: grouping })
    var key_scaler = prefix + "scaler";
    var key_time = prefix + "time";
    var key_strength = prefix + "strength";
    var key_power = prefix + "power";
    storm.attach_param(runtime, key_scaler, scaler)
    storm.attach_param(runtime, key_time, time)
    storm.attach_param(runtime, key_strength, strength)
    storm.attach_param(runtime, key_power, power)
    function update(p) {
        p.curl_cache = p.curl_cache || [0, 0, 0];
        if (!storm.has_perf_tag(key, runtime, p) || p[key_power] == 0) {
            storm.vec.copy(p[params.target], p.curl_cache);
            return;
        }
        var curl = curl3d(
            p.p[0] * p[key_scaler][0] + runtime.t * p[key_time][0],
            p.p[1] * p[key_scaler][1] + runtime.t * p[key_time][1],
            p.p[2] * p[key_scaler][2] + runtime.t * p[key_time][2], 1);
        storm.vec.copy(p[params.target], curl); //this is the key
        storm.vec.scale(p[params.target], p[params.target], p[key_power] / grouping); //this is the key
        vec3_fx_apply_rotation(curl, p[params.target], p[key_strength])
        storm.vec.copy(p.curl_cache, p[params.target]);
    }
    storm.on(runtime, stage, update);
    return params;
}

export function attach_fx_damper(runtime, {
    stage = 'v',
    target = 'v',
    damper = 0.9,
    limit = -1
}) {

    var params = {
        stage,
        target,
        damper,
        limit
    };

    var damper_overriden = typeof (params.damper) == 'string';
    var limit_overriden = typeof (params.limit) == 'string';
    if (damper_overriden) {
        storm.attach_param(runtime, params.damper, 0.98);
    }
    if (limit_overriden) {
        storm.attach_param(runtime, params.limit, -1);
    }

    function update(p) {
        let damp = damper_overriden ? p[params.damper] : params.damper;
        let lim = limit_overriden ? p[params.limit] : params.limit;
        if (damp != -1) {
            vec3_fx_damper(p[params.target], damp);
        }
        if (lim != -1) {
            vec3_fx_limit(p[params.target], lim);
        }
    }

    storm.on(runtime, stage, update);

    return params;
}

export function attach_fx_targeted_vec(runtime, {
    stage = 'main',
    prefix = null,
    target = "v",
    grouping = 2,
    default_e = 0.3
}) {
    var key = prefix || target;
    var key_force = key + "_target_e";
    var key_target = key + "_target";
    var key_src = key + "_src_ref";
    var key_l2_fac = key + "_l2_smooth";
    var perfKey = "target_" + Math.random();
    storm.attach_perf_tag(runtime, perfKey, { groups: grouping })
    storm.attach_param(runtime, key_force, default_e);
    storm.attach_param(runtime, key_target, [0, 0, 0]);
    storm.attach_param(runtime, key_src, "");
    storm.attach_param(runtime, key_l2_fac, 0);

    storm.on(runtime, stage, (p) => {
        if (!storm.has_perf_tag(perfKey, runtime, p)) return;
        if (p[key_src]) { //driver
            //bind to target
            if (p[key_l2_fac] > 0 && p[key_l2_fac] != 1) {
                vec3_fx_ease_force(p[key_target], p[key_target], p[p[key_src]], -1, p[key_l2_fac])
            }
            else {
                storm.vec.copy(p[key_target], p[p[key_src]])
            }
        }
        if (p[key_force] > 0) {
            vec3_fx_ease_force(p[target], p[target], p[key_target], -1, p[key_force]);
        }
    });
}

export function attach_eased_vec3(runtime, {
    stage = 'main',
    key = "ev3",
    e = 0.1,
    base = [0, 0, 0],
    target = [0, 0, 0],
    reset_on_emit = true,
    grouping = -1
}) {

    var buf = [0, 0, 0];
    var params = {
        key,
        stage, e, base,
        target,
        grouping,
        reset_on_emit
    };

    storm.on_def(runtime, (p) => {
        p[params.key + "_value"] = [0, 0, 0];
        p[params.key + "_target"] = [0, 0, 0];
        p[params.key + "_e"] = params.e;
        storm.vec.copy(p[params.key + "_value"], params.base)
        storm.vec.copy(p[params.key + "_target"], params.target)
    });

    storm.on_emit(runtime, (p) => {
        if (params.reset_on_emit) {
            storm.vec.copy(p[params.key + "_value"], params.base)
            storm.vec.copy(p[params.key + "_target"], params.target)
            p[params.key + '_e'] = params.e;
        }
    });

    var r = Math.random();
    key = "ease_" + r; //TODO:FIX THIS
    if (grouping >= 1) {
        storm.attach_perf_tag(runtime, key, { groups: grouping });
        storm.on(runtime, params.stage, (p) => {
            if (!storm.has_perf_tag(key, runtime, p)) return;
            storm.vec.scaleAndAdd(buf, p[params.key + '_target'], p[params.key + '_value'], -1);
            storm.vec.scaleAndAdd(p[params.key + '_value'], p[params.key + '_value'], buf, p[params.key + '_e']);
        });
    }
    else {
        storm.on(runtime, params.stage, (p) => {
            //value = value + (target - value) * e;
            storm.vec.scaleAndAdd(buf, p[params.key + "_target"], p[params.key + "_value"], -1);
            storm.vec.scaleAndAdd(p[params.key + "_value"], p[params.key + "_value"], buf, p[params.key + "_e"]);
        });
    }
    return params;
}


export function attach_distribute_vec3(runtime, {
    stage = 'emit',
    target = "p",
    grid = 0,
    from = [-1, -1, -1],
    to = [1, 1, 1]
}) {

    var buf = [0, 0, 0];
    var params = {
        stage, target, from, to
    };
    storm.attach_param(runtime, target, [0, 0, 0]);
    storm.on(runtime, params.stage, (p) => {
        //value = value + (target - value) * e;
        buf[0] = rrand(params.from[0], params.to[0], grid);
        buf[1] = rrand(params.from[1], params.to[1], grid);
        buf[2] = rrand(params.from[2], params.to[2], grid);
        storm.vec.copy(p[params.target], buf);
    });
    return params;
}


export function attach_compute_heading_vector_to_euler_vector(runtime, {
    target = "rot",
    vector = 'v',
    stage = 'v',
    grouping = 3,
    e = 0.4
}) {
    var unit = new three.Vector3(0, 0, 1); //up
    var vec_compute = new three.Vector3();
    var quat_compute = new three.Quaternion();
    var euler_compute = new three.Euler();
    var buf = [0, 0, 0];
    var key = 'euler_' + Math.random();
    storm.attach_perf_tag(runtime, key, { groups: grouping })
    var params = {
        target, vector, stage, e
    };
    storm.attach_param(runtime, target, [0, 0, 0]);
    storm.attach_param(runtime, vector, [0, 0, 0]);
    storm.on(runtime, params.stage, (p) => {
        if (storm.has_perf_tag(key, runtime, p)) {
            buf = storm.vec.copy(buf, p[params.vector]);
            buf = storm.vec.normalize(buf, buf);
            vec_compute.set(buf[0], buf[1], buf[2]);
            quat_compute.setFromUnitVectors(unit, vec_compute);
            euler_compute.setFromQuaternion(quat_compute);
            p[params.target][0] = ease(p[params.target][0], euler_compute.x, params.e, 0.00001);
            p[params.target][1] = ease(p[params.target][1], euler_compute.y, params.e, 0.00001);
            p[params.target][2] = ease(p[params.target][2], euler_compute.z, params.e, 0.00001);
        }
    });
    return params;
}


export function attach_compute_heading(runtime, {
    target = "rot",
    vector = 'v',
    stage = 'v',
    grouping = 5
}) {
    var unit = new three.Vector3(0, 0, 1); //up
    var vec_compute = new three.Vector3();
    var quat_compute = new three.Quaternion();
    var euler_compute = new three.Euler();
    var buf = [0, 0, 0];
    var key = 'euler_' + Math.random();
    storm.attach_perf_tag(runtime, key, { groups: grouping })

    var params = {
        target, vector, stage
    };
    storm.attach_param(runtime, target, [0, 0, 0]);

    storm.on(runtime, params.stage, (p) => {
        if (storm.has_perf_tag(key, runtime, p)) {
            buf = storm.vec.copy(buf, p[params.vector]);
            buf = storm.vec.normalize(buf, buf);
            vec_compute.set(buf[0], buf[1], buf[2]);
            quat_compute.setFromUnitVectors(unit, vec_compute);
            euler_compute.setFromQuaternion(quat_compute);
            p[params.target][0] = euler_compute.x;
            p[params.target][1] = euler_compute.y;
            p[params.target][2] = euler_compute.z;
        }
    });
    return params;
}
