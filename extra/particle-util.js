import * as ps from "./particles"
import * as three from "three";
import {
    quat,
    vec3
} from "gl-matrix";

export function particleModifierOutputThreeGeometry(geometry, params) {
    function update(stage, p, dt, arr, i) {
        if (stage == "p") {
            geometry.vertices[i].set(p.p[0], p.p[1], p.p[2]);
            if (p.pcolor) {
                geometry.colors[i].setRGB(p.pcolor[0], p.pcolor[1], p.pcolor[2]);
            }
        } else if (stage == 'd') {
            geometry.vertices[i].set(10000, 10000, 10000);
        } else if (stage == "e") {
            geometry.verticesNeedUpdate =
                geometry.colorsNeedUpdate = true;
        }
    }
    params = params || {};
    return ps.particleModifier(update, "iped", params);
}

export function particleModifierOutputThreeLineGeometry(segs, geometry, params) {
    function update(stage, p, dt, arr, i) {
        if (stage == "i") {
            p.trail = [];
            p.record = 0;
        } else if (stage == "p") {
            if (p.trail.length == 0) {
                for (var j = 0; j <= segs; j++) {
                    p.trail.push([p.p[0], p.p[1], p.p[2]]);
                }
            }
            p.record++;
            if (p.record > (params.span || 1)) {
                p.record = 0;
                for (var j = segs; j > 0; j--) {
                    p.trail[j][0] = p.trail[j - 1][0];
                    p.trail[j][1] = p.trail[j - 1][1];
                    p.trail[j][2] = p.trail[j - 1][2];
                }
            }
            p.trail[0][0] = p.p[0];
            p.trail[0][1] = p.p[1];
            p.trail[0][2] = p.p[2];

            for (var j = 0; j < segs; j++) {
                geometry.vertices[2 * ((i * segs) + j)].set(p.trail[j][0], p.trail[j][1], p.trail[j][2]);
                geometry.vertices[2 * ((i * segs) + j) + 1].set(p.trail[j + 1][0], p.trail[j + 1][1], p.trail[j + 1][2]);

                if (p.color) {
                    geometry.colors[2 * ((i * segs) + j)].setRGB(p.color[0], p.color[1], p.color[2]);
                    geometry.colors[2 * ((i * segs) + j) + 1].setRGB(p.color[0], p.color[1], p.color[2]);
                }
            }

        } else if (stage == 'd') {
            p.trail = [];
            p.record = 0;
            for (var j = 0; j < segs; j++) {
                geometry.vertices[2 * ((i * segs) + j)].set(10000, 10000, 10000);
                geometry.vertices[2 * ((i * segs) + j) + 1].set(10000, 10000, 10000);
                if (p.color) {
                    geometry.colors[2 * ((i * segs) + j)].setRGB(p.color[0], p.color[1], p.color[2]);
                    geometry.colors[2 * ((i * segs) + j) + 1].setRGB(p.color[0], p.color[1], p.color[2]);
                }
            }

        } else if (stage == "e") {
            geometry.verticesNeedUpdate =
                geometry.colorsNeedUpdate = true;
        }
    }
    params = params || {};
    return ps.particleModifier(update, "iped", params);
}

var _calc_vec = new three.Vector3();
var _calc_obj = new three.Object3D();
var _util_vec = vec3.create();
var _util_quat = quat.create();

export function particleThreeArrToVec3(arr) {
    _calc_vec.set(arr[0], arr[1], arr[2]);
    return _calc_vec;
}

export function particleThreeVecToRot(p, name, out_vec) {
    _calc_obj.lookAt(p[name][0], p[name][1], p[name][2]);
    if (out_vec != null) {
        out_vec[0] = _calc_obj.rotation.x;
        out_vec[1] = _calc_obj.rotation.y;
        out_vec[2] = _calc_obj.rotation.z;
    }
    return _calc_obj.rotation;
}

export function particleThreeProjectVec(p, name, out_vec, camera) {
    _calc_vec.set(p[name][0], p[name][1], p[name][2]);
    _calc_vec.project(camera);
    out_vec[0] = _calc_vec.x;
    out_vec[1] = -_calc_vec.y;
}

// why squared? faster... cache it yourself!!!
export function particleUtilClamp(attr, clamp_min_sq, clamp_max_sq) {
    var len = ps.vec3.sqrLen(attr);
    if (len < clamp_min_sq) {
        ps.vec3.scale(attr, attr, clamp_min_sq / len);
        return true;
    } else if (len > clamp_max_sq) {
        ps.vec3.scale(attr, attr, clamp_max_sq / len);
        return true;
    }
    return false;
}

export function particleUtilGravity(attr, pos, G, center, min_radius_sqrd) {
    ps.vec3.sub(_util_vec, center, pos);
    var r2 = G / Math.max(min_radius_sqrd, ps.vec3.sqrLen(_util_vec));
    ps.vec3.normalize(_util_vec, _util_vec);
    ps.vec3.scaleAndAdd(attr, attr, _util_vec, r2);
}

export function particleUtilDamp(attr, amount) {
    ps.vec3.scale(attr, attr, amount);
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

//apply force according to a rotation field
export function particleUtilEulerField(attr, amount, x, y, z) {
    if (y == undefined) {
        x = x[0];
        y = x[1];
        z = x[2];
    }
    quat.fromEuler(_util_quat,
        x * RAD_TO_DEG,
        y * RAD_TO_DEG,
        z * RAD_TO_DEG);
    vec3.set(_util_vec, amount, 0, 0);
    vec3.transformQuat(_util_vec, _util_vec, _util_quat);

    ps.vec3.add(attr, attr, _util_vec);
}

export function particleUtilSteerField(attr, amount, x, y, z) {
    if (y == undefined) {
        x = x[0];
        y = x[1];
        z = x[2];
    }
    quat.fromEuler(_util_quat,
        x * RAD_TO_DEG * amount,
        y * RAD_TO_DEG * amount,
        z * RAD_TO_DEG * amount);
    vec3.transformQuat(attr, attr, _util_quat);
}

export function particleUtilEaseTo(attr, attr2, ease) {
    vec3.sub(_util_vec, attr2, attr);
    vec3.scaleAndAdd(attr, attr, _util_vec, ease);
    return _util_vec;
}

export function particleUtilTargetingForce(acc, pos, target, ease) {
    vec3.sub(_util_vec, target, pos);
    var len = vec3.sqrLen(_util_vec);
    vec3.scaleAndAdd(acc, acc, _util_vec, ease);
    return len;
}

export function particleProperty(p, name, a) {
    p[name] = p[name] || 0;
    if (a != null) {
        p[name] = a;
    }
    return p[name];
}


export function particlePropertyVec3(p, name, a, b, c) {
    p[name] = p[name] || vec3.create();
    if (a != null && b != null && c != null) {
        p[name][0] = a;
        p[name][1] = b;
        p[name][2] = c;
    } else {
        p[name][0] = p[name][1] = p[name][2] = 0;
    }
    return p[name];
}

export function particlePropertyVec3Target(p, name, a, b, c) {
    if (a && a["length"]) {
        b = a[1];
        c = a[2];
        a = a[0];
    }
    return particlePropertyVec3(p, name + "_t", a, b, c);
}

export function particleEasedPropertyVec3(p, name, a, b, c, d, e, f) {
    particlePropertyVec3(p, name, a, b, c);
    particlePropertyVec3Target(p, name, d || a, e || b, f || c);
}

export function particleEasedPropertyVec3Update(p, name, ease) {
    return particleUtilEaseTo(p[name], p[name + "_t"], ease);
}

export function particleOutOfBound(vec, bound_min, bound_max) {
    for (var i = 0; i < vec.length; i++) {
        if (vec[i] < bound_min[i] || vec[i] > bound_max[i]) {
            return true;
        }
    }
    return false;
}

export function particleClampToBound(vec, bound_min, bound_max) {
    for (var i = 0; i < vec.length; i++) {
        vec[i] = vec[i] < bound_min[i] ? bound_min[i] : (
            vec[i] > bound_max[i] ? bound_max[i] : vec[i]
        )
    }
    return false;
}

export function particleWrapToBound(vec, bound_min, bound_max) {
    for (var i = 0; i < vec.length; i++) {
        vec[i] = vec[i] < bound_min[i] ? (bound_max[i] + vec[i] - bound_min[i]) : (
            vec[i] > bound_max[i] ? (-bound_max[i] + vec[i] + bound_min[i]) : vec[i]
        )
    }
    return false;
}


window.vec3 = ps.vec3;
window.quat = quat;