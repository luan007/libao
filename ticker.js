//tiny updatez
const PRECISION = 0.01;
var deltaT = 0;

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
        _eased_values.push(this);
        this.updating = true;
    }
    valueOf() {
        return this.value;
    }
    tick() {
        this.value = ease(this.value, this.to, this.e, this.precision);
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
    t = ((Date.now()) % 1000000) * 0.001;
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

export function looperStart() {
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

function _update_eased() {
    for (var i = 0; i < _eased_values.length; i++) {
        _eased_values[i].tick();
    }
}
loop(_update_eased);

var _value_lib = {};
var _value_keys = {};
export function changed(key, cur) {
    var changed = _value_lib[key] != cur;
    _value_lib[key] = cur;
    _value_keys[key] = 1;
    return changed;
}