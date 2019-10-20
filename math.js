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
    return map(q, 0, 1, a, b, clamp);
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



export var ImprovedNoise = function () {

	var p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,
		 23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,
		 174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,
		 133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,
		 89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,
		 202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,
		 248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,
		 178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,
		 14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,
		 93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

	for (var i=0; i < 256 ; i++) {

		p[256+i] = p[i];

	}

	function fade(t) {

		return t * t * t * (t * (t * 6 - 15) + 10);

	}

	function lerp(t, a, b) {

		return a + t * (b - a);

	}

	function grad(hash, x, y, z) {

		var h = hash & 15;
		var u = h < 8 ? x : y, v = h < 4 ? y : h == 12 || h == 14 ? x : z;
		return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);

	}

	return {

		noise: function (x, y, z) {

			var floorX = Math.floor(x), floorY = Math.floor(y), floorZ = Math.floor(z);

			var X = floorX & 255, Y = floorY & 255, Z = floorZ & 255;

			x -= floorX;
			y -= floorY;
			z -= floorZ;

			var xMinus1 = x -1, yMinus1 = y - 1, zMinus1 = z - 1;

			var u = fade(x), v = fade(y), w = fade(z);

			var A = p[X]+Y, AA = p[A]+Z, AB = p[A+1]+Z, B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;

			return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), 
							grad(p[BA], xMinus1, y, z)),
						lerp(u, grad(p[AB], x, yMinus1, z),
							grad(p[BB], xMinus1, yMinus1, z))),
					lerp(v, lerp(u, grad(p[AA+1], x, y, zMinus1),
							grad(p[BA+1], xMinus1, y, z-1)),
						lerp(u, grad(p[AB+1], x, yMinus1, zMinus1),
							grad(p[BB+1], xMinus1, yMinus1, zMinus1))));

		}
	}
}