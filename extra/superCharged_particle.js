//the '1-big-array'
//solution
import "operative";

export var ocache = new Float32Array(10);

export var ovec3 = {
    vec3Set: function (arr, id, mult, offset) {
        return arr[id * mult + offset];
    },
    vec3Set: function (arr, index, x, y, z) {
        var b = index * 3;
        arr[b] = x;
        arr[b + 1] = y;
        arr[b + 2] = z;
    },
    vec3Add: function (outarr, outindex, arr, index, arr2, index2) {
        outindex *= 3;
        index *= 3;
        index2 *= 3;
        outarr[outindex] = arr[index] + arr2[index2];
        outarr[outindex + 1] = arr[index + 1] + arr2[index2 + 1];
        outarr[outindex + 2] = arr[index + 2] + arr2[index2 + 2];
    },
    vec3Sub: function (outarr, outindex, arr, index, arr2, index2) {
        outindex *= 3;
        index *= 3;
        index2 *= 3;
        outarr[outindex] = arr[index] - arr2[index2];
        outarr[outindex + 1] = arr[index + 1] - arr2[index2 + 1];
        outarr[outindex + 2] = arr[index + 2] - arr2[index2 + 2];
    },
    vec3Scale: function (outarr, outindex, arr, index, scale) {
        outindex *= 3;
        index *= 3;
        outarr[outindex] = arr[index] * scale;
        outarr[outindex + 1] = arr[index + 1] * scale;
        outarr[outindex + 2] = arr[index + 2] * scale;
    },
    vec3ScaleAndAdd: function (outarr, outindex, arr, index, arr2, index2, scale) {
        outindex *= 3;
        index *= 3;
        outarr[outindex] = arr[index] + arr2[index2] * scale;
        outarr[outindex + 1] = arr[index + 1] + arr2[index2 + 1] * scale;
        outarr[outindex + 2] = arr[index + 2] + arr2[index2 + 2] * scale;
    },
    vec3Negate: function (outarr, outindex, arr, index) {
        outindex *= 3;
        index *= 3;
        outarr[outindex] = -arr[index];
        outarr[outindex + 1] = -arr[index + 1];
        outarr[outindex + 2] = -arr[index + 2];
    },
    vec3Length: function (arr, index) {
        index *= 3;
        var x = arr[index];
        var y = arr[index + 1];
        var z = arr[index + 2];
        return Math.sqrt(x * x + y * y + z * z);
    },
    vec3SquaredLength: function (arr, index) {
        index *= 3;
        var x = arr[index];
        var y = arr[index + 1];
        var z = arr[index + 2];
        return (x * x + y * y + z * z);
    }
};

export function particleXProperty(ps, key, dimension) {
    for (var i = 0; i < ps.length; i++) {
        //chunks
        var chunk = ps[i];
        ps[i][key] = new Float32Array(chunk.size * dimension);
    }
    ps.keys = ps.keys || {};
    ps.keys[key] = dimension;
}

export function particleXChunks(length, chunks) {
    var ps = [];
    var len = length;
    var chunkSize = len / chunks;
    while (len > 0) {
        var _chunk_size = len > chunkSize ? chunkSize : len;
        var spots = [];
        for (var i = 0; i < _chunk_size; i++) {
            spots.push(i);
        }
        len -= _chunk_size;
        ps.push({
            size: _chunk_size,
            spots: new Int32Array(spots),
            left: spots.length
        });
    }
    return ps;
}

export function particleXSystem(length, chunks) {
    chunks = chunks || 1;
    var ps = particleXChunks(length, chunks);
    particleXProperty(ps, "p", 3);
    particleXProperty(ps, "v", 3);
    particleXProperty(ps, "a", 3);
    particleXProperty(ps, "life", 1);
    particleXProperty(ps, "vlife", 1);
    return ps;
}

function strip_function(func) {
    var f = func.toString();
    f = f.substring(f.indexOf("{") + 1);
    f = f.substring(0, f.lastIndexOf("}"));
    return f.trim();
}

export function particleXModifier(inject_points, param) {
    var injection = {};
    for (var i in inject_points) {
        injection[i] = strip_function(inject_points[i]);
    }
    return {
        param: param || {},
        code: injection,
        particleInit: inject_points.particleInit,
        beforeBatch: inject_points.beforeBatch,
        afterBatch: inject_points.afterBatch,
    };
}

export function particleXCompile(ps, stack) {
    var injection = {};
    var params = [];
    for (var i = 0; i < stack.length; i++) {
        var cur = stack[i];
        params.push(cur.param);
        for (var k in cur.code) {
            injection[k] = injection[k] || "";
            injection[k] += `
                param = params[${i}];
                if(!param.disabled) {
                    ${cur.code}
                }
            `
        }
    }
    var keys = ps.keys;
    var __chunk__decompress__ = "";
    for (var k in keys) {
        __chunk__decompress__ += `var ${k} = new Float32Array(data.chunk.${k})\n`
    }

    var __chunk__compress__ = "";
    var __chunk__transfer__ = "[";
    for (var k in keys) {
        __chunk__compress__ += `result.chunk.${k} = ${k}.buffer;\n`
        __chunk__transfer__ += `${k}.buffer,`
    }
    __chunk__transfer__ = __chunk__transfer__.substring(0, __chunk__transfer__.length - 1);
    __chunk__transfer__ += ", spots.buffer]";

    var __helpers__ = ``

    var temp;
    eval(
        `
        temp = function(data, cb) {
            var cache = new Float32Array(10);
            ${__helpers__}
            var params = data.params;
            var param = null;
            var t = data.t;
            var dt = data.dt;
            var spots = [];
            ${__chunk__decompress__}
            ${injection["u"] || ""}
            for(var id = 0; id < data.chunk.size; id++) {
                life[id] -= vlife[id] * dt;
                if(life[id] <= 0) {
                    spots.push(id);
                    continue;
                }
                vec3Set(a, id, 0, 0, 0);
                ${injection["a"] || ""}
                vec3ScaleAndAdd(v, id, v, id, a, id, dt);
                ${injection["v"] || ""}
                vec3ScaleAndAdd(p, id, p, id, v, id, dt);
                ${injection["p"] || ""}
            }
            ${injection["e"] || ""}
            spots = new Int32Array(spots);
            var result = {
                chunk: { },
                spots: spots
            };
            ${__chunk__compress__}
            cb.transfer(
                result, 
                ${__chunk__transfer__}
            )
        }
        `
    );
    var _o = {
        main: temp
    };
    for (var i in ovec3) {
        _o[i] = ovec3[i];
    }

    var workers = [];
    for(var i = 0; i < ps.length; i++) {
        workers.push(operative(_o))
    }
    function work_chunk(i, t, dt) {
        var bufs = [];
        for (var c in ps[i]) {
            if (ps[i][c] && ps[i][c].buffer && c != "spots") {
                bufs.push(ps[i][c].buffer);
            }
        }
        var job = workers[i].main.transfer({
                params: params,
                chunk: ps[i],
                t: t,
                dt: dt
            },
            bufs
        ).then((r) => {
            bufs = null;
            var chunk = r.chunk;
            for (var c in chunk) {
                ps[i][c] = new Float32Array(chunk[c]);
            }
            ps[i].spots = new Int32Array(r.spots);
            ps[i].left = ps[i].spots.length;
            r = null;
        });
        return job;
    }
    var working = false;
    function work(t, dt) {
        var jobs = [];
        for (var i = 0; i < ps.length; i++) {
            jobs.push(work_chunk(i, t, dt));
        }
        for (var i = 0; i < stack.length; i++) {
            stack[i].beforeBatch && stack[i].beforeBatch(ps, t, dt);
        }
        return Promise.all(jobs).then(() => {
            jobs = null;
            for (var i = 0; i < stack.length; i++) {
                stack[i].afterBatch && stack[i].afterBatch(ps, t, dt);
            }
        });
    }
    console.log("Built logic:");
    console.log("============");
    console.log(temp.toString())
    console.log("============");
    return function(t, dt) {
        if(!working) {
            work(t, dt).finally(()=>{
                working = false;
            });
            working = true;
            return false;
        }
        return true;
    };
}

export function particleXSpawn(ps, stack) {
    var res = null;
    for (var i = 0; i < ps.length; i++) {
        if (ps[i].left > 0) {
            ps[i].left--;
            res = {
                index: ps[i].spots[ps[i].left],
                chunk: i
            };
            break;
        }
    }
    if (res) {
        particleXInit(ps, res.index, res.chunk, stack);
    }
    return res;
}

export function particleXInit(ps, index, chunk, stack) {
    ovec3.vec3Set(ps[chunk].p, index, 0, 0, 0);
    ovec3.vec3Set(ps[chunk].v, index, 0, 0, 0);
    ovec3.vec3Set(ps[chunk].a, index, 0, 0, 0);
    ps[chunk].life[index] = 1.0;
    ps[chunk].vlife[index] = 0.05;

    for (var i = 0; i < stack.length; i++) {
        stack[i].particleInit && stack[i].particleInit(ps, index, chunk);
    }
}

export function particleXModOutputThreeGeometry(geometry, param) {
    return particleXModifier({
        afterBatch: function (ps) {
            var v = 0;
            for (var i = 0; i < ps.length; i++) {
                for (var j = 0; j < ps[i].size; j += 1) {
                    geometry.vertices[v++].set(
                        ps[i].p[j * 3],
                        ps[i].p[j * 3 + 1],
                        ps[i].p[j * 3 + 2]
                    );
                }
            }
            geometry.verticesNeedUpdate =
                geometry.colorsNeedUpdate = true;
        }
    }, param || {});
}