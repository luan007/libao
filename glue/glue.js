import { vue } from "..";
import { EventEmitter2 as EventEmitter } from "eventemitter2";

//confused? take a look @readme
//glue v0 - pretty rough now - not production ready 

export var glueDef = {};
export var glueRouter = {};
export var glueEv = new EventEmitter({
    wildcard: true
});

var EVENT_PLACEHOLDER = Symbol();

export var GLUE_EVENT = Symbol('EV_GLUE');
var GLUE_SYM = Symbol('SYM_GLUE');

export function glueEvent(meta) {
    return {
        mark: GLUE_SYM,
        type: "event",
        meta: meta
    };
}
export function glueAction(c = () => { }, meta) {
    return {
        mark: GLUE_SYM,
        type: "action",
        meta: meta,
        action: c
    };
}
export function glueValue(v, meta) {
    return {
        mark: GLUE_SYM,
        value: v,
        meta: meta,
        type: "value"
    }; //does nothing basically
}

function _glue_register_value(key, o, i, meta) {
    Object.defineProperty(glueRouter, key, {
        get() {
            return o[i]
        },
        set(value) {
            o[i] = value;
        }
    })
    glueDef[key] = {
        type: "value",
        path: key,
        target: o,
        key: i
    };
    vue.watch(() => o[i], (new_val, old_val) => {
        //changed
        glueEv.emit(key, {
            path: key,
            new_val: new_val,
            old_val: old_val,
            type: "value_changed"
        });
    });

    glueEv.emit(key, {
        path: key,
        new_val: o[i],
        old_val: o[i],
        type: "value_changed"
    });
}

function _glue_register_ev(key, o, i, meta) {
    var obj = (data) => {
        glueEv.emit(key, {
            path: key,
            data: data,
            type: "event"
        });
    };
    obj.on = (cb) => {
        glueEv.on(key, cb)
    };
    obj.once = (cb) => {
        glueEv.once(key, cb)
    };
    obj.off = (cb) => {
        glueEv.off(key, cb)
    };
    glueDef[key] = {
        type: "event",
        path: key,
        emitter: obj
    };
    Object.defineProperty(glueRouter, key, {
        get() {
            return obj;
        },
        set(value) {
            obj(value);
        }
    })
    Object.defineProperty(o, i, {
        get() {
            return obj;
        },
        set(value) {
            // send out
            obj(value);
        }
    })
}

function _glue_register_action(key, o, i, meta) {
    //wrap ball
    console.log(o[i]);
    o[i] = o[i].bind(o, o);
    Object.defineProperty(glueRouter, key, {
        get() {
            return o[i]; //only allows calling the function
        }
    })
    glueDef[key] = {
        type: "action",
        path: key,
        action: o[i]
    };
}

export function glueInternalRegisterKV__(key, o, i) {
    var t = typeof (o[i]);
    if (t == 'function') {
        return _glue_register_action(key, o, i);
    }
    if (t == 'symbol' && o[i] == EVENT_PLACEHOLDER) {
        return _glue_register_ev(key, o, i);
    }
    return _glue_register_value(key, o, i);
}


export function glueInternalRegisterKV__V2(key, o, i) {
    var t = o[i];
    if (typeof (t) == 'object' && t.mark == GLUE_SYM) {
        if (t.type == 'action') {
            o[i] = t.action;
            return _glue_register_action(key, o, i, t.meta);
        }
        if (t.type == 'event') {
            return _glue_register_ev(key, o, i, t.meta);
        }
        if (t.type == 'value') {
            o[i] = t.value;
            return _glue_register_value(key, o, i, t.meta);
        }
    }
    return glueInternalRegisterKV__(key, o, i); //fall back
}

export function glueObject(o, prefix = "") {
    // glueStore[o] = o; //crazy right..?
    var j = vue.reactive(o);
    //magic
    for (var i in j) {
        ((o, i) => {
            var key = (prefix ? ("/" + prefix + "/") : "/") + i;
            glueInternalRegisterKV__V2(key, o, i);
        })(j, i)
    }
    return j;
}

export function glueDumpMeta(target = glueDef) {
    return glueDef;
}

export function glueValueChanged(path, cb) {
    glueEv.on(path, (d) => {
        if (d.type == "value_changed") {
            //prop
            return cb(d);
        }
    })
}

export function glueValueSet(path, val) {
    glueRouter[path] = val;
}

export function glueEventOn(path) {
    glueEv.on(path, (d) => {
        if (d.type == "event") {
            //prop
            return cb(d);
        }
    })
}

export function glueEventEmit(path, data) {
    glueRouter[path](data);
}

export function glueActionCall(path, data) {
    glueRouter[path](data);
}


export function glueDebugAllEv() {
    glueEv.on("*", console.log)
}

export function glueValueGet(path) {
    return glueRouter[path];
}

export function glueExportToGlobal(g = window, use_g = true) {
    var fns = {
        glueActionCall: glueActionCall,
        glueEventOn: glueEventOn,
        glueEventEmit: glueEventEmit,
        glueValueSet: glueValueSet,
        glueValueGet: glueValueGet,
        glueDumpMeta: glueDumpMeta,
        glueValueChanged: glueValueChanged,
        glueDef: glueDef,
        glueRouter: glueRouter,
    }
    if (use_g) {
        fns.g = glueRouter; //better
    }

    for (var i in fns) {
        window[i] = fns[i];
    }
}

export function glueBind(cb) {
    glueValueChanged("*", cb);
}


/****
 *
 *
 *
 *
var command = glueObject({ //command object - this should be BI-DIR-SYNCED to remote state server
    //what about event - client trigger sth & server observes? (upstream event??)
    zoom: 0,
    pan_x: 0,
    pan_y: 0,
    //down or self = action, broadcast(both way) or self = event
    //can be called from local src - but without remote knowing it. or triggered by remote
    demo_action: glueAction(() => { }),
    zoom_in: glueAction(() => {
        glueValueSet("/zoom", glueValueGet("/zoom") + 1.2)
    }),
    zoom_out: glueAction(() => {
        glueValueSet("/zoom", glueValueGet("/zoom") - 1.2)
    }),
    //if triggered locally,
    //listeners (incls remote) will be noticed, can be triggered through remote too. Bi-directional by default
    demo_ev: glueEvent()
});

 */



//binding utils

export function glued(inobj, key, path) {
    glueValueChanged(path, (data) => {
        inobj[key] = data.new_val;
    });
    return inobj;
}

