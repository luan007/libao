import * as ticker from "./ticker";

export var inputMouse = {
    init: false,
    pressed: false,
    x: 0,
    y: 0,
    eX: ticker.eased(0, 0, 0.1, 0.0000001),
    eY: ticker.eased(0, 0, 0.1, 0.0000001),
    _mappers: {}
};


//fornow, impl = stupid
function _input_enable_mappers(input, keys) {
    ticker.loop(() => {
        for (var k in keys) {
            var key = keys[k];
            if (!input["_mappers"][key]) {
                continue;
            }
            for (var i = 0; i < input["_mappers"][key].length; i++) {
                input["_mappers"][key][i].set(input[key]);
                input["_mappers"][key][i].update();
            }
        }
    });
}

export function inputMouseInit() {
    if (inputMouse.init) return;
    inputMouse.init = true;
    _input_enable_mappers(inputMouse, ["x", "y", "eX", "eY"]);
    document.addEventListener("mousemove", e => {
        inputMouse["x"] = e.x;
        inputMouse["y"] = e.y;
        inputMouse["eX"].target(e.x);
        inputMouse["eY"].target(e.y);
    });
}

export function inputMapped(input, key, mapper) {
    input["_mappers"] = input["_mappers"] || {};
    input["_mappers"][key] = input["_mappers"][key] || [];
    input["_mappers"][key].push(mapper);
    return mapper;
}