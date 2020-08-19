import * as three from "three";
import * as ev from "eventemitter3";
import { loop, ease } from "../core";


var _vec = new three.Vector3();
var calc_vec = new three.Vector3();

export var threeDefaultCtx = {};

export function threeUseRenderSeq(ctx) {
    ctx.renderSeq = ctx.renderSeq || [];
    return ctx.renderSeq;
}

export function threeDebugCube() {
    var m = new three.Mesh(new three.BoxGeometry(1, 1, 1), new three.MeshNormalMaterial());
    return m;
}

export function threeScene(ctx = threeDefaultCtx) {
    ctx.scene = new three.Scene();
    return ctx.scene;
}

export function threeLocalToWorldNoModify(obj3d, vec) {
    _vec.x = vec.x;
    _vec.y = vec.y;
    _vec.z = vec.z;
    return obj3d.localToWorld(_vec);
}

export function threePerspectiveCamera(fov = 50, ctx = threeDefaultCtx) {
    var renderer = ctx.renderer;
    var cam = new three.PerspectiveCamera(
        fov,
        renderer.width / renderer.height,
        0.01,
        2000
    );
    renderer.onResize((width, height) => {
        cam.aspect = width / height;
        cam.updateProjectionMatrix();
    });
    cam.aspect = renderer.width / renderer.height;
    cam.updateProjectionMatrix();
    ctx.camera = cam;
    return cam;
};

export function threeOrthoCamera(scale, ctx = threeDefaultCtx) {
    scale = scale || 250;
    var renderer = ctx.renderer;
    var cam = new three.OrthographicCamera(renderer.width / -scale, renderer.width / scale, renderer.height / scale, renderer.height / -scale, 0.0001, 10000);
    renderer.onResize((width, height) => {
        cam.left = -width / -scale;
        cam.right = width / -scale;
        cam.top = height / -scale;
        cam.bottom = -height / -scale;
        cam.updateProjectionMatrix();
    });
    ctx.camera = cam;
    return cam;
}

export function threeHalfClearPlane({ motion_threshold = 0.1, opacity = 0.5, motion = null, color = 0 }, ctx = threeDefaultCtx) {
    var renderer = ctx.renderer;
    renderer.autoClearColor = false;

    console.warn("HalfClearPlane - Reminder - use preserveDrawingBuffer in renderer setup")

    var fadeMaterial = new three.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: opacity,
        side: three.DoubleSide,
    });
    var fadePlane = new three.PlaneBufferGeometry(15555, 15555);
    var fadeMesh = new three.Mesh(fadePlane, fadeMaterial);
    // Put plane in front of camera
    fadeMesh.position.z = -0.1;
    // Make plane render before particles
    fadeMesh.renderOrder = -1;

    var pre = new three.Vector3(1, 0, 0);
    var comp = new three.Vector3(1, 0, 0);

    if (Array.isArray(opacity) || motion != null) {
        var c = 0;
        opacity = Array.isArray(opacity) ? opacity : [opacity];
        loop(() => {
            pre.set(1, 0, 0);
            fadeMesh.localToWorld(pre);
            if (comp.distanceTo(pre) > motion_threshold) {
                fadeMaterial.opacity = ease(fadeMaterial.opacity, (motion ? motion : 1), 0.1, 0.00001);
                comp.copy(pre);
            }
            else {
                fadeMaterial.opacity = opacity[c]
                c++;
                if (c >= opacity.length) {
                    c = 0;
                }
            }
        });
    }
    return fadeMesh;
}

export function threeScreenPosition(p, q, n, camera, renderer) {
    var v = null;
    if (p && p.x != null) {
        calc_vec.set(p.x, p.y, p.z);
        camera = q;
        renderer = n;
        v = calc_vec;
    } else if (Array.isArray(p)) {
        calc_vec.set(p[0], p[1], p[2]);
        v = calc_vec;
        camera = q;
        renderer = n;
    } else {
        calc_vec.set(p, q, n);
    }

    var z = v.z;
    camera = camera || threeDefaultCtx.camera;
    camera = camera == true ? threeDefaultCtx.camera : camera;
    renderer = renderer == true ? threeDefaultCtx.renderer : renderer;

    var vec = calc_vec.project(camera);
    vec.y = vec.y * -1;
    vec.z = z;
    if (!renderer) {
        return vec;
    } else {
        vec.x = vec.x * renderer.width / 2 + renderer.width / 2;
        vec.y = vec.y * renderer.height / 2 + renderer.height / 2;
    }
    return vec;
}

export function threeVec2Screen(v, ctx = threeDefaultCtx) {
    return threeScreenPosition(v, ctx.camera, ctx.renderer);
}

export function threeVec2ScreenScale(v, w, h, ctx = threeDefaultCtx) {
    var vec = threeScreenPosition(v, ctx.camera);
    vec.x = vec.x * w * 0.5 + w * 0.5;
    vec.y = vec.y * h * 0.5 + h * 0.5;
    return vec;
}

export function threeEaseCameraProjection(cur, target, e, p) {
    // var cur = new three.PerspectiveCamera();
    var d = 0;
    d += threeEaseMat(cur.projectionMatrix, target.projectionMatrix, e, p);
    // d += threeEaseMat(cur.projectionMatrix, target.projectionMatrix, e, p);
    // d += threeEaseMat(cur.matrixWorld, target.matrixWorld, e, p);
    return d;
}

export function threeEaseMat(m1, m2, e, p) {
    p = p || 0.000001;
    e = e || 0.1;
    var d = 0;
    for (var el = 0; el < m1.elements.length; el++) {
        var delta = (m2.elements[el] - m1.elements[el]);
        if (Math.abs(delta) < p) {
            m1.elements[el] = m2.elements[el];
            continue;
        }
        m1.elements[el] += delta * e;
        d += Math.abs(delta);
    }
    return d;
}

export function threeLerpMat(mtarget, mfrom, mto, j) {
    for (var el = 0; el < mtarget.elements.length; el++) {
        mtarget.elements[el] =
            mfrom.elements[el] + (mto.elements[el] - mfrom.elements[el]) * j
    }
}

export var threeRendererCfg_HighPerf_PostFX = {
    powerPreference: "high-performance",
    antialias: false,
    stencil: false,
    depth: false,
    preserveDrawingBuffer: false
};

export function threeRenderer({
    logarithmicDepthBuffer = true,
    antialias = true,
    width = 0,
    height = 0,
    autoSize = true,
    transparency = true,
    clearColor = 0,
    canvas = null,
    autoClearColor = true,
    preserveDrawingBuffer = true,
    alpha = 1,
    dpi = window.devicePixelRatio
}, ctx = threeDefaultCtx) {
    var e = new ev.EventEmitter();
    var renderer = new three.WebGLRenderer({
        ...arguments[0]
    });
    renderer.autoSize = autoSize;
    renderer.setClearColor(clearColor, alpha);
    renderer.setPixelRatio(dpi);
    canvas = canvas || ctx.canvas;
    function fit(w, h) {
        renderer.setSize(w, h);
        renderer.height = h;
        renderer.width = w;
        e.emit("resize", w, h);
    }
    if (width > 0 || height > 0) {
        renderer.setSize(width, height);
        renderer.height = height;
        renderer.width = width;
    }
    else {
        fit(window.innerWidth, window.innerHeight);
    }
    ctx.fit = fit;
    renderer.fit = fit;
    renderer.onResize = (fn) => {
        fn(renderer.width, renderer.height);
        e.on("resize", fn);
    };
    if (autoSize) {
        window.addEventListener('resize', () => {
            fit(window.innerWidth, window.innerHeight);
        });
    }

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = three.PCFSoftShadowMap; // default THREE.PCFShadowMap
    ctx.renderer = renderer;
    canvas = renderer.domElement;
    ctx.canvas = canvas;
    return {
        renderer,
        canvas: renderer.domElement
    };
}

export function threeRenderFrame(ctx) {
    ctx.renderer.render(ctx.scene, ctx.camera);
}

export function threeTick(ctx = threeDefaultCtx) {
    var rendered = false;
    if (ctx.renderSeq) {
        ctx.renderSeq.forEach((v) => rendered |= !!(v()));
    }

    if (!rendered && ctx.camera && ctx.scene && ctx.renderer) {
        ctx.renderer.render(ctx.scene, ctx.camera);
    }
}

export function threeLoop(ctx = threeDefaultCtx) {
    loop(() => {
        threeTick(ctx);
    });
}


export function threeLoadTexture(path, key = 'Texture_' + Math.random(), ctx = threeDefaultCtx) {
    ctx.resources = ctx.resources || {};
    ctx.resources[key] = (new three.TextureLoader()).load(path)
    return ctx.resources[key];
}

export async function threeLoadTextureAsync(path, key = 'Texture_' + Math.random(), ctx = threeDefaultCtx) {
    ctx.resources = ctx.resources || {};
    ctx.resources[key] = await (new three.TextureLoader()).loadAsync(path)
    return ctx.resources[key];
}


export function threeLoadCubeTexture(urls, key = 'CubeTexture_' + Math.random(), ctx = threeDefaultCtx) {
    ctx.resources = ctx.resources || {};
    ctx.resources[key] = (new three.CubeTextureLoader()).load(urls)
    return ctx.resources[key];
}

export async function threeLoadCubeTextureAsync(urls, key = 'CubeTexture_' + Math.random(), ctx = threeDefaultCtx) {
    ctx.resources = ctx.resources || {};
    ctx.resources[key] = await (new three.CubeTextureLoader()).loadAsync(urls)
    return ctx.resources[key];
}

import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader"

export function threeLoadObj(url, key = 'Obj_' + Math.random(), ctx = threeDefaultCtx, cb) {
    ctx.resources = ctx.resources || {};
    cb = cb || (() => { });
    (new OBJLoader()).load(url, (obj) => {
        ctx.resources[key] = obj;
        cb(obj);
    })
}

export async function threeLoadObjAsync(url, key = 'Obj_' + Math.random(), ctx = threeDefaultCtx) {
    ctx.resources = ctx.resources || {};
    ctx.resources[key] = await (new OBJLoader()).loadAsync(url);
    return ctx.resources[key]
}



export function threeInstancedGeometry(geo) {
    geo.computeBoundingBox();
    geo.center();
    return (new three.InstancedBufferGeometry()).copy(geo)
}