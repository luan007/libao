import { connect, NatsError, headers, RequestOptions, StringCodec, NatsConnection, SubscriptionOptions, PublishOptions, Msg } from "nats.ws/lib/src/mod.js"
import { EventEmitter2 } from "eventemitter2";
import { nanoid } from "nanoid";

var env = {
    Scope: "raw",
    Entity: "entity_" + nanoid(5),
    Headers: {
        tid: nanoid(10),
        launchTime: Date.now()
    },
};

var join_busy = false;

var _cached_opts = {};

class scope {
    constructor({
        prefix = "", postfix = "", headers = {}
    }) {
        //TODO: this is stupid
        this.env = {
            prefix: prefix,
            postfix: postfix,
            headers: headers
        };

        //alias
        this.call = this.pub;
        this.dm = this.directMessage;
        this.bcast = this.broadcast;
    }

    transform_prefix(topic) {
        var _transform = this.env;
        return _transform.prefix + topic + _transform.postfix;
    }
    process_headers(headers_may_be) {
        var _transform = this.env;
        headers_may_be = headers_may_be || {};
        headers_may_be = {
            Scope: env.Scope,
            Entity: env.Entity,
            ...env.Headers,
            ..._transform.headers,
            ...headers_may_be
        }
        var hdrs = headers();
        for (var i in headers_may_be) {
            hdrs.append(i, headers_may_be[i].toString());
        }
        return hdrs;
    }

    /**
     * Subscribe to a Scoped Subject
     * 
     * - WITH connection check
     * 
     * @param {*} topic 
     * @param {(err: NatsError | null, msg: Msg) => void} cb 
     * @param {SubscriptionOptions} opts 
     */
    async sub(topic, cb, opts = {}) {
        return await later(() => {
            opts.json = opts.json == undefined ? true : opts.json;
            topic = this.transform_prefix(topic);
            console.log("Sub", topic);
            return boi.io.subscribe(topic, {
                ...opts,
                callback: cbParseSubject(opts.json ? cbJSON(cb) : cbString(cb)),
            })
        }, true)
    }

    /**
     * Subscribe Raw
     * 
     * - WITHOUT scope transformation.
     * - WITH connection check
     * 
     * @param {*} topic 
     * @param {(err: NatsError | null, msg: Msg) => void} cb 
     * @param {SubscriptionOptions} opts 
     */
    async sr(topic, cb, opts = {}) {
        return await later(() => boi.io.subscribe(topic, {
            ...opts,
            callback: cb,
        }), true)
    }

    /**
     * Publish to a Scoped Subject
     * 
     * - WITH connection check
     * 
     * @param {*} subject 
     * @param {any} data
     * @param {PublishOptions} opts 
     */
    async pub(subject, data, opts = {}) {
        return await later(() => {
            opts.json = opts.json == undefined ? true : opts.json;
            subject = this.transform_prefix(subject);
            opts.headers = this.process_headers(opts.headers);
            return boi.io.publish(subject, opts.json ? asJSON(data) : asString(data), {
                ...opts
            })
        })
    }


    /**
     * Send to Entity Channel
     * 
     * - WITH connection check
     * 
     * @param {*} subject 
     * @param {any} data
     * @param {PublishOptions} opts 
     */
    async directMessage(subject, to_id, data, opts = {}) {
        return await later(() => {
            opts.json = opts.json == undefined ? true : opts.json;
            subject = "dm." + to_id + "." + subject;
            opts.headers = this.process_headers(opts.headers);
            return boi.io.publish(subject, opts.json ? asJSON(data) : asString(data), {
                ...opts
            })
        })
    }


    /**
     * Broadcast within Scope
     * 
     * - WITH connection check
     * 
     * @param {*} subject 
     * @param {any} data
     * @param {PublishOptions} opts 
     */
    async broadcast(subject, data, opts = {}) {
        return await later(() => {
            opts.json = opts.json == undefined ? true : opts.json;
            subject = "bcast." + env.Scope + "." + subject;
            opts.headers = this.process_headers(opts.headers);
            return boi.io.publish(subject, opts.json ? asJSON(data) : asString(data), {
                ...opts
            })
        })
    }


    /**
     * Broadcast WITHOUT Scope
     * 
     * - WITH connection check
     * 
     * @param {*} subject 
     * @param {any} data
     * @param {PublishOptions} opts 
     */
    async ucast(subject, data, opts = {}) {
        return await later(() => {
            opts.json = opts.json == undefined ? true : opts.json;
            subject = "ucast." + subject;
            opts.headers = this.process_headers(opts.headers);
            return boi.io.publish(subject, opts.json ? asJSON(data) : asString(data), {
                ...opts
            })
        })
    }


    /**
     * EMIT to a Scoped Subject
     * 
     * PUBLISH ignoring connection status
     * 
     * - WITHOUT connection check
     * 
     * @param {*} subject 
     * @param {any} data
     * @param {PublishOptions} opts 
     */
    emit(subject, data, opts = {}) {
        opts.json = opts.json == undefined ? true : opts.json;
        subject = this.transform_prefix(subject);
        opts.headers = this.process_headers(opts.headers);
        return boi.io && boi.io.publish(subject, opts.json ? asJSON(data) : asString(data), {
            ...opts
        })
    }

    /**
     * Publish Raw
     * 
     * - WITHOUT scope transformation.
     * 
     * @param {*} subject 
     * @param {any} data
     * @param {PublishOptions} opts 
     */
    async pr(subject, data, opts = {}) {
        return await later(() => {
            opts.headers = this.process_headers(opts.headers);
            return boi.io.publish(subject, data, {
                ...opts
            })
        })
    }

    /**
     * Emit Raw
     * 
     * - WITHOUT connection check
     * - WITHOUT scope transformation.
     * 
     * @param {*} subject 
     * @param {any} data
     * @param {PublishOptions} opts 
     */
    er(subject, data, opts = {}) {
        subject = subject;
        opts.headers = this.process_headers(opts.headers);
        return boi.io && boi.io.publish(subject, data, {
            ...opts
        })
    }

    /**
     * Request from a Scoped Subject
     * 
     * - WITH connection check
     * 
     * @param {*} subject 
     * @param {any} data
     * @param {RequestOptions} opts 
     */
    async req(subject, data, opts = {}) {
        return await later(() => {
            opts.json = opts.json == undefined ? true : opts.json;
            subject = this.transform_prefix(subject);
            opts.headers = this.process_headers(opts.headers);
            return boi.io.request(subject, opts.json ? asJSON(data) : asString(data), {
                ...opts
            })
        }, true)
    }

    /**
     * Request Raw
     * 
     * - WITHOUT scope transformation.
     * - WITH connection check
     * 
     * @param {*} subject 
     * @param {any} data
     * @param {RequestOptions} opts 
     */
    async rr(subject, data, opts = {}) {
        return await later(() => {
            opts.headers = this.process_headers(opts.headers);
            return boi.io.request(subject, data, {
                ...opts
            })
        }, true)
    }


    /**
     * SERVE from a Scoped Subject
     * 
     * (For debug only, do not use in production.)
     * 
     * - WITH connection check
     * 
     * @param {*} topic 
     * @param {(in_data: any, resp: (r:any, opts?: PublishOptions)=>any, msg: Msg) => void} handler 
     * @param {SubscriptionOptions} opts 
     */
    async serve(topic, handler, opts = {}) {
        return await later(() => {
            opts.json = opts.json == undefined ? true : opts.json;
            topic = this.transform_prefix(topic);
            console.warn("Serving via WebSocket is not recommended. Performance suffers. <", topic, ">")
            return boi.io.subscribe(topic, {
                ...opts,
                callback: cbParseSubject((err, msg) => {
                    if (err) return;
                    return handler(opts.json ? toJSON(data) : toString(data), (reply_data, opts = {}) => {
                        // if (msg.reply) {
                        opts.headers = this.process_headers(opts.headers);
                        msg.respond(opts.json ? asJSON(data) : asString(data), opts);
                        // }
                    }, msg);
                })
            })
        }, true)
    }


    /**
     * REACT from a Scoped Subject 
     * 
     * (For debug only, do not use in production.)
     * 
     * - WITH connection check
     * 
     * @param {*} topic_in
     * @param {*} topic_out 
     * @param {(in_data: any, resp: (r: any, opts?: PublishOptions)=>any, msg: Msg) => void} handler 
     * @param {SubscriptionOptions} opts 
     */
    async react(topic_in, topic_out, handler, opts = {}) {
        return await later(() => {
            opts.json = opts.json == undefined ? true : opts.json;
            topic_in = this.transform_prefix(topic_in);
            topic_out = this.transform_prefix(topic_out);
            console.warn("Creating a reactor from", topic_in, " -> ", topic_out)
            return boi.io.subscribe(topic_in, {
                ...opts,
                callback: cbParseSubject((err, msg) => {
                    if (err) return;
                    return handler(opts.json ? toJSON(data) : toString(data), (reply_data, opts = {}) => {
                        // if (msg.reply) {
                        opts.headers = this.process_headers(opts.headers);
                        boi.io.publish(topic_out, opts.json ? asJSON(data) : asString(data), opts)
                        // }
                    }, msg);
                })
            })
        }, true)
    }



}

var base = new scope({});

export var boi = {
    env: env,
    state: new EventEmitter2({
        wildcard: true
    }),
    /**
     * @type {NatsConnection}
     */
    io: null,
    /**
     * @type {NatsConnection}
     */
    nc: null,
    ready: false,
    join: join,

    local: ["ws://localhost:1884"],
    remote: ["ws://emerge.systems:1884"],

    defaultServers: ["ws://localhost:1884", "ws://emerge.systems:1884"],
    codec: StringCodec(),

    cbBinary,
    cbJSON,
    cbString,

    asBinary,
    asJSON,
    asString,

    toBinary,
    toString,
    toJSON,

    cbParseSubject,

    rawScope: (prefix = "", postfix = "", headers = {}) => {
        return new scope({ prefix, postfix, headers });
    },

    scope: ({ headers = {}, API = "d", Scope = env.Scope, Entity = env.Entity }) => {
        Scope = Scope || env.Scope;
        Entity = Entity || env.Entity;
        API = API ? (API + ".") : API;
        Scope = Scope ? ("." + Scope + ".") : Scope;
        return new scope({
            headers: headers,
            prefix: API,
            postfix: Scope + Entity
        })
    },

    everything: ({ headers = {}, API = "*", Scope = "*", Entity = "*" }) => {
        Scope = Scope || env.Scope;
        Entity = Entity || env.Entity;
        API = API ? (API + ".") : API;
        Scope = Scope ? ("." + Scope + ".") : Scope;
        return new scope({
            headers: headers,
            prefix: API,
            postfix: Scope + Entity
        })
    },

    pub: bind(base.pub, base),
    emit: bind(base.emit, base),
    sub: bind(base.sub, base),
    req: bind(base.req, base),
    react: bind(base.react, base),
    serve: bind(base.serve, base),
    pr: bind(base.pr, base),
    sr: bind(base.sr, base),
    er: bind(base.er, base),
    rr: bind(base.rr, base),
    dm: bind(base.dm, base),
    directMessage: bind(base.directMessage, base),
    broadcast: bind(base.broadcast, base),
    bcast: bind(base.bcast, base),
    ucast: bind(base.ucast, base),


    messaging: {
        directMessage: new EventEmitter2({
            wildcard: true
        }),
        broadcast: new EventEmitter2({
            wildcard: true
        }),
        ucast: new EventEmitter2({
            wildcard: true
        })
    },

    setup: ({ Scope = env.Scope, Entity = env.Entity, Headers = env.Headers }) => {
        env.Scope = Scope;
        env.Entity = Entity;
        env.Headers = {
            ...env.Headers,
            ...Headers
        }
        return boi;
    },

    parseSubject: _parseSubject,
    toSubject: toSubject
};

global.boi = boi;


function enableMessaging() {

    var directMessage = boi.messaging.directMessage;
    var broadcast = boi.messaging.broadcast;
    var ucast = boi.messaging.ucast;

    base.sub("dm." + env.Entity + ".*", (err, msg) => {
        if (err) return;
        var ev = msg.subject.split(".")[2];
        directMessage.emit(ev, msg.body, msg)
    });

    base.sub("bcast." + env.Scope + ".*", (err, msg) => {
        if (err) return;
        var ev = msg.subject.split(".")[2];
        broadcast.emit(ev, msg.body, msg)
    });

    base.sub("ucast.*", (err, msg) => {
        if (err) return;
        var ev = msg.subject.split(".")[1];
        ucast.emit(ev, msg.body, msg)
    });

    console.warn("BOI.Messaging Channel enabled")
};


/**
 * @template T
 * @param {T} fn 
 * @returns {T}
 */
function bind(fn, src) {
    return fn.bind(src);
}


var reset_busy = false;
async function reset(e) {
    try {
        console.warn("Nat.IO Internal failure, bailing out!", e);
        if (reset_busy) {
            console.warn("Nat.IO Rebooting.. Busy", e);
            return;
        }
        reset_busy = true;

        try {
            boi.io.protocol.transport.close();
        }
        catch (e) {
        }

        if (boi.io) {
            // await boi.io.close(); 
            //nono dont touch!
        }
        boi.ready = false;
        boi.io.protocol.prepare();
        await boi.io.protocol.dialLoop();
        boi.io._closed = false;
        boi.io.protocol._closed = false; //hack
        reset_busy = false;
        boi.ready = true;
    } catch (e) {
        console.error(e);
    }
}


//this is for simulating socket.io like behaviour
//register before the connection is ready.
/**
 * @template T
 * @param {()=>T} fn 
 * @returns {Promise<T>}
 */
function later(fn, ensure) {
    return new Promise((res, rej) => {
        var captured_res = () => {
            try {
                if (boi.io.isClosed()) {
                    if (ensure) {
                        later(fn, true).then((r) => {
                            return res(r);
                        }).catch((e) => {
                            return rej(e);
                        });
                        reset(new Error("Closed!"));
                    }
                    else {
                        reset(new Error("Closed!"));
                        return rej("Internal Error")
                    }
                }
                else {
                    var result = fn();
                    return res(result);
                }
            }
            catch (e) {
                reset(e);
                return rej("Internal Error")
            }
        }
        if (boi.io) {
            return captured_res();
        }
        else {
            later.id = later.id || 0;
            var id = later.id++;
            // console.warn("BOI Registration is in queue. #" + id);
            boi.state.once("connect", () => {
                // console.warn("BOI Resolve #" + id);
                captured_res();
                // return res(fn());
            });
        }
    })
}


async function join(servers = boi.defaultServers, opts = {
    maxReconnectAttempts: -1,
    waitOnFirstConnect: true,
    noRandomize: true,
    noEcho: true,
    reconnectTimeWait: 500,
    pingInterval: 3 * 1000, //3s
    maxPingOut: 3,
}) {
    if (join_busy) {
        console.warn("Nat.IO Joining.. Busy", e);
        return;
    }
    join_busy = true;
    _cached_opts = {
        servers,
        opts
    };
    opts = {
        ...{
            noEcho: true,
            noRandomize: true,
            maxReconnectAttempts: -1,
            waitOnFirstConnect: true,
            reconnectTimeWait: 500,
            pingInterval: 3 * 1000, //3s
            maxPingOut: 3,
        },
        ...opts,
    }
    if (!Array.isArray(servers)) {
        servers = servers || boi.remote[0] //default server.
        servers = [servers];
    }
    opts.servers = servers;
    boi.io = await connect(opts);
    boi.io.protocol._close = async () => {
        //it never dies!
        //reset("Underlying structure breaks");
        reset("Underlying structure breaks");
    };

    var cc = boi.io.protocol.heartbeats.cancel.bind(boi.io.protocol.heartbeats);
    boi.io.protocol.heartbeats.cancel = (stale) => {
        if (stale) {
            //FUCK!
            cc(stale);
            console.warn("o gee.. No one cares?");
            if (boi.io.protocol.connected) {
                console.warn("no, you're not connected.");
                reset("Protocol hidden crash!");
            }
        }
        else {
            cc(stale);
        }
    }


    boi.nc = boi.io;
    _parse_states(boi.io);
    boi.state.on(["connect", "reconnect"], () => {
        boi.ready = true;
    })
    boi.state.on(["disconnect", "error"], () => {
        boi.ready = false;
    })
    enableMessaging();
    boi.state.emit("connect");
    join_busy = false;
    return boi;
}

//turns into events we like :)
async function _parse_states(conn) {
    for await (const s of conn.status()) {
        boi.state.emit(s.type, s.data);
    }
}


function asBinary(data) {
    return data;
}

function asString(data) {
    return boi.codec.encode(data);
}

function asJSON(data) {
    return asString(JSON.stringify(data));
}


function toBinary(data) {
    return data;
}

function toString(data) {
    return boi.codec.decode(data);
}

function toJSON(data) {
    return JSON.parse(toString(data));
}


function _parseSubject(subject) {
    var s = subject.split(".");
    var API = s[0];
    var Action = s[1];
    var Scope = s[2];
    var Entity = s[3];
    return {
        API, Action, Scope, Entity
    }
}

/**
 * 
 * @param {(err: NatsError: msg: Msg) => any} cb 
 * @returns {(err: NatsError: msg: Msg) => any}
 */
function cbParseSubject(cb) {
    return (err, msg) => {
        try {
            var parsed = _parseSubject(msg.subject);
            msg.api = parsed.API;
            msg.action = parsed.Action;
            msg.scope = parsed.Scope;
            msg.entity = parsed.Entity;
        }
        catch (e) {
            // console.warn("subject parsing failed", e)
        }
        cb(err, msg);
    }
}

function toSubject(API, Action, Scope, Entity) {
    return API + "." + Action + "." + Scope + "." + Entity;
}


/**
 * @param {(bin: Uint8Array, msg: Msg)} fn 
 * @returns 
 */
function cbBinary(fn) {
    return (err, msg) => {
        msg.body = msg.data;
        fn(err, msg);
    }
}

/**
 * @param {(str: String, msg: Msg)} fn 
 * @returns 
 */
function cbString(fn) {
    return (err, msg) => {
        if (!err) {
            msg.body = boi.codec.decode(msg.data)
            fn(err, msg)
        }
        else {
            fn(err, null);
        }
    }
}

/**
 * @param {(json: Object, msg: Msg)} fn 
 * @returns 
 */
function cbJSON(fn) {
    return (err, msg) => {
        if (!err) {
            try {
                msg.body = JSON.parse(boi.codec.decode(msg.data));
                fn(err, msg);
            }
            catch (e) {
                console.warn("Error in data format", e);
            }
        }
        else {
            fn(err, null);
        }
    }
}

// async function test() {
//     window.fire = (async () => {
//         await conn.publish("demo.req", codec.encode(
//             JSON.stringify({ test: 8 })
//         ))
//         return 6
//     })

//     try {

//         var data = await conn.request("demo.req", codec.encode(
//             JSON.stringify({ test: 5 })
//         ), { timeout: 1000 })
//         console.log(data);


//     } catch (e) {
//         console.log("Service Error - Code = ", e.code);
//     }

// }

// test();


