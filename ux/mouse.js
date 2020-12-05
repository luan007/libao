import { vue } from "..";
import { domElementXYRect, domElementXY, domPageXYtoElementXY } from "../fx/dom";

export function mouseInput(domElement = document.body, mount = {
    absX: 0,
    absY: 0,
    x: 0,
    y: 0,
    pressed: 0,
    dragging: 0,
    focus: 0,
    hover: 0,

    wheelY: 0,
    wheelDeltaY: 0,
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
        if (e.currentTarget != domElement) return false;
        mount.focus = 1;
        compute_hover();
    }, true);
    domElement.addEventListener("mouseleave", (e) => {
        if (e.currentTarget != domElement) return false;
        mount.focus = 0;
        stop_drag(true);
        mount.hover = (mount.focus && !mount.pressed) ? 1 : 0;
    }, true);
    domElement.addEventListener("mousemove", (e) => {
        if (e.currentTarget != domElement) return false;
        // e.preventDefault();
        var epos = domElementXYRect(domElement);
        var abspos = domPageXYtoElementXY(e.pageX, e.pageY, domElement);
        var w = epos.w;
        var h = epos.h;
        w = w || window.innerWidth;
        h = h || window.innerHeight;
        mount.absX = abspos.x;
        mount.absY = abspos.y;
        mount.x = mount.absX / w;
        mount.y = mount.absY / h;
        compute_drag();
    }, true);
    domElement.addEventListener("mousedown", (e) => {
        if (e.currentTarget != domElement) return false;
        mount.pressed = 1;
        compute_hover();
        start_drag(e);
    }, true);
    domElement.addEventListener("mouseup", (e) => {
        if (e.currentTarget != domElement) return false;
        mount.pressed = 0;
        compute_hover();
        stop_drag();
    }, true);

    domElement.addEventListener("touchmove", (e) => {
        // e.preventDefault();
        if (e.currentTarget != domElement) return false;
        var epos = domElementXYRect(domElement);
        var abspos = domPageXYtoElementXY(e.touches[0].pageX, e.touches[0].pageY, domElement);
        var w = epos.w;
        var h = epos.h;
        w = w || window.innerWidth;
        h = h || window.innerHeight;
        mount.absX = abspos.x;
        mount.absY = abspos.y;
        mount.x = mount.absX / w;
        mount.y = mount.absY / h;
        // e.preventDefault(true);
        compute_drag();
    }, true);
    domElement.addEventListener("touchstart", (e) => {
        if (e.currentTarget != domElement) return false;
        mount.pressed = 1;
        // var w = domElement.clientWidth;
        // var h = domElement.clientHeight;
        // w = w || window.innerWidth;
        // h = h || window.innerHeight;
        // mount.absX = e.touches[0].screenX;
        // mount.absY = e.touches[0].screenY;
        // mount.x = mount.absX / w;
        // mount.y = mount.absY / h;



        var epos = domElementXYRect(domElement);
        var abspos = domPageXYtoElementXY(e.touches[0].pageX, e.touches[0].pageY, domElement);
        var w = epos.w;
        var h = epos.h;
        w = w || window.innerWidth;
        h = h || window.innerHeight;
        mount.absX = abspos.x;
        mount.absY = abspos.y;
        mount.x = mount.absX / w;
        mount.y = mount.absY / h;

        // // compute_hover();
        // // e.preventDefault();
        start_drag(e);
    }, true);
    domElement.addEventListener("touchend", (e) => {
        if (e.currentTarget != domElement) return false;
        mount.pressed = 0;
        // compute_hover();
        e.preventDefault();
        stop_drag();
    }, true);


    domElement.addEventListener("wheel", (e) => {
        mount.wheelDeltaY = e.deltaY;
        mount.wheelY += e.deltaY;
    })

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
    wheelY: 0,
    wheelDeltaY: 0,
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

export function keyboardTrackingState(domElement = document.body) {
    var state = {};
    domElement.addEventListener("keydown", (e) => {
        state[e.key.toLowerCase()] = 1;
    });
    domElement.addEventListener("keyup", (e) => {
        state[e.key.toLowerCase()] = 0;
    });
    return state;
}

export var keyboard = keyboardTrackingState();

export function keyboardInputActions(domElement = document.body, actions = {}) {
    domElement.addEventListener("keydown", (e) => {
        actions[
            e.key.toLowerCase()
        ] && actions[
            e.key.toLowerCase()
        ]();
    });
}