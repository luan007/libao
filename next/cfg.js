var qs = require('qs');
import * as _ from "lodash";

export function cfg_src_hash() {
    var h = location.hash;
    if (!h) return {};
    h = h.replace("#", "");
    var obj = qs.parse(h, {
        strictNullHandling: true,
        ignoreQueryPrefix: true,
        decoder(value) {
            try {
                return JSON.parse(decodeURIComponent(value));
            }
            catch (e) {
                return value;
            }
        }
    });
    return obj;
}

export function cfg_src_query() {
    var h = location.search;
    if (!h) return {};
    var obj = qs.parse(h, {
        strictNullHandling: true,
        ignoreQueryPrefix: true,
        decoder(value) {
            try {
                return JSON.parse(decodeURIComponent(value));
            }
            catch (e) {
                return value;
            }
        }
    });
    return obj;
}

function _parse(h) {
    var obj = qs.parse(h, {
        strictNullHandling: true,
        ignoreQueryPrefix: true,
        decoder(value) {
            try {
                return JSON.parse(decodeURIComponent(value));
            }
            catch (e) {
                return value;
            }
        }
    });
    return obj;
}

export function cfg_src_tokamak() {
    if (window.tokamak && window.tokamak.getCfg) {
        return window.tokamak.getCfg();
    }
    return {};
}

export function cfg_src_tokamak_qs() {
    if (window.tokamak && window.tokamak.getCfgQS) {
        var q = window.tokamak.getCfgQS(); //array
        var obj = {};
        for (var i = 0; i < q.length; i++) {
            _.merge(obj, _parse(q[i]));
        }
        return obj;
    }
    return {};
}

var _cache = null;;
export function cfg_stack(factory_fns = cfg_default_stack, refresh = false) {
    if (_cache && !refresh) return _cache;
    var obj = {};
    for (var i = 0; i < factory_fns.length; i++) {
        _.merge(obj, factory_fns[i]());
    }
    _cache = obj;
    return obj;
}

export var cfg_default_stack = [
    cfg_src_hash,
    cfg_src_tokamak,
    cfg_src_tokamak_qs
];

export function cfg(key, stack = cfg_default_stack, refresh = false) {
    var o = cfg_stack(stack, refresh);
    return o[key];
}

export function cfg_jpath(key, stack = cfg_default_stack, refresh = false) {
    var o = cfg_stack(stack, refresh);
    return _.get(o, key);
}