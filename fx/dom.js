

export function domPageXYtoElementXY(px, py, element) {
    var rect = element.getBoundingClientRect();
    var scrollTop = document.documentElement.scrollTop ?
        document.documentElement.scrollTop : document.body.scrollTop;
    var scrollLeft = document.documentElement.scrollLeft ?
        document.documentElement.scrollLeft : document.body.scrollLeft;
    var elementLeft = rect.left + scrollLeft;
    var elementTop = rect.top + scrollTop;

    var x = px - elementLeft;
    var y = py - elementTop;

    return { x: x, y: y };
}



export function domElementXY(element) {
    var rect = element.getBoundingClientRect();
    var scrollTop = document.documentElement.scrollTop ?
        document.documentElement.scrollTop : document.body.scrollTop;
    var scrollLeft = document.documentElement.scrollLeft ?
        document.documentElement.scrollLeft : document.body.scrollLeft;
    var elementLeft = rect.left + scrollLeft;
    var elementTop = rect.top + scrollTop;
    return { x: elementLeft, y: elementTop };
}

export function domElementXYRect(element) {
    var rect = element.getBoundingClientRect();
    var scrollTop = document.documentElement.scrollTop ?
        document.documentElement.scrollTop : document.body.scrollTop;
    var scrollLeft = document.documentElement.scrollLeft ?
        document.documentElement.scrollLeft : document.body.scrollLeft;
    var elementLeft = rect.left + scrollLeft;
    var elementTop = rect.top + scrollTop;
    return { x: elementLeft, y: elementTop, w: rect.width, h: rect.height };
}