export function setConfigHashSplitter(splitter) {
    global["splitter"] = splitter
}
export function configFromHash() {
    var h = location.hash;
    if (!h) return {};
    h = decodeURIComponent(h);
    h = h.replace("#", "");
    h = h.split(global['splitter'] || "&");
    var obj = {};
    for (var kv = 0; kv < h.length; kv++) {
        var flag = h[kv].split("=");
        if (flag.length == 1) {
            obj[flag[0]] = true;
        } else {
            obj[flag[0]] = flag[1];
        }
    }
    return obj;
}

export function runtimeEnv(key) {
    window.env = window.env || {};
    return (configFromHash()[key] || window.env[key])
}


var cache = {};

/**
 * smartCache<T>(key: string, factory_fn: () => T): T;
 * @param {string} key 
 * @param {()=>T} factory_fn 
 * @returns {T}
 */
export function smartCache(key, factory_fn) {
    cache[key] = cache[key] || [];
    if (cache[key].length > 0) {
        return cache[key].pop();
    }
    else {
        var built = factory_fn();
        built.__anchor__ = key;
        return built;
    }
}
export function smartCacheRecycle(thing, cleanup_fn = () => { }) {
    var anchor = thing.__anchor__;
    if (cache[anchor] && cache[anchor].indexOf(thing) == -1) {
        cache[anchor].push(thing);
    }
}