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
    if(skip_inside && dist < lim_d) return a; //dont act
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
    var len = constant || storm.vec.len(dir) * factor;
    if(len < 0.00001) return a;
    if(lim_max > 0) {
        len = len > lim_max ? lim_max : len;
    }
    storm.vec.scaleAndAdd(a, a,
        storm.vec.normalize(dir, dir),
        len);
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
        if (!storm.has_perf_tag(key, runtime, p)) {
            return;
        }
        var curl = curl3d(
            p.p[0] * params.scaler[0] + runtime.t * params.time[0],
            p.p[1] * params.scaler[1] + runtime.t * params.time[1],
            p.p[2] * params.scaler[2] + runtime.t * params.time[2], 1);
        storm.vec.copy(p[params.target], curl); //this is the key
        storm.vec.scale(p[params.target], p[params.target], params.power); //this is the key
        vec3_fx_apply_rotation(curl, p[params.target], params.strength)
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
        buf[0] = rrand(params.from[0], params.to[0]);
        buf[1] = rrand(params.from[1], params.to[1]);
        buf[2] = rrand(params.from[2], params.to[2]);
        storm.vec.copy(p[params.target], buf);
    });
    return params;
}


export function attach_compute_heading_vector_to_euler_vector(runtime, {
    target = "rot",
    vector = 'v',
    stage = 'v',
    e = 0.4
}) {
    var unit = new three.Vector3(0, 0, 1); //up
    var vec_compute = new three.Vector3();
    var quat_compute = new three.Quaternion();
    var euler_compute = new three.Euler();
    var buf = [0, 0, 0];
    var params = {
        target, vector, stage, e
    };
    storm.attach_param(runtime, target, [0, 0, 0]);
    storm.attach_param(runtime, vector, [0, 0, 0]);
    storm.on(runtime, params.stage, (p) => {
        buf = storm.vec.copy(buf, p[params.vector]);
        buf = storm.vec.normalize(buf, buf);
        vec_compute.set(buf[0], buf[1], buf[2]);
        quat_compute.setFromUnitVectors(unit, vec_compute);
        euler_compute.setFromQuaternion(quat_compute);
        p[params.target][0] = ease(p[params.target][0], euler_compute.x, params.e, 0.00001);
        p[params.target][1] = ease(p[params.target][1], euler_compute.y, params.e, 0.00001);
        p[params.target][2] = ease(p[params.target][2], euler_compute.z, params.e, 0.00001);
    });
    return params;
}
