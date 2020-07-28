import * as _mobx from "mobx"
import * as _mobxReact from "mobx-react";
import * as _mobxReactLite from "mobx-react-lite";

export var Mobx = _mobx;
export var MobxReact = _mobxReact;
export var MobxReactLite = _mobxReactLite;


export var observe = _mobx.observe;
export var Observer = _mobxReactLite.Observer;
export var useAsObservableSource = _mobxReactLite.useAsObservableSource;
export var observable = _mobx.observable;
export var extendObservable = _mobx.extendObservable;


/**
 * Automatically observe arbitary object. NOT RECOMMENDED
 * This will auto-gen meta for the obj
 * do not call this often
 * @param {*} i Instance of some object
 */
export function autoObserve(i) {
    var cfg = {};
    for (var q in i) {
        cfg[q] = i[q];
    }
    return extendObservable(i, cfg);
}