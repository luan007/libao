export function configFromHash() {
    var h = location.hash;
    if(!h) return {};
    h = decodeURIComponent(h);
    h = h.replace("#", "");
    h = h.split("&");
    var obj = {};
    for(var kv = 0; kv < h.length; kv++) {
        var flag = h[kv].split("=");
        if(flag.length == 1) {
            obj[flag[0]] = true;
        } else {
            obj[flag[0]] = flag[1];
        }
    }
    return obj;
}