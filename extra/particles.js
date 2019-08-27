//lightweight particle system
//design rules:
//1. function based, no big classes like particle system, let user decide wat to do
//2. calculation only. rendering goes to helper methods, not inside particle
//      u may ask, wat if i want a trail after my stuff
//      as it does a) records prev location, 2) do rendering
//      and it's jst mixed up rite?
//      --  NO
//      
//      trail = trailPositionCalculation + trailRenderHelper..
//3. entity model. which means -> all 'fields' / 'effectors' are just functions or shared objects
//   whose parameters are controlled either globally OR within each particle for speed
//   and can be cached

import * as glMatrix from "gl-matrix";

export var cache = [0, 0, 0];
export var vec3 = glMatrix.vec3;
export var quat = glMatrix.quat;

export class particle {
    constructor(extended) {
        this.p = [0, 0, 0];
        this.v = [0, 0, 0];
        this.a = [0, 0, 0];
        this.new_death = false;
        this.extended = extended;
        if (extended) {
            this.r = [0, 0, 0];
            this.rv = [0, 0, 0];
            this.ra = [0, 0, 0];
            this.s = [1, 1, 1];
            this.sv = [0, 0, 0];
            this.sa = [0, 0, 0];
            this.color = [0, 0, 0];
            this.emissive = [0, 0, 0];
            this.heading = [0, 0, 0];
        }
        this.life = 1;
        this.vlife = 0.1;
        this.empty = false; //flag
    }
}

export function particleArrSet(arr, x, y, z) {
    glMatrix.vec3.set(arr, x, y, z);
}

export function particleModifier(update, active_stages, params) {
    params = params || {};
    return {
        update: update,
        stages: active_stages,
        params: {},
        disabled: false
    };
}

export function particleModStack(modifiers, force) {
    if (!force && modifiers.__stack) return modifiers
    var mod_stack = {
        "i": [], //init
        "d": [], //destroy
        "a": [], //modify acc
        "v": [], //modfiy vel
        "p": [], //modify pos
        "u": [], //update begin
        "e": [], //update end
    };
    var keys = Object.keys(mod_stack);
    for (var i = 0; i < modifiers.length; i++) {
        for (var j = 0; j < keys.length; j++) {
            if (modifiers[i].stages.indexOf(keys[j]) >= 0) {
                mod_stack[keys[j]].push(modifiers[i]);
            }
        }
    }
    modifiers.__stack = mod_stack;
    return modifiers;
}

function _particle_stack_action(mod_stack, key, p, dt, arr, i, t) {
    for (var q = 0; q < mod_stack[key].length; q++) {
        (!mod_stack[key][q].disabled) && mod_stack[key][q].update(key, p, dt, arr, i, mod_stack[key][q].params, t);
    }
}

export function particlesUpdate(arr, modifiers, dt, t, _sim_speed) {
    _sim_speed = _sim_speed || 1;
    dt *= _sim_speed;
    // t *= _sim_speed;
    var mod_stack = particleModStack(modifiers).__stack;
    var p;

    _particle_stack_action(mod_stack, "u", null, dt, arr, -1, t);
    arr.spots = arr.spots || [];
    for (var i = 0; i < arr.length; i++) {
        p = arr[i];
        p.life -= p.vlife * dt;
        var prev = p.empty;
        p.empty = p.life <= 0;
        p.new_death = false;
        if (p.empty && !prev) {
            _particle_stack_action(mod_stack, "d", p, dt, arr, i, t);
            arr.spots.push(i);
            p.new_death = true;
        }
        if (p.empty) {
            continue;
        }
        glMatrix.vec3.set(p.a, 0, 0, 0);
        if (p.extended && p.extended.compute_rotation) {
            glMatrix.vec3.set(p.ra, 0, 0, 0);
        }
        if (p.extended && p.extended.compute_size) {
            glMatrix.vec3.set(p.sa, 0, 0, 0);
        }
        _particle_stack_action(mod_stack, "a", p, dt, arr, i, t);
        if (p.extended && p.extended.compute_rotation) {
            glMatrix.vec3.scaleAndAdd(p.rv, p.rv, p.ra, dt);
        }
        if (p.extended && p.extended.compute_size) {
            glMatrix.vec3.scaleAndAdd(p.sv, p.sv, p.sa, dt);
        }
        glMatrix.vec3.scaleAndAdd(p.v, p.v, p.a, dt);
        _particle_stack_action(mod_stack, "v", p, dt, arr, i, t);
        glMatrix.vec3.scaleAndAdd(p.p, p.p, p.v, dt);
        if (p.extended && p.extended.compute_rotation) {
            glMatrix.vec3.scaleAndAdd(p.r, p.r, p.rv, dt);
        }
        if (p.extended && p.extended.compute_size) {
            glMatrix.vec3.scaleAndAdd(p.s, p.s, p.sv, dt);
        }
        _particle_stack_action(mod_stack, "p", p, dt, arr, i, t);
        if (p.extended && p.extended.compute_heading) {
            glMatrix.vec3.normalize(p.heading, p.v);
        }
    }
    _particle_stack_action(mod_stack, "e", null, dt, arr, -1, t);
}

export function particleInit(p, modifiers, arr, i) {
    var mod_stack = particleModStack(modifiers).__stack;
    _particle_stack_action(mod_stack, "i", p, 0, arr, i);
}

export function particleSpawn(arr, modifiers, extended) {
    var res = null;
    var index = -1;
    if (arr.spots && arr.spots.length > 0) {
        var i = arr.spots.pop();
        if (arr[i]) {
            arr[i].empty = false;
            arr[i].new_death = false;
            res = arr[i];
            index = i;
        } else {
            var p = new particle(extended);
            arr[i] = p;
            index = arr.length - 1;
            res = p;
        }
    } else if (!arr.fixed) {
        var p = new particle(extended);
        arr.push(p);
        index = arr.length - 1;
        res = p;
    }
    if (res) {
        res.stack = modifiers;
        particleInit(res, modifiers, arr, index);
    }
    return res;
}

export function particleFixedAllocate(modifiers, extended, count) {
    var arr = [];
    arr.spots = arr.spots || [];
    for (var i = 0; i <= count; i++) {
        let p = particleSpawn(arr, modifiers, extended);
        p.p[0] = 0; //ao.rrand(-20, 20);
        p.p[1] = 0; //ao.rrand(-20, 20);
        p.p[2] = 0; //ao.rrand(-20, 20);
        p.vlife = 0;
        p.life = 0;
        p.empty = true;
    }
    for(var i = 0; i <= count; i++) {
        arr.spots.push(i);
    }
    //lock now
    arr.fixed = true;
    return arr;
}
