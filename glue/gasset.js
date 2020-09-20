var gassetStore = [];

/**
 * gassetType
 * @typedef {Object} gassetType
 * @property {string} path
 * @property {object} meta
 * @property {*} data
 * @property {*} raw
 */

/**
 * full gasset mgmt
 * @template T
 * @param {string} path 
 * @param {(d)=>T} transformer 
 * @returns {{data:T, raw: any, meta: any, path: string}}
 */
export function gasset(path, transformer, fetch_factory, meta_factory = () => ({}), default_val = null) {
    var shell = {
        transformer: transformer,
        meta_factory: meta_factory,
        fetch_factory: fetch_factory,
        path: path,
        core: {
            id: gassetStore.length,
            path: path,
            meta: {
            },
            data: default_val,
            raw: null
        }
    };
    gassetStore.push(shell);
    return shell.core;
}


//put this into asset mgmt pipeline & gives url transformation cap
export function gstatic(url, promise_factory) {
    return gasset(url, (d) => d, promise_factory);
}

//put this into asset mgmt pipeline
export function gwait(promise_factory) {
    return gasset(Math.random(), (d) => d, promise_factory);
}

async function gassetResolveOne(cur) {
    try {
        var meta = await cur.meta_factory(cur.core);
        cur.core.meta = meta;
        var data = await cur.fetch_factory(cur.core);
        cur.core.raw = data;
        var transformed = cur.transformer(data, cur.core);
        cur.core.data = transformed;
        return cur;
    } catch (e) {
        return -1;
    }
}



export async function gassetResolveAll(report_progress = (id, len, item) => { }) {
    for (var i = 0; i < gassetStore.length; i++) {
        report_progress(i, gassetStore.length, gassetStore[i].core);
        await gassetResolveOne(gassetStore[i]);
    }
    report_progress(gassetStore.length, gassetStore.length, true);
}

// export function gasset(id, fetch, transform) {
//     gassetStore[id] = gassetStore[id] || {
//         obj: {
//             data: null, //from remote
//             meta: null, //from remote
//             id: id,
//             __is_gasset__: true
//         },
//         hooks: {
//             fetch: fetch,
//             transform: transform
//         }
//     };
//     return gassetStore[id].obj;
// }