import eem3 from "eventemitter3"
export var EventEmitter = eem3;

export function eventPub() {
    var cbs = [];
    var trigger = function (cb) { //trigger
        if (cbs.indexOf(cb) == -1) {
            cbs.push(cb);
        }
    }
    trigger.emit = function () {
        var args = [];
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        for (var i = 0; i < cbs.length; i++) {
            cbs[i].apply(null, args);
        }
    }
    return trigger;
}

export function asyncDelay(time_ms) {
    return new Promise((res) => {
        setTimeout(res, time_ms);
    });
}

export function hybridObserve(x) {
    if(x.__hobserved) return x;
    Object.defineProperty(x, "__hobserved", {
        enumerable: false,
        writable: false,
        value: 1
    });
    var mount = vue.reactive({});
    for (var i in x) {
        ((i) => {
            mount[i] = x[i];
            if(typeof mount[i] == 'object'){
                hybridObserve(mount[i]);
            }
            Object.defineProperty(x, i,
                {
                    get() { return mount[i] },
                    set(v) { 
                        mount[i] = v
                    }
                }
            );
        })(i);
    }
    return x;
}