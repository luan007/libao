import * as io from "socket.io-client";

//we only support one transport layer

export function NX_Transport({
    addr = 'http://localhost:3000'
}) {

    this.io = io(addr);
    this.io.connect();

    this.rpc = () => {
        
    };

    return this;
}


