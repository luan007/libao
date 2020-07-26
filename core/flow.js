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
