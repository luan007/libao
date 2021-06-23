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