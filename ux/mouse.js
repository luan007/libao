export function mouseInput(domElement = document.body, mount = {
    absX: 0,
    absY: 0,
    x: 0,
    y: 0,
    pressed: 0,
    dragging: 0,
    focus: 0,
    hover: 0,
    drag: {
        from: null,
        cur: null,
        result: null
    }
}) {
    function start_drag(e) {
        if (mount.dragging) return;
        mount.dragging = 1;

        mount.drag.cur = null;
        mount.drag.result = null;
        var snap = JSON.parse(JSON.stringify(mount));
        delete snap.drag;
        mount.drag.from = snap;

        mount.drag.cur = mount;
    }
    function compute_drag(e) {
        if (!mount.dragging) {
            return;
        }
        mount.drag.cur = mount;
    }
    function stop_drag(abort) {
        if (mount.dragging) {
            mount.drag.cur = null; //bye
            var snap = JSON.parse(JSON.stringify(mount));
            delete snap.drag;
            mount.drag.result = snap;
        }
        mount.dragging = 0;
    }
    function compute_hover() {
        mount.hover = (mount.focus && !mount.pressed) ? 1 : 0;
    }
    domElement.addEventListener("mouseenter", (e) => {
        mount.focus = 1;
        compute_hover();
        compute_drag();
    });
    domElement.addEventListener("mouseleave", (e) => {
        mount.focus = 0;
        // stop_drag(true);
        mount.hover = (mount.focus && !mount.pressed) ? 1 : 0;
    });
    domElement.addEventListener("mousemove", (e) => {
        var w = domElement.clientWidth;
        var h = domElement.clientHeight;
        w = w || window.innerWidth;
        h = h || window.innerHeight;
        mount.absX = e.offsetX;
        mount.absY = e.offsetY;
        mount.x = e.offsetX / w;
        mount.y = e.offsetY / h;
    });
    domElement.addEventListener("mousedown", (e) => {
        mount.pressed = 1;
        compute_hover();
        start_drag(e);
    });
    domElement.addEventListener("mouseup", (e) => {
        mount.pressed = 0;
        compute_hover();
        stop_drag();
    });
    return mount;
}

//easy function

export var mouse = mouseInput();