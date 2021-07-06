import { boi } from "./boi";

import { vue } from "../../";
//mark object into addressable

import ev from "eventemitter2";
import * as _ from "lodash";

var SYM_GLUE2 = Object.create(null);

var registered_as_catch_all = false;

var glue_managed = {
    addrs: {}
};

var glue_log = function () { }

export var glue2ManagedAddrs = glue_managed;

function glue2ListenOnAddr(addr) {

    if (registered_as_catch_all) return;

    var _Scope = boi.env.Scope;

    boi.sub("glue.set." + _Scope + "." + addr, (err, msg) => {
        if (err || !msg.body || !msg.body.addr) return;
        if (!glue_managed.addrs[msg.body.addr]) {
            glue2Ref(msg.body.addr, msg.body.value, msg.body.version)
        }
        if (msg.body.version == -1 || msg.body.version > glue_managed.addrs[msg.body.addr].version) {
            if (glue_managed.addrs[msg.body.addr].type == 'value') {
                glue_managed.addrs[msg.body.addr].value = (msg.body.value); //set to local
                glue_managed.addrs[msg.body.addr].version = (msg.body.version); //set to new
                glue_managed.addrs[msg.body.addr].ev.emit("changedByRemote", msg.body.value);
                glue_log(msg.body.addr, "=>", msg.body.value);
            } else if (glue_managed.addrs[msg.body.addr].type == 'remote_value') {
                glue_managed.addrs[msg.body.addr].cmd_value = (msg.body.value); //set to local
                glue_managed.addrs[msg.body.addr].cmd_version = (msg.body.version); //set to new
                // glue_managed.addrs[msg.body.addr].version = (msg.body.version); //set to new
                glue_managed.addrs[msg.body.addr].ev.emit("changedByRemote", msg.body.value);
            }
        }
    });

    boi.sub("glue.sync." + _Scope + "." + addr, (err, msg) => {
        if (err || !msg.body || !msg.body.addr) return;
        if (!glue_managed.addrs[msg.body.addr]) {
            glue2Ref(msg.body.addr, msg.body.value, msg.body.version)
        }
        if (msg.body.version == -1 || msg.body.version >= glue_managed.addrs[msg.body.addr].version) {
            if (glue_managed.addrs[msg.body.addr].type == 'value' ||
                !msg.body.remote) {
                glue_log(msg.body.addr, "~", msg.body.value);
                glue_managed.addrs[msg.body.addr].version = (msg.body.version); //set to new
                if (_.isEqual(glue_managed.addrs[msg.body.addr].value, (msg.body.value))) {
                    return;
                }
                glue_managed.addrs[msg.body.addr].value = (msg.body.value); //set to local
                glue_managed.addrs[msg.body.addr].ev.emit("syncedByRemote", msg.body.value);
            }
            else if (glue_managed.addrs[msg.body.addr].type == 'remote_value') {
                console.log("Sync");
                glue_managed.addrs[msg.body.addr].version = (msg.body.version); //set to new
                glue_log(msg.body.addr, "~*", msg.body.value);
                if (_.isEqual(glue_managed.addrs[msg.body.addr].cmd_value, (msg.body.value))) {
                    return;
                }
                glue_managed.addrs[msg.body.addr].cmd_value = (msg.body.value); //set to local
                glue_managed.addrs[msg.body.addr].ev.emit("syncedByRemote", msg.body.value);
            }
        }
    });

    boi.sub("glue.ask." + _Scope + "." + addr, (err, msg) => {
        if (err || !msg.body || !msg.body.addr) return;
        if (!glue_managed.addrs[msg.body.addr]) {
            glue2Ref(msg.body.addr, msg.body.value, msg.body.version)
        }
        if (glue_managed.addrs[msg.body.addr]) {
            if (
                glue_managed.addrs[msg.body.addr].type == 'value' &&
                msg.body.version < glue_managed.addrs[msg.body.addr].version) {
                glue2Sync(
                    glue_managed.addrs[msg.body.addr].addr,
                    glue_managed.addrs[msg.body.addr].value,
                    glue_managed.addrs[msg.body.addr].version
                )
            }
            else if (
                glue_managed.addrs[msg.body.addr].type == 'remote_value' &&
                msg.body.version < glue_managed.addrs[msg.body.addr].version) {
                glue2Sync(
                    glue_managed.addrs[msg.body.addr].addr,
                    glue_managed.addrs[msg.body.addr].cmd_value,
                    glue_managed.addrs[msg.body.addr].version,
                    'remote'
                )
            }
        }
    });
}

export function glue2CatchAllTraffic() {
    glue2ListenOnAddr("*");
    registered_as_catch_all = true;
}

export function glue2EnableTransport(Scope = boi.env.Scope) {
    //or lets just transmit
    boi.sub("glue.collect." + Scope, (err, msg) => {
        for (var i in glue_managed.addrs) {
            if (glue_managed.addrs[i].type == 'value') {
                glue2Sync(
                    glue_managed.addrs[i].addr,
                    glue_managed.addrs[i].value,
                    glue_managed.addrs[i].version
                )
            }
        }
    });

    boi.sub("glue.collectAll", (err, msg) => {
        for (var i in glue_managed.addrs) {
            if (glue_managed.addrs[i].type == 'value') {
                glue2Sync(
                    glue_managed.addrs[i].addr,
                    glue_managed.addrs[i].value,
                    glue_managed.addrs[i].version
                )
            }
        }
    });
}

export function glue2Collect() { //are you sure? this is for debugger only!
    //
    console.warn("Glue2 - Broadcasting Collect Request - Expect ripples.");
    boi.pub("glue.collect." + boi.env.Scope, { req: Date.now() })
}


export function glue2CollectAll() { //are you sure? this is for debugger only!
    //
    console.warn("Glue2 - Broadcasting Collect Request - Expect ripples.");
    boi.pub("glue.collectAll", { req: Date.now() })
}

export function glue2CollectScope(scope = boi.env.Scope) { //are you sure? this is for debugger only!
    //
    console.warn("Glue2 - Broadcasting Collect Request - Expect ripples.");
    boi.pub("glue.collect." + scope, { req: Date.now() })
}

export function glue2Set(addr, value, force = false, version = null) { //are you looking for doing this in a reckless manner?
    //
    if (!glue_managed.addrs[addr]) {
        //return;
        console.warn("Setting [", addr, "] with no local registration.");
        //or lets just transmit
        boi.pub("glue.set." + boi.env.Scope + "." + addr, {
            addr: addr,
            value: value,
            version: -1
        })
        glue2Ref(addr, value)
    }
    else {
        var local = glue_managed.addrs[addr];
        //set local thing first
        if (local.type == 'value') {
            //on
            local.version = Date.now();
            if (!_.isEqual(local.value, value) || force) {
                local.value = (value);
                local.ev.emit("changedByLocal");
            }
            else {
                return;
            }
            boi.pub("glue.set." + boi.env.Scope + "." + addr, {
                addr: addr,
                value: value,
                version: version == null ? (local.version) : version
            })
        }
        else {
            // local.version = Date.now();
            local.cmd_value = (value);
            boi.pub("glue.set." + boi.env.Scope + "." + addr, {
                addr: addr,
                value: local.cmd_value,
                version: Date.now()
            })
        }
        //or lets just transmit
    }
}

export function glue2Sync(addr, value, version, is_remote) { //are you looking for doing this in a reckless manner?
    //
    if (!glue_managed.addrs[addr]) {
        //return;
        console.warn("Reporting [", addr, "] with no local registration.");
        glue2Ref(addr, value)
    }
    boi.pub("glue.sync." + boi.env.Scope + "." + addr, {
        addr: addr,
        value: value,
        version: version,
        remote: is_remote
    })
}

export function glue2AskForUpdate(addr, version, value) { //are you looking for doing this in a reckless manner?
    //
    if (!glue_managed.addrs[addr]) {
        return;
    }
    boi.pub("glue.ask." + boi.env.Scope + "." + addr, {
        addr: addr,
        version: version,
        value: value
    })
}

export function glue2Var(addr, value = null, version = 0) {
    if (glue_managed.addrs[addr]) {
        glue_managed.addrs[addr].type = 'value'; //reset value
        return glue_managed.addrs[addr];
    }
    var shell = {
        symbol: SYM_GLUE2,
        type: "value",
        value: value,
        addr: addr,
        version: 0,
        ev: new ev.EventEmitter2(),
        set: glue2Set.bind(null, addr) //set to local & remote
    };
    var temp = {};
    temp[addr] = (shell);
    glue_managed.addrs = {
        ...glue_managed.addrs,
        ...temp
    }
    glue2ListenOnAddr(addr);
    glue2AskForUpdate(addr, 0, value);
    return shell;
}

export function glue2Ref(addr, value = null, version = 0) {
    if (glue_managed.addrs[addr]) {
        return glue_managed.addrs[addr];
    }
    var shell = {
        symbol: SYM_GLUE2,
        type: "remote_value",
        value: value,
        cmd_value: value,
        addr: addr,
        ev: new ev.EventEmitter2(),
        version: version,
        set: glue2Set.bind(null, addr) //set to remote only.
    };
    var temp = {};
    temp[addr] = (shell);
    glue_managed.addrs = {
        ...glue_managed.addrs,
        ...temp
    }
    glue2ListenOnAddr(addr);
    glue2AskForUpdate(addr, 0);
    return shell;
}

export function glue2RORef(addr, value = null, version = 0) {
    if (glue_managed.addrs[addr]) {
        return glue_managed.addrs[addr];
    }
    var shell = {
        symbol: SYM_GLUE2,
        type: "remote_value",
        value: value,
        cmd_value: value,
        addr: addr,
        ev: new ev.EventEmitter2(),
        version: version,
        set: () => { },
    };
    var temp = {};
    temp[addr] = (shell);
    glue_managed.addrs = {
        ...glue_managed.addrs,
        ...temp
    }
    glue2ListenOnAddr(addr);
    glue2AskForUpdate(addr, 0);
    return shell;
}

export function glue2RefSynced(addr, value = null, version = 0) {
    var syn = glue2Ref(addr, value, version);
    syn.synced = true;
    return syn;
}

////////HIGHER ORDER FUNCTIONS

/**
 * @template T
 * @param {T} obj 
 * @param {*} prefix 
 * @param {*} auto_expand 
 * @returns {T}
 */
export function glue2Object(obj, prefix = '/' + boi.env.Entity + '/', auto_expand = false) { //this one is pure evil
    var RAW = {};
    var R = vue.reactive(RAW); //final output
    console.warn("Glue_Object is DEPRECATED & DANGEROUS. It messes up your brain in long run.");
    var registered = {};
    function register(i) {
        if (registered[i]) return;
        registered[i] = true;
        var value = obj[i];
        if (typeof value == 'object' && value) {
            if (value.symbol == SYM_GLUE2) {
                //you've registered yourself
                _glue2Object_reg(i, value, R, RAW);
            }
            else {
                console.warn("Glue2 Does not support Nested Objects, They will be treated as single variable, deep changes are monitored & synced as one big chunk. Performance might suffer.");
                var o = glue2Var(prefix + i, obj[i]); //this might be used elsewhere already
                _glue2Object_reg(i, o, R, RAW);
                //this is marked glue obj, treat it seriously
            }
        }
        else if (typeof value == 'function') {
            console.error("Glue2 Does not function call yet.")
            throw new Error();
        }
        else {
            var o = glue2Var(prefix + i, obj[i]); //this might be used elsewhere already
            _glue2Object_reg(i, o, R, RAW);
        }
    }

    for (var i in obj) {
        register(i);
    }

    if (auto_expand) {
        vue.watch(R, () => {
            for (var i in R) {
                register(i);
            }
        });
    }
    return R;
}

function _glue2Object_reg(i, o, R, RAW) {

    R[i] = o.value;

    var is_remote = false;
    var _remote = i + "$";
    if (o.type == 'remote_value') {
        R[_remote] = o.value;
        R[i] = o.cmd_value;
        is_remote = true;
    }
    var stop_watch;
    var start_watch = function () {
        stop_watch = vue.watch(() => { return R[i] }, () => {
            // if (o.type == 'remote_value') {
            //     throw new Error("Remote value is read only");
            // }
            glue2Set(o.addr, R[i], true);
        }, { deep: true });
    }
    start_watch();
    o.ev.on("syncedByRemote", () => {
        //need update
        stop_watch();
        if (is_remote) {
            R[_remote] = o.value;
            if (o.synced) {
                R[i] = o.cmd_value;
            }
        }
        else {
            R[i] = o.value; //sync
            //prop to more users
            // glue_log("Re-Broadcasting", o.addr, R[i], o.version)
            glue2Sync(o.addr, R[i], o.version);
        }
        start_watch();
    })
    o.ev.on("changedByRemote", () => {
        //need update
        stop_watch();
        if (!is_remote) {
            R[i] = o.value; //sync
            glue2Sync(o.addr, R[i], o.version);
        } else {
            //ignore change
            if (o.synced) {
                R[_remote] = o.cmd_value;
            }
            R[i] = o.cmd_value;
        }
        start_watch();
    })
    o.ev.on("changedByLocal", () => {
        //do not prop
        stop_watch();
        R[i] = o.value; //sync
        glue2Sync(o.addr, R[i], o.version);
        start_watch();
    })

}
