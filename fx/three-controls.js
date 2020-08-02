import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { threeDefaultCtx, threeUseRenderSeq } from "./three-util";
import * as three from "three";

export function threeOrbitControl({
    domElement = null,
    minDistance = 0,
    maxDistance = Infinity,

    minZoom = 0,
    maxZoom = Infinity,

    minPolarAngle = -Infinity,
    maxPolarAngle = Infinity,

    minAzimuthAngle = -Infinity,
    maxAzimuthAngle = Infinity,

    enableDamping = true,
    dampingFactor = 0.09,
    enableZoom = true,
    zoomSpeed = 1,
    enableRotate = true,
    rotateSpeed = 1,

    enablePan = true,
    panSpeed = 1,
    screenSpacePanning = true,
    keyPanSpeed = 1,

    autoRotate = false,
    autoRotateSpeed = 0,
    target = new three.Vector3(0, 0, 0),
    camPos = new three.Vector3(0, 0, 10),
}, ctx = threeDefaultCtx) {
    //document.body is not used
    domElement = domElement ? domElement : ctx.renderer.domElement;
    var controls = new OrbitControls(ctx.camera, domElement);
    var params = {
        domElement,
        minDistance,
        maxDistance,

        minZoom,
        maxZoom,

        minPolarAngle,
        maxPolarAngle,

        minAzimuthAngle,
        maxAzimuthAngle,

        enableDamping,
        dampingFactor,
        enableZoom,
        zoomSpeed,
        enableRotate,
        rotateSpeed,

        enablePan,
        panSpeed,
        screenSpacePanning,
        keyPanSpeed,

        autoRotate,
        autoRotateSpeed,
        target,
        camPos,
        object: ctx.camera
    };
    params.object = ctx.camera;

    function apply(params) {
        for (var i in params) {
            if (i == 'target') {
                controls.target.copy(params.target);
                continue;
            }
            controls[i] = params[i];
        }
        controls.update();
    }
    ctx.camera.position.set(params.camPos.x, params.camPos.y, params.camPos.z);
    controls.update();
    threeUseRenderSeq(ctx).push(() => {
        controls.update();
    });
    window.controls = controls;
    apply(params);

    return {
        control: controls,
        update: () => { apply(params); },
        params: params
    };
}