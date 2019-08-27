import p5 from "p5";
import "p5/lib/addons/p5.sound";
var _img_to_load = 0;
var _global_init = false;


var _shadowP5 = p5Init();

export function p5LoadImage(path) {
    _img_to_load++;
    return _shadowP5.loadImage(path, _p5Hook);
}

var cbs = [];

export function p5Onload(cb) {
    cbs.push(cb);
}

function _p5Hook() {
    _img_to_load--;
    if (_img_to_load <= 0) {
        _img_to_load = 0;
        while (cbs.length) {
            cbs.pop()();
        }
    }
}

export function p5InitGlobal(setup, draw) {
    if (_global_init) return;
    _global_init = true;
    window.setup = setup || (() => {});
    window.draw = draw || (() => {});
}

export function p5Init(domParent) {
    var myp5 = new p5(() => {}, domParent);
    myp5.setup = () => {
        console.warn("Warning, please override p5 setup function");
    };
    return myp5;
}

export function p5InitShaderPreview(frag, w, h, domParent) {
    var i = p5Init(domParent);
    var end = {
        pass: null,
        uniforms: {},
        update: function () {},
        p5: i
    };
    i.setup = function () {
        i.createCanvas(w, h);
        end.pass = p5CreateShaderPass(i, frag, w, h);
    }
    i.pass = end.pass;
    i.draw = function () {
        end.update ? end.update() : null;
        end.pass.render(end.uniforms);
        i.image(end.pass, 0, 0);
    }
    return end;
}

export function p5BaseVertexShader() {
    return `
        //src: https://github.com/aferriss/p5jsShaderExamples/blob/gh-pages/4_image-effects/4-11_bloom/base.vert
        // our vertex data
        attribute vec3 aPosition;
        attribute vec2 aTexCoord;

        // lets get texcoords just for fun! 
        varying vec2 vTexCoord;

        void main() {
        // copy the texcoords
        vTexCoord = aTexCoord;

        // copy the position data into a vec4, using 1.0 as the w component
        vec4 positionVec4 = vec4(aPosition, 1.0);
        // positionVec4.xy = positionVec4.xy * 2.0 - 1.0;

        // send the vertex information on to the fragment shader
        gl_Position = positionVec4;
        }
    `;
}

export function p5CreateShader(p5Instance, frag, vert) {
    var shader = p5Instance.createShader(vert || p5BaseVertexShader(), frag);
    return shader;
}

export function p5ShaderQuad(p5Instance, shader, uniforms) {
    p5Instance.shader(shader);
    if (uniforms) {
        for (var i in uniforms) {
            shader.setUniform(i, uniforms[i]);
        }
    }
    p5Instance.quad(-1, -1, 1, -1, 1, 1, -1, 1);
}

export function p5CreateShaderPass(p5Instance, frag, w, h) {
    w = w || p5Instance.width;
    h = h || p5Instance.height;
    var g = p5Instance.createGraphics(w, h, p5Instance.WEBGL);
    var shader = g.createShader(p5BaseVertexShader(), frag);
    g.noStroke();
    g.uniforms = {};
    g.render = function (uniforms) {
        var obj = uniforms || g.uniforms;
        p5ShaderQuad(g, shader, obj);
    }
    return g;
}