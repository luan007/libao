
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