import * as three from "three";
import * as ev from "eventemitter3";
import { loop, ease } from "../core";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

// export * from "three/examples/jsm/modifiers/SubdivisionModifier"
import { Geometry } from "three/examples/jsm/deprecated/Geometry"


three.Geometry = Geometry; //this is the fix


var _vec = new three.Vector3();
var calc_vec = new three.Vector3();

export var threeDefaultCtx = {};

export function threeCameraFrustrum(ctx = threeDefaultCtx) {
    var frustrum = new three.Frustum();
    ctx.frustrum = frustrum;
}

export function threeUpdateFrustrum(ctx = threeDefaultCtx) {
    ctx.camera.updateMatrix(); // make sure camera's local matrix is updated
    ctx.camera.updateMatrixWorld(); // make sure camera's world matrix is updated
    ctx.camera.matrixWorldInverse.copy(ctx.camera.matrixWorld).invert();
    ctx.frustrum.setFromProjectionMatrix(new three.Matrix4().multiplyMatrices(ctx.camera.projectionMatrix, ctx.camera.matrixWorldInverse));
}

export function threeFrustrumVisible(vec, ctx = threeDefaultCtx) {
    return ctx.frustrum.containsPoint(vec);
}

export function threeUseRenderSeq(ctx) {
    ctx.renderSeq = ctx.renderSeq || [];
    return ctx.renderSeq;
}

export function threeDebugCube() {
    var m = new three.Mesh(new three.BoxGeometry(1, 1, 1), new three.MeshNormalMaterial());
    return m;
}

/**
 * @param {*} ctx 
 * @returns {three.Scene}
 */
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


export function threePerspectiveCamera(fov = 50, ctx = threeDefaultCtx, near = 0.1, far = 2000) {
    var renderer = ctx.renderer;
    var cam = new three.PerspectiveCamera(
        fov,
        renderer.width / renderer.height,
        near,
        far
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


export function threePerspectiveCameraNorm(fov = 50, ctx = threeDefaultCtx) {
    var renderer = ctx.renderer;
    var cam = new three.PerspectiveCamera(
        fov,
        renderer.width / renderer.height,
        0.1,
        1000
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
    var cam = new three.OrthographicCamera(renderer.width / -scale, renderer.width / scale, renderer.height / scale, renderer.height / -scale
        , 0.01, 503);
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

export function threeVec2ScreenRel(p, ctx = threeDefaultCtx) {
    calc_vec.set(p.x, p.y, p.z);
    var vec = calc_vec.project(ctx.camera);
    vec.y = vec.y * -1;
    vec.z = p.z;

    vec.y = vec.y * 0.5 + 0.5;
    vec.x = vec.x * 0.5 + 0.5;
    return vec;
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

//full of shit
export function threeVec2Screen(v, ctx = threeDefaultCtx) {
    return threeScreenPosition(v, ctx.camera, ctx.renderer);
}

export function threeVec2ScreenCentered(v, ctx = threeDefaultCtx) {
    var vec = threeScreenPosition(v, ctx.camera);
    vec.x = vec.x * ctx.renderer.width * 0.5;
    vec.y = vec.y * ctx.renderer.height * 0.5;
    return vec;
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

export function threeEaseQuat(q1, q2, e = 0.1, p = 0.00001) {
    q1.slerp(q2, e);
}

export function threeEaseQuatRaw(q1, q2, e = 0.1, p = 0.00001) {
    q1.x = ease(q1.x, q2.x, e, p);
    q1.y = ease(q1.y, q2.y, e, p);
    q1.z = ease(q1.z, q2.z, e, p);
    q1.w = ease(q1.w, q2.w, e, p);
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
    logarithmicDepthBuffer = false,
    antialias = true,
    width = 0,
    height = 0,
    autoSize = true,
    transparency = false,
    localClippingEnabled = false,
    clearColor = 0xff3333,
    canvas = null,
    autoClearColor = true,
    preserveDrawingBuffer = false,
    alpha = 1,
    dpi = window.devicePixelRatio,
    stencil = false,
    depth = true,
    appendTo = null
}, ctx = threeDefaultCtx) {
    var e = new ev.EventEmitter();
    var renderer = new three.WebGLRenderer({
        ...arguments[0]
    });
    renderer.autoSize = autoSize;
    renderer.setClearColor(clearColor, alpha);
    renderer.setPixelRatio(dpi);
    canvas = canvas || ctx.canvas;
    renderer.emit = e.emit.bind(e);
    console.log('Initializing ao-three', arguments[0]);
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

    renderer.localClippingEnabled = localClippingEnabled;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = three.PCFSoftShadowMap; // default THREE.PCFShadowMap
    ctx.renderer = renderer;
    canvas = renderer.domElement;
    ctx.canvas = canvas;
    if (appendTo) {
        appendTo.appendChild(renderer.domElement);
    }
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
    if (ctx.frustrum) {
        threeUpdateFrustrum(ctx);
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
    ctx.resources[key].anisotropy = 16;
    return ctx.resources[key];
}

/**
 * 
 * @param {*} path 
 * @param {*} key 
 * @param {*} ctx 
 * @returns {three.Texture}
 */
export async function threeLoadTextureAsync(path, key = 'GLTF_' + Math.random(), ctx = threeDefaultCtx) {
    ctx.resources = ctx.resources || {};
    ctx.resources[key] = await (new three.TextureLoader()).loadAsync(path)
    ctx.resources[key].encoding = three.sRGBEncoding;
    ctx.resources[key].anisotropy = 16;
    return ctx.resources[key];
}


export async function threeLoadGLTFAsync(path, key = 'Texture_' + Math.random(), ctx = threeDefaultCtx) {
    ctx.resources = ctx.resources || {};
    ctx.resources[key] = await (new GLTFLoader()).loadAsync(path)
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
import { Points } from "three";

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

export function threeGroup(gcb = (g) => { }) {
    var g = new three.Group();
    gcb(g);
    return g;
}


export function epsilon(value) {

    return Math.abs(value) < 1e-10 ? 0 : value;

}

export function threeMATtoCSSMAT(matrix) {

    var elements = matrix.elements;
    var matrix3d = 'matrix3d(' +
        epsilon(elements[0]) + ',' +
        epsilon(elements[1]) + ',' +
        epsilon(elements[2]) + ',' +
        epsilon(elements[3]) + ',' +
        epsilon(- elements[4]) + ',' +
        epsilon(- elements[5]) + ',' +
        epsilon(- elements[6]) + ',' +
        epsilon(- elements[7]) + ',' +
        epsilon(elements[8]) + ',' +
        epsilon(elements[9]) + ',' +
        epsilon(elements[10]) + ',' +
        epsilon(elements[11]) + ',' +
        epsilon(elements[12]) + ',' +
        epsilon(elements[13]) + ',' +
        epsilon(elements[14]) + ',' +
        epsilon(elements[15]) +
        ')';

    // if (isIE) {
    //     return 'translate(-50%,-50%)' +
    //         'translate(' + _widthHalf + 'px,' + _heightHalf + 'px)' +
    //         cameraCSSMatrix +
    //         matrix3d;

    // }

    return 'translate(-50%,-50%)' + matrix3d;
}




/**
 * @typedef {{mat: THREE.Object3D, color: THREE.Color}} three_instance
 */
export function threeInstancedMesh(geo, mat, count) {
    //get bunch of stuff, quick
    var instancedGeo = new three.InstancedMesh(geo, mat, count);

    /**
     * @type {three_instance[]}
     */
    var objects = [];
    for (var i = 0; i < count; i++) {
        objects.push({
            mat: new three.Object3D(),
            color: new three.Color()
        });
    }

    function apply() {
        for (var i = 0; i < count; i++) {
            objects[i].mat.updateMatrix();
            instancedGeo.setMatrixAt(
                i, objects[i].mat.matrix
            )
            instancedGeo.setColorAt(
                i, objects[i].color
            )
        }
        instancedGeo.instanceMatrix.needsUpdate = true;
        instancedGeo.instanceColor.needsUpdate = true;
    }

    /**
     * 
     * @param {(i: number, o: three_instance)=>any} fn 
     */
    function applyEach(fn) {
        for (var i = 0; i < count; i++) {
            fn(i, objects[i]);
            objects[i].mat.updateMatrix();
            instancedGeo.setMatrixAt(
                i, objects[i].mat.matrix
            )
            instancedGeo.setColorAt(
                i, objects[i].color
            )
        }
        instancedGeo.instanceMatrix.needsUpdate = true;
        instancedGeo.instanceColor.needsUpdate = true;
    }

    return {
        mesh: instancedGeo,
        update: apply,
        for: applyEach,
        objects: objects
    };
}


/**
 * @typedef {{pos: THREE.Vector3, color: THREE.Vector4}} three_pts_instance
 */






export function threePointCloud(mat, count, attributes = {}) {
    //get bunch of stuff, quick

    /**
     * @type {three_pts_instance[]}
     */
    var objects = [];
    for (var i = 0; i < count; i++) {
        objects.push({
            pos: new three.Vector3(),
            color: new three.Vector4(1, 1, 1, 1),
        });
    }

    var pointArray = [];
    var colorArray = [];

    for (var i = 0; i < count; i++) {
        pointArray.push(0, 0, 0);
        colorArray.push(1, 1, 1, 1);
    }

    var pointGeometry = new three.BufferGeometry();
    var pos_attr = new three.Float32BufferAttribute(pointArray, 3).setUsage(three.DynamicDrawUsage);
    var col_attr = new three.Float32BufferAttribute(colorArray, 4).setUsage(three.DynamicDrawUsage);
    pointGeometry.setAttribute('position', pos_attr);
    pointGeometry.setAttribute('color', col_attr);


    var attribute_map = {
        'v3': { l: 3, generator: () => new three.Vector3(), apply: (attr, i, obj) => { attr.setXYZ(i, obj.x, obj.y, obj.z) } },
        'v4': { l: 4, generator: () => new three.Vector4(), apply: (attr, i, obj) => { attr.setXYZW(i, obj.x, obj.y, obj.z, obj.w) } },
        'f': { l: 1, generator: () => 0, apply: (attr, i, obj) => { attr.setX(i, obj) } },
    };

    var arrs = {};
    var attrs = {};
    var attrMap = {};
    for (var a in attributes) {
        arrs[a] = [];
        var type = attribute_map[attributes[a]]
        for (var i = 0; i < count; i++) {
            objects[i][a] = type.generator();
            for (var l = 0; l < type.l; l++) {
                arrs[a].push(0);
            }
        }
        attrMap[a] = type;
        attrs[a] = new three.Float32BufferAttribute(arrs[a], type.l).setUsage(three.DynamicDrawUsage);
        pointGeometry.setAttribute(a, attrs[a]);
    }


    pointGeometry.computeBoundingSphere();

    function apply() {
        for (var i = 0; i < count; i++) {
            let pos = objects[i].pos;
            let col = objects[i].color;
            pos_attr.setXYZ(i, pos.x, pos.y, pos.z);
            col_attr.setXYZW(i, col.x, col.y, col.z, col.w);
            for (var a in attrs) {
                attrMap[a].apply(attrs[a], i, objects[i][a]);
            }
        }
        pos_attr.needsUpdate = true;
        col_attr.needsUpdate = true;
        for (var i in attrs) {
            attrs[i].needsUpdate = true;
        }
    }

    function get(i) {
        return objects[i];
    }

    /**
     * 
     * @param {(i: number, obj: three_pts_instance)=>{}} fn 
     */
    function applyEach(fn) {
        for (var i = 0; i < count; i++) {
            fn(i, objects[i]);
            let pos = objects[i].pos;
            let col = objects[i].color;
            pos_attr.setXYZ(i, pos.x, pos.y, pos.z);
            col_attr.setXYZW(i, col.x, col.y, col.z, col.w);
            for (var a in attrs) {
                attrMap[a].apply(attrs[a], i, objects[i][a]);
            }
        }
        pos_attr.needsUpdate = true;
        col_attr.needsUpdate = true;
        for (var i in attrs) {
            attrs[i].needsUpdate = true;
        }
    }

    return {
        mesh: new Points(pointGeometry, mat),
        apply: apply,
        for: applyEach,
        points: objects,
        get: get
    };
}


export function threeLines(mat, count, attributes = {}) {
    //get bunch of stuff, quick

    /**
     * @type {three_pts_instance[]}
     */
    var objects = [];
    for (var i = 0; i < count; i++) {
        objects.push({
            pos: new three.Vector3(),
            color: new three.Vector4(1, 1, 1, 1),
        });
    }

    var pointArray = [];
    var colorArray = [];

    for (var i = 0; i < count; i++) {
        pointArray.push(0, 0, 0);
        colorArray.push(1, 1, 1, 1);
    }

    var pointGeometry = new three.BufferGeometry();
    var pos_attr = new three.Float32BufferAttribute(pointArray, 3).setUsage(three.DynamicDrawUsage);
    var col_attr = new three.Float32BufferAttribute(colorArray, 4).setUsage(three.DynamicDrawUsage);
    pointGeometry.setAttribute('position', pos_attr);
    pointGeometry.setAttribute('color', col_attr);


    var attribute_map = {
        'v3': { l: 3, generator: () => new three.Vector3(), apply: (attr, i, obj) => { attr.setXYZ(i, obj.x, obj.y, obj.z) } },
        'v4': { l: 4, generator: () => new three.Vector4(), apply: (attr, i, obj) => { attr.setXYZW(i, obj.x, obj.y, obj.z, obj.w) } },
        'f': { l: 1, generator: () => 0, apply: (attr, i, obj) => { attr.setX(i, obj) } },
    };

    var arrs = {};
    var attrs = {};
    var attrMap = {};
    for (var a in attributes) {
        arrs[a] = [];
        var type = attribute_map[attributes[a]]
        for (var i = 0; i < count; i++) {
            objects[i][a] = type.generator();
            for (var l = 0; l < type.l; l++) {
                arrs[a].push(0);
            }
        }
        attrMap[a] = type;
        attrs[a] = new three.Float32BufferAttribute(arrs[a], type.l).setUsage(three.DynamicDrawUsage);
        pointGeometry.setAttribute(a, attrs[a]);
    }


    pointGeometry.computeBoundingSphere();

    function apply() {
        for (var i = 0; i < count; i++) {
            let pos = objects[i].pos;
            let col = objects[i].color;
            pos_attr.setXYZ(i, pos.x, pos.y, pos.z);
            col_attr.setXYZW(i, col.x, col.y, col.z, col.w);
            for (var a in attrs) {
                attrMap[a].apply(attrs[a], i, objects[i][a]);
            }
        }
        pos_attr.needsUpdate = true;
        col_attr.needsUpdate = true;
        for (var i in attrs) {
            attrs[i].needsUpdate = true;
        }
    }

    function get(i) {
        return objects[i];
    }

    /**
     * 
     * @param {(i: number, obj: three_pts_instance)=>{}} fn 
     */
    function applyEach(fn) {
        for (var i = 0; i < count; i++) {
            fn(i, objects[i]);
            let pos = objects[i].pos;
            let col = objects[i].color;
            pos_attr.setXYZ(i, pos.x, pos.y, pos.z);
            col_attr.setXYZW(i, col.x, col.y, col.z, col.w);
            for (var a in attrs) {
                attrMap[a].apply(attrs[a], i, objects[i][a]);
            }
        }
        pos_attr.needsUpdate = true;
        col_attr.needsUpdate = true;
        for (var i in attrs) {
            attrs[i].needsUpdate = true;
        }
    }

    return {
        mesh: new three.Line(pointGeometry, mat),
        apply: apply,
        for: applyEach,
        verts: objects,
        get
    };
}

