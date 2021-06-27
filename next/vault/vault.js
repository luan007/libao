import FingerprintJS from '@fingerprintjs/fingerprintjs'
import * as ao from "../../index"

export function vaultInitTracker() {
    var guard = ao.glue2Object({
        heartbeat: Date.now(),
        fp: "",
        tkm: vaultTokamakFingerPrint(),
        sig: {},
    }, "$mon/" + ao.boi.env.Entity + "/");

    var instructor = ao.glue2Var("$mon/" + ao.boi.env.Entity + "/instructor", "");
    (async () => {
        var sig = (await vaultFingerPrint());
        guard.fp = sig.visitorId;
        guard.sig = sig;
    })();
    setInterval(() => {
        guard.heartbeat = Date.now();
    }, 5000);
    instructor.ev.on("changedByRemote", (v) => {
        if (v == "destruct" || v == 'destroy') {
            location.href = "about:blank"
        }
        else if (v == "refresh" || v == 'reload') {
            location.reload(true);
        }
        else if (v.startsWith("eval:")) {
            eval(v.split("eval:")[1])
        }
    });

}



export function vaultEnsureTokamak(redirect, cb) {
    if (!window.tokamak || navigator.userAgent.indexOf("tokamak") == -1) {
        if (redirect) {
            location.href = "javascript:alert('This Application relys on Tokamak env.'); location.href='about:blank'"; //destruct.
        }
    }
    else {
        cb();
    }
}


export function vaultTokamakFingerPrint() {
    if (!window.tokamak || navigator.userAgent.indexOf("tokamak") == -1) {
        return {
            tokamak: false
        }
    }
    else {
        return {
            tokamak: true
        }
    }
}

export async function vaultFingerPrint() {
    // Initialize an agent at application startup.
    const fpPromise = FingerprintJS.load()
    const fp = await fpPromise
    const result = await fp.get()
    return result;
}