export function fetchJSON(v, cb) {
    var key = v.split('/').pop().replace(/\.json/gi, "");
    return fetch(v).then((r) => {
        // console.log("Loaded", v)
        return r.json()
    }).then((t) => {
        // console.log("Parsed", v)
        if(typeof(cb) == 'object') {
            cb[key] = t;
        } else {
            cb(key, t, v);
        }
    })
}
export function fetchText(v, cb) {
    var key = v.split('/').pop().replace(/\.json/gi, "");
    return fetch(v).then((r) => {
        // console.log("Loaded", v)
        return r.text()
    }).then((t) => {
        // console.log("Parsed", v)
        if(typeof(cb) == 'object') {
            cb[key] = t;
        } else {
            cb(key, t, v);
        }
    })
}