import { vue } from "..";

export function mouseInput(domElement = document.body, mount = {
    absX: 0,
    absY: 0,
    x: 0,
    y: 0,
    pressed: 0,
    dragging: 0,
    focus: 0,
    hover: 0,

    acc_drag: {
        x: 0,
        y: 0,
        deltaX: 0,
        deltaY: 0,
        speed: 1
    },
    drag: {
        from: null,
        cur: null,
        result: null
    }
}) {
    var _prevX = 0;
    var _prevY = 0;
    function start_drag(e) {
        if (mount.dragging) return;
        mount.dragging = 1;

        mount.drag.cur = null;
        mount.drag.result = null;
        var snap = JSON.parse(JSON.stringify(mount));
        delete snap.drag;
        mount.drag.from = snap;

        _prevX = snap.x;
        _prevY = snap.y;
        mount.drag.cur = mount;
    }
    function compute_drag(e) {
        if (!mount.dragging) {
            return;
        }
        var dx = mount.x - _prevX;
        var dy = mount.y - _prevY;
        mount.acc_drag.x += dx * mount.acc_drag.speed;
        mount.acc_drag.y += dy * mount.acc_drag.speed;
        mount.acc_drag.deltaX = dx;
        mount.acc_drag.deltaY = dy;
        mount.drag.cur = mount;
        _prevX = mount.x;
        _prevY = mount.y;
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
    });
    domElement.addEventListener("mouseleave", (e) => {
        mount.focus = 0;
        stop_drag(true);
        mount.hover = (mount.focus && !mount.pressed) ? 1 : 0;
    });
    domElement.addEventListener("mousemove", (e) => {
        var w = e.srcElement.clientWidth;
        var h = e.srcElement.clientHeight;
        w = w || window.innerWidth;
        h = h || window.innerHeight;
        mount.absX = e.offsetX;
        mount.absY = e.offsetY;
        mount.x = e.offsetX / w;
        mount.y = e.offsetY / h;
        compute_drag();
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

export function mouseInputVueReactive(domElement = document.body, mount = vue.reactive({
    absX: 0,
    absY: 0,
    x: 0,
    y: 0,
    pressed: 0,
    dragging: 0,
    focus: 0,
    hover: 0,
    acc_drag: {
        x: 0,
        y: 0,
        deltaX: 0,
        deltaY: 0,
        speed: 1
    },
    drag: {
        from: null,
        cur: null,
        result: null
    }
})) {
    return mouseInput(domElement, mount);
}

export function keyboardInputActions(domElement = document.body, actions = {}) {
    domElement.addEventListener("keydown", (e) => {
        actions[
            e.key.toLowerCase()
        ] && actions[
            e.key.toLowerCase()
        ]();
    });
}