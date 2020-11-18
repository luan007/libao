import io from "socket.io-client"
var _glue_mirror_default = undefined;

export function init(path, attention = {}) {
    var sock = io(path + "/glue");
    var server = {
        def: {},
        flat: {
            ...attention
        },
        sock: sock
    };
    _glue_mirror_default = _glue_mirror_default || server;
    sock.on("def-relay", (d) => {
        server.def = d;
        for (var i in server.def) {
            if (server.def[i].type == 'value') {
                server.flat[server.def[i].path] = server.flat[server.def[i].path] || server.def[i].value;
            }
        }
    });
    sock.on("up-relay", (delta) => {
        try {
            if (delta.type == "value_changed") {
                if (server.def[delta.path]) {
                    server.def[delta.path].value = delta.new_val;
                }
                server.flat[delta.path] = delta.new_val;
                // console.log('vl', delta);
            }
            else {
                // console.log('ev', delta);
            }
        }
        catch (e) {
            console.log('doom', e);
        }
    });
    sock.emit("req-sync");
    return server;
}

export function cmd(cmd = {
    type: "action",
    path: x.path,
    args: []
}, ctx = _glue_mirror_default) {
    var sock = ctx.sock;
    sock.emit("control", cmd)
}
export function value(path, value, ctx = _glue_mirror_default) {
    cmd({
        type: "value_set",
        path: path,
        new_val: value
    }, ctx)
}

export function action(path, args, ctx = _glue_mirror_default) {
    cmd({
        type: "action",
        path: path,
        args: args
    }, ctx)
}

export function event(path, data, ctx = _glue_mirror_default) {
    cmd({
        type: "event",
        path: path,
        data: data
    }, ctx)
}