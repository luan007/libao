
export var _buffer_canvas = document.createElement('canvas');

export function imgToPixelData(img) {
    _buffer_canvas.width = img.width;
    _buffer_canvas.height = img.height;
    _buffer_canvas.getContext('2d').clearRect(0, 0, 10000, 10000);
    _buffer_canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
    return _buffer_canvas.getContext('2d').getImageData(0, 0, img.width, img.height).data;
}

export function imgToPixelBufferCanvasCtx() {
    return _buffer_canvas.getContext('2d');
}

export function imgToPixelData_BufferCanvasVisible(el, viz = false) {
    if (!_buffer_canvas.added) {
        (el || document.body).appendChild(_buffer_canvas);
        _buffer_canvas.style.position = "absolute";
        _buffer_canvas.style.transform = "translate(-50%, -50%)";
        _buffer_canvas.style.top = "50%";
        _buffer_canvas.style.left = "50%";
        _buffer_canvas.style.display = "block";
        _buffer_canvas.style.zIndex = 999999;
        _buffer_canvas.added = true;
    }
    _buffer_canvas.style.display = viz ? "block" : "none";
}

export function imgToPixelData_ShowBufferCanvas(el) {
    imgToPixelData_BufferCanvasVisible(el, true);
}

export function imgToPixelData_HideBufferCanvas(el) {
    imgToPixelData_BufferCanvasVisible(el, false);
}
