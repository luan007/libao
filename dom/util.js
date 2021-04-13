
/**
 * Loads Image Async, returns Promise
 * @param {*} url 
 * @returns {Promise<Image>}
 */
export function loadImageAsync(url) {
    return new Promise((res, rej) => {
        var i = new Image();
        i.crossOrigin = "anonymous";
        i.src = url;
        var _rej = (e) => {
            console.log(e);
            rej(e);
        }
        i.onload = function () {
            res(i);
        }
        i.onerror = _rej;
        i.onabort = _rej;
    })
}

export function cssInjectVariables(vars, units = null, prepend = "", elem = document.body) {
    units = (units || vars.units) || {};
    for(var i in vars) {
        if(i == 'units') continue;
        elem.style.setProperty("--" + prepend + i, vars[i] + (units[i] || ""));
    }
}


export function loadImageAsCanvasAsync(url) {
    return new Promise((res, rej) => {
        var i = new Image();
        i.crossOrigin = "anonymous";
        i.src = url;
        var _rej = (e) => {
            console.log(e);
            rej(e);
        }
        i.onload = function () {
            setTimeout(() => {
                res(
                    preheatIntoCanvas(i)
                );
            }, 1)
        }
        i.onerror = _rej;
        i.onabort = _rej;
    })
}

var _preheat = document.createElement("canvas");
var _preheatCtx = _preheat.getContext('2d');
export function preheatImage(image) {
    _preheatCtx.drawImage(image, 0, 0);
    image.style.visible = "hidden"
}

export function preheatIntoCanvas(image) {
    var cv = document.createElement("canvas");
    cv.height = image.height;
    cv.width = image.width;
    var ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(image, 0, 0);
    return cv;
}