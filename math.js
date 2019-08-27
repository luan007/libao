export function map(q, a, b, c, d, clamp) {
    var perc = (q - a) / (b - a);
    perc = clamp ? Math.min(Math.max(perc, 0.0), 1.0) : perc;
    var raw = perc * (d - c) + c;
    return raw;
}

export function clamp(v, a, b) {
    return v < a ? a : (v > b ? b : v);
}

export function crand(range, off) {
    range = range || 0.5;
    off = off || 0;
    return off + ((Math.random() - 0.5) * 2 * range);
}

export function normD(x) {
    return Math.pow(Math.E, -x * x * 2 * Math.PI);
}

export function rrand(from, to) {
    from = from || -0.5;
    to = to || 0.5;
    return map(Math.random(), 0, 1, from, to);
}

//turns anything into sth between 0~1 - also wrapped
export function normalize(q, a, b, wrap) {
    wrap = wrap || true;
    var mapped = map(q, a, b, 0, 1);
    if (wrap) {
        mapped = mapped % 1;
        mapped = mapped < 0 ? (mapped + 1) : mapped;
    }
    return mapped;
}

export function clampWrap(q, a, b) {
    //-2.4 0~1
    var range = (b - a);
    if (range == 0) return 0;
    var relative = q % range;
    return (relative < 0 ? (range + relative) : relative) + a;
}

//flip flop, determines something is within range
export function within(q, a, b) {
    return (q <= b && q >= a) ? 1.0 : 0.0;
}

//turns one number into 'array alike' switches // e.g  0, 10, 0.3 //current 0.3 -> 0/10, false
export function indexify(index, length, value_normalized, signed) {
    //e.g 0~1  -> chops into 0~0.1, 0.1~0.2, 0.2~0.3, 0.3~0.4...
    var segment = 1 / length;
    var target = (index) / length + segment / 2;
    var sign = signed ? Math.sign(value_normalized - target) : 1;
    return sign * map(Math.abs(value_normalized - target), segment / 2, 0, 0, 1, true);
}

//turns something
export function segmentize(index, length, val) {
    //e.g 0~1  -> chops into 0~0.1, 0.1~0.2, 0.2~0.3, 0.3~0.4...
    var segment = 1 / length;
    var begin = (index) / length;
    var end = begin + segment;
    return map(val, begin, end, 0, 1, true);
}

export function lerp(q, a, b, clamp) {
    return map(q, a, b, a, b, clamp);
}

export function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

export class MappedValue {
    constructor(v, a, b, c, d, clamp) {
        this.value = v;
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.clamp = clamp || false;
        this._calculated = false;
        this.update();
    }
    set(v) {
        this.value = v;
    }
    range(a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }
    update() {
        this.mapped = map(this.value, this.a, this.b, this.c, this.d);
        this._calculated = true;
    }
    valueOf() {
        if (this._calculated) this.update();
        return this.mapped;
    }
    toString() {
        return this.value.toString();
    }
}

export function mapped(q, a, b, c, d, clamp) {
    var v = new MappedValue(q, a, b, c, d, clamp);
    return v;
}

export function pick(arr, val) {
    var _arr = arr;
    if(!Array.isArray(arr)) {
        _arr = Object.keys(arr);
    }
    val = val == undefined ? Math.random() : val;
    var key = _arr[Math.floor(val * _arr.length)];
    return _arr == arr ? key : arr[key];
}

export function place(item, arr, max_length) {
    max_length = max_length || -1;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == null) {
            arr[i] = item;
            return i;
        }
    }
    if (arr.length > max_length) {
        return -1;
    }
    arr.push(item);
    return arr.length - 1;
}

import OpenSimplexNoise from "open-simplex-noise";

export var openSimplex = new OpenSimplexNoise();
export function simplexArray2d(width, height, scale) {
    var output = new Array(width);
    for (var x = 0; x < width; x++) {
        output[x] = new Array(height);
        for (var y = 0; y < height; y++) {
            output[x][y] = openSimplex.noise2D(x * scale, y * scale);
        }
    }
    return output;
}

export function simplexArray3d(width, height, depth, scale) {
    var output = new Array(width);
    for (var x = 0; x < width; x++) {
        output[x] = new Array(height);
        for (var y = 0; y < height; y++) {
            output[x][y] = new Array(depth);
            for (var z = 0; z < depth; z++) {
                output[x][y][z] = OpenSimplexNoise.noise3D(x * scale, y * scale, z * scale);
            }
        }
    }
    return output;
};

export function simplexArray4d(width, height, depth, wLength, scale) {
    var output = new Array(width);
    for (var x = 0; x < width; x++) {
        output[x] = new Array(height);
        for (var y = 0; y < height; y++) {
            output[x][y] = new Array(depth);
            for (var z = 0; z < depth; z++) {
                output[x][y][z] = new Array(wLength);
                for (var w = 0; w < wLength; w++) {
                    output[x][y][z][w] = openSimplex.noise4D(x * scale, y * scale, z * scale, w * scale);
                }
            }
        }
    }
    return output;
};

// console.log(simplexArray2d(1000, 1000, 0.01));

export function pickClosest2d(x, y, arr2d) {
    x = Math.floor(x) % arr2d.length;
    x = x < 0 ? x + arr2d.length : x;
    y = Math.floor(y) % arr2d[x].length;
    y = y < 0 ? y + arr2d[x].length : y;
    return arr2d[x][y];
}