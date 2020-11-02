import socketio from "socket.io-client"
import { glueEv, glueApplyControl, glueDef } from "./glue";

//TODO check if path is valid
export function init(path) {
    path = path.endsWith("/") ? path.substring(0, path.length - 1) : path;
    var io = socketio(path + "/glue");
    glueEv.on("*", (e) => {
        io.emit("up", e); //
        //so local ev bubbles up (always)
        //
    });
    io.on('hello', () => {
        io.emit("def", glueDef);
        for (var i in glueDef) {
            var q = glueDef[i]
            if (q.type == "value") {
                q.emit();
            }
        }
    });
    io.on('controlled', (e) => {
        try {
            glueApplyControl(e);
        } catch (e) {
            console.warn(e); //stupid for now, TODO: fix this
        }
    });
}