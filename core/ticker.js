//tiny updatez
const PRECISION = 0.01;
var deltaT = 0;
var LIMIT_T = true; //set this to false will ensure Date.now() gets used

//0-1 range easing
export function ease_complex_curve(f, t, sp, precision) {
    //TBD - map abs(f-t) with sin & cos
}

export function springRaw(cur, target, velocity, stiffness, damping, mass = 1) {
    //http://en.wikipedia.org/wiki/Hooke%27s_law | F = -kx
    //F = -kx - bv
    var d = target - cur;
    var f = -1 * (stiffness * d);
    f -= (damping * velocity);
    var acc = f / mass;
    velocity += acc * deltaT;
    cur += velocity * deltaT; //move

    if (Math.abs(cur - target) < precision) {
        return [target, velocity]; //keep track of v & p
    }
    return [cur, velocity];
}

export function spring(prop, precision = PRECISION) {
    //http://en.wikipedia.org/wiki/Hooke%27s_law | F = -kx
    //F = -kx - bv
    var { value = 0, to = 0, velocity = 0, stiffness = 0.9, damping = 0.5, mass = 1, stopped = false, completed = false } = prop;

    var d = to - value;
    var f = -1 * (stiffness * d);
    f -= (damping * velocity);
    var acc = f / mass;
    velocity += acc * deltaT;
    value += velocity * deltaT; //move

    stopped = false;
    completed = false;
    if (Math.abs(value - to) < precision) {
        value = to;
        stopped = true;
        completed = true;
    }
    else if (Math.abs(velocity) < precision * 0.1) {
        stopped = true;
    }

    prop.value = value;
    prop.to = to;
    prop.velocity = velocity;
    prop.stiffness = stiffness;
    prop.damping = damping;
    prop.mass = mass;
    prop.stopped = stopped;
    prop.completed = completed;

    return prop;
}

var _spring_values = [];
export class SpringValue {
    constructor({ value = 0, to = 0, velocity = 0, stiffness = 0.9, damping = 0.5, mass = 1, stopped = false, completed = false }) {
        this.value = value;
        this.to = to;
        this.precision = precision || PRECISION;
        this.velocity = velocity;
        this.stiffness = stiffness;
        this.mass = mass;
        this.stopped = stopped;
        this.completed = completed;
        this.damping = damping;
        _spring_values.push(this);
        this.updating = true;
    }
    valueOf() {
        return this.value;
    }
    tick() {
        this.value = spring(this, this.precision);
    }
    toString() {
        return this.value.toString();
    }
    set(v) {
        this.value = v;
    }
    target(v) {
        this.to = v;
    }
}

function _update_springs() {
    for (var i = 0; i < _spring_values.length; i++) {
        _spring_values[i].tick();
    }
}

export function ease(f, t, sp, precision) {
    precision = precision || PRECISION;
    if (Math.abs(f - t) < precision) {
        return t;
    }
    return f + (t - f) * sp * deltaT;
}

export function easeObj(f) {
    f.value = ease(f.value, f.to, f.e, f.precision);
}

export function easeArray(f, t, sp, precision) {
    for (var i = 0; i < f.length; i++) {
        f[i] = ease(
            f[i],
            Array.isArray(t) ? t[i] : t,
            Array.isArray(sp) ? sp[i] : sp,
            Array.isArray(precision) ? precision[i] : precision
        );
    }
}

var _eased_values = [];

export function eased(v, t, e, prec) {
    return new EasedValue(v, t, e, prec);
}

export class EasedValue {
    constructor(value, to, e, precision) {
        this.value = value;
        this.to = to;
        this.precision = precision || PRECISION;
        this.e = e;
        this.velocity = 0;
        _eased_values.push(this);
        this.updating = true;
    }
    valueOf() {
        return this.value;
    }
    tick() {
        var prev = this.value;
        this.value = ease(this.value, this.to, this.e, this.precision);
        this.velocity = this.value - prev;
    }
    toString() {
        return this.value.toString();
    }
    set(v) {
        this.value = v;
    }
    target(v) {
        this.to = v;
    }
}

function _update_eased() {
    for (var i = 0; i < _eased_values.length; i++) {
        _eased_values[i].tick();
    }
}

export var deltaTMultipler = 60;

export function looperSetDeltaTMultiplier(s) {
    deltaTMultipler = s;
}

var all = [];
var removal = [];
export var t = (Date.now() / 1000) % 1000000;
export var prevT = (Date.now() / 1000) % 1000000;
export function tick() {
    deltaT = (t - prevT) * deltaTMultipler;
    prevT = t;
    if (deltaT < 0) {
        deltaT = 1;
    }
    if (deltaT > 3) {
        deltaT = 1;
    }
    if (LIMIT_T) {
        t = ((Date.now()) % 100000000) * 0.001;
    } else {
        t = ((Date.now())) * 0.001;
    }
    if (removal.length > 0) {
        var _new = [];
        for (var i = 0; i < all.length; i++) {
            if (removal.indexOf(all[i]) >= 0) {
                continue;
            }
            _new.push(all[i]);
        }
        removal = [];
        all = _new;
    }
    for (var i = 0; i < all.length; i++) {
        all[i](t, deltaT);
    }
}

export function loop(func_or_obj) {
    var func = func_or_obj.update || func_or_obj;
    if (all.indexOf(func) >= 0) {
        return;
    }
    all.push(func);
}

export function noLoop(func) {
    if (removal.indexOf(func) >= 0) {
        return;
    }
    removal.push(func);
}

export function looperStart(lim_t) {
    LIMIT_T = lim_t;
    var _updator_thread = function () {
        requestAnimationFrame(_updator_thread);
        tick();
    };
    _updator_thread();
}

var _keys = {};
export function looperInterval(key, span) {
    _keys[key] = _keys[key] || Date.now();
    if (Date.now() > _keys[key] + span) {
        _keys[key] = Date.now();
        return true;
    }
    return false;
}


var _value_lib = {};
var _value_keys = {};
export function changed(key, cur) {
    var changed = _value_lib[key] != cur;
    _value_lib[key] = cur;
    _value_keys[key] = 1;
    return changed;
}

loop(_update_eased);
loop(_update_springs);
