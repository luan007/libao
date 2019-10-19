import * as three from "three";

import * as post_pss from "postprocessing";

import {
    useGlobal
} from "./injector";
import {
    loop
} from "./ticker";
import {
    eventPub
} from "./events";
eval(useGlobal(["THREE"]));

// // export var threeScenes = {
// //     default: new THREE.Scene()
// // };
// // export var _threeCurrentScene = "default";

// // export function threeUseScene(id) {
// //     id = id || "default";
// //     threeScenes[id] = threeScenes[id] || new THREE.Scene();
// //     _threeCurrentScene = id;
// //     return threeScenes[id];
// // }

// // export function threeCurrentScene(id) {
// //     id = id || _threeCurrentScene;
// //     return threeScenes[id];
// // }

// export function threePerspectiveCamera(width, height, fov) {
//     var cam = new THREE.PerspectiveCamera(
//         fov || 50,
//         width / height,
//         0.1,
//         1000
//     );
//     threeCurrentScene().add(cam);
//     threeCurrentScene().camera = cam;
//     return cam;
// }

export function threeToGroup(stuff) {
    var g = new three.Group();
    if (Array.isArray(stuff)) {
        for (var i = 0; i < stuff.length; i++) {
            g.add(stuff[i]);
        }
    } else {
        g.add(stuff);
    }
    return g;
}

export var _cache = {};

export function threeScene() {
    var s = new three.Scene();
    _cache.scene = s;
    return s;
}

export function threeOrbitControl(options) {
    options = options || _cache;
    var controls = new THREE.OrbitControls(options.camera);
    controls.update();
    _cache.controls = controls;
    options.camera.position.set(options.x || 0, options.y || 0, options.z || 100);
    return controls;
}

export function threeOrthoCamera(scale, renderer) {
    scale = scale || 250;
    renderer = renderer || _cache.renderer;
    var cam = new three.OrthographicCamera(renderer.width / -scale, renderer.width / scale, renderer.height / scale, renderer.height / -scale, 0.0001, 10000);
    renderer.onResize((width, height) => {
        cam.left = -width / -scale;
        cam.right = width / -scale;
        cam.top = height / -scale;
        cam.bottom = -height / -scale;
        cam.updateProjectionMatrix();
    });

    _cache.camera = cam;
    return cam;
}

export function threeHalfClearPlane(renderer, opacity, z) {
    renderer.autoClearColor = false;
    var fadeMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: opacity
    });
    var fadePlane = new THREE.PlaneBufferGeometry(15555, 15555);
    var fadeMesh = new THREE.Mesh(fadePlane, fadeMaterial);
    // Put plane in front of camera
    fadeMesh.position.z = -1;

    // Make plane render before particles
    fadeMesh.renderOrder = -1;

    return fadeMesh;
}

export function threePerspectiveCamera(fov, renderer) {

    fov = fov || 50;
    renderer = renderer || _cache.renderer;

    var cam = new three.PerspectiveCamera(
        fov || 50,
        renderer.width / renderer.height,
        0.01,
        2000
    );

    renderer.onResize((width, height) => {
        cam.aspect = width / height;
        cam.updateProjectionMatrix();
    });
    _cache.camera = cam;
    return cam;
}

var _vec = new three.Vector3();
export function threeLocalToWorldNoModify(obj3d, vec) {
    _vec.x = vec.x;
    _vec.y = vec.y;
    _vec.z = vec.z;
    return obj3d.localToWorld(_vec);
}

export function threeRenderer(options) {
    options = options || {};
    options.antialias = true;
    options.transparency = true;

    if (!options.width && !options.height) {
        options.autoSize = true;
    }

    options.width = options.width || window.innerWidth;
    options.height = options.height || window.innerHeight;

    options.logarithmicDepthBuffer = options.logarithmicDepthBuffer == false ? false : true;
    var renderer = new three.WebGLRenderer(options);
    renderer.autoSize = options.autoSize;


    renderer.setClearColor(options.clearColor || 0, options.alpha || 1);
    renderer.setSize(options.width || window.innerWidth, options.height || window.innerHeight);
    renderer.height = options.height;
    renderer.width = options.width;


    var onResize = eventPub();
    renderer.onResize = onResize;
    if (options.autoSize) {
        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.height = window.innerHeight;
            renderer.width = window.innerWidth;
            renderer.onResize.emit(renderer.width, renderer.height);
        });
    }

    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = Math.pow(1, 4.0);
    _cache.renderer = renderer;
    return renderer;
}

export function threeComposer(renderer, scene, camera) {
    renderer = renderer || _cache.renderer;
    scene = scene || _cache.scene;
    camera = camera || _cache.camera;
    var composer = new THREE.EffectComposer(renderer);
    composer.setSize(renderer.width, renderer.height);
    renderer.onResize((width, height) => {
        composer.setSize(width, height);
    });
    _cache.composer = composer;
    return composer;
}

export function threePostprocessingStack(options) {
    options = options || _cache;
    options.composer = options.composer || _cache.composer;
    options.renderer = options.renderer || _cache.renderer;
    options.scene = options.scene || _cache.scene;
    options.camera = options.camera || _cache.camera;
    if (!options.composer) {
        options.composer = threeComposer();
    }
    var composer = options.composer;
    composer.addPass(new THREE.RenderPass(options.scene, options.camera));


    var effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
    effectFXAA.uniforms.resolution.value.set(1 / options.renderer.width, 1 / options.renderer.height);
    composer.addPass(effectFXAA);

    if (options.bloom) {
        var bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(options.renderer.width, options.renderer.height),
            options.bloom.strength || 0.5, options.bloom.radius || 0.5, options.bloom.threshold || 0.5
        );
        composer.bloom = bloomPass;
        composer.addPass(bloomPass);
    }

    options.renderer.onResize((width, height) => {
        effectFXAA.uniforms.resolution.value.set(1 / width, 1 / height);
    });

    // if (options.bokeh) {
    //     var bokehPass = new THREE.BokehPass(options.scene, options.camera, {
    //         focus: 0.01,
    //         aperture: 110.01,
    //         maxblur: 3,
    //         width: options.renderer.width,
    //         height: options.renderer.height
    //     });
    //     console.log(bokehPass);
    //     composer.bokeh = bokehPass;
    //     composer.addPass(bokehPass);
    // }


    var copyShader = new THREE.ShaderPass(THREE.CopyShader);
    copyShader.renderToScreen = true;
    composer.addPass(copyShader);
    return composer;
}


export function threeComposerEx(renderer, scene, camera) {
    renderer = renderer || _cache.renderer;
    scene = scene || _cache.scene;
    camera = camera || _cache.camera;
    var composer = new post_pss.EffectComposer(renderer, {
        depthTexture: true
    });
    composer.setSize(renderer.width, renderer.height);
    renderer.onResize((width, height) => {
        composer.setSize(width, height);
    });
    _cache.composer = composer;
    return composer;
}

export function threePostprocessingStackEx(options) {
    options = options || _cache;
    options.composer = options.composer || _cache.composer;
    options.renderer = options.renderer || _cache.renderer;
    options.scene = options.scene || _cache.scene;
    options.camera = options.camera || _cache.camera;
    if (!options.composer) {
        options.composer = threeComposerEx();
    }

    var composer = options.composer;
    var render_pass = new post_pss.RenderPass(options.scene, options.camera);
    render_pass.renderToScreen = false;
    composer.addPass(render_pass);

    if (options.bokeh) {

        const bokehEffect = new post_pss.RealisticBokehEffect({
            focus: 90.0,
            focalLength: 190,
            luminanceThreshold: 0.325,
            luminanceGain: 2.0,
            bias: -0.35,
            fringe: 0.7,
            maxBlur: 50,
            rings: 5,
            samples: 5,
            showFocus: false,
            manualDoF: false,
            pentagon: true
        });

        const bloomEffect = new post_pss.BloomEffect({
            blendFunction: post_pss.BlendFunction.ADD,
            resolutionScale: 0.5,
            distinction: 4.0
        });
        bloomEffect.blendMode.opacity.value = 2.1;


        var bokeh = new post_pss.EffectPass(options.camera, bokehEffect, bloomEffect);
        composer.bokeh = bokeh;
        composer.addPass(bokeh);
        bokeh.renderToScreen = true;
        window.bokeh = bokeh;
    }

    return composer;
}


export function threeUnrealPostprocessingStack(options) {
    options = options || {};
    options.bloom = options.bloom || {
        strength: 0.7,
        radius: 1,
        threshold: 0.7
    };
    return threePostprocessingStack(options);
}

export function threeLoop(options) {
    loop(() => {
        threeTick(options);
    });
}

export function threeAutoRotate(stuff, speedX, speedY, speedZ) {
    loop((t, dt) => {
        stuff.rotation.x += speedX * dt;
        stuff.rotation.y += speedY * dt;
        stuff.rotation.z += speedZ * dt;
    });
}

export function threeTick(options) {
    if (!options) {
        options = _cache;
    }
    if (options.composer) {
        //do post 
        options.composer.render();
    } else if (options.camera && options.scene && options.renderer) {
        options.renderer.render(options.scene, options.camera);
    }

    if (options.controls) {
        options.controls.update();
    }
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

export function threeEaseCameraProjection(cur, target, e, p) {
    // var cur = new three.PerspectiveCamera();
    var d = 0;
    d += threeEaseMat(cur.projectionMatrix, target.projectionMatrix, e, p);
    d += threeEaseMat(cur.projectionMatrix, target.projectionMatrix, e, p);
    // d += threeEaseMat(cur.matrixWorld, target.matrixWorld, e, p);
    return d;
}

//calculations


var calc_vec = new three.Vector3();
export function threeScreenPosition(p, q, n, camera, renderer) {
    var v = null;
    if (p instanceof three.Vector3) {
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
    camera = camera || _cache.camera;
    camera = camera == true ? _cache.camera : camera;
    renderer = renderer == true ? _cache.renderer : renderer;

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

export function threeVec2Screen(v) {
    return threeScreenPosition(v, _cache.camera, _cache.renderer);
}

export function threeVec2ScreenScale(v, w, h) {
    var vec = threeScreenPosition(v, _cache.camera);
    vec.x = vec.x * w * 0.5 + w * 0.5;
    vec.y = vec.y * h * 0.5 + h * 0.5;
    return vec;
}


//debug logic..
export function threeDebugBox() {
    var box = new three.BoxGeometry(1, 1, 1);
    var mat = new three.MeshBasicMaterial();
    return new three.Mesh(box, mat);
}


export function threePointCloud(count, options, distribution, colorFunc) {
    var geometry = new three.Geometry();
    var scale = options.scale;
    scale = scale == undefined ? 2 : scale;
    for (var i = 0; i < count; i++) {
        geometry.vertices.push(new three.Vector3(
            (Math.random() - 0.5) * scale,
            (Math.random() - 0.5) * scale,
            (Math.random() - 0.5) * scale));
        geometry.colors.push(new three.Color(1, 1, 1));
        if (distribution != undefined) {
            distribution(geometry.vertices[i], i);
        }
        if (colorFunc != undefined) {
            colorFunc(geometry.colors[i], i);
        }
    }
    var mat = new three.PointsMaterial(options);
    var m = new three.Points(geometry, mat);
    return m;
}

export function threeLineCloud(count, options, multiplier, distribution, colorFunc) {
    var geometry = new three.Geometry();
    var scale = options.scale || 2;
    multiplier = multiplier || 1;
    for (var i = 0; i < count; i++) {
        for (var t = 0; t < multiplier; t++) {
            geometry.vertices.push(new three.Vector3(
                (Math.random() - 0.5) * scale,
                (Math.random() - 0.5) * scale,
                (Math.random() - 0.5) * scale));
            geometry.colors.push(new three.Color(1, 1, 1));
            geometry.vertices.push(new three.Vector3(
                (Math.random() - 0.5) * scale,
                (Math.random() - 0.5) * scale,
                (Math.random() - 0.5) * scale));
            geometry.colors.push(new three.Color(1, 1, 1));

            if (distribution != undefined) {
                distribution([geometry.vertices[i * 2 * multiplier], geometry.vertices[i * 2 * multiplier + 1]], i);
            }
            if (colorFunc != undefined) {
                colorFunc([geometry.colors[i * 2 * multiplier], geometry.colors[i * 2 * multiplier + 1]], i)
            }
        }
    }
    var mat = new three.LineBasicMaterial(options);
    var m = new three.LineSegments(geometry, mat);
    return m;
}