//https://www.clicktorelease.com/code/spherical-normal-mapping/#

import * as three from "three";
import * as matcap_shaders from "./shaders/matcap/*.glsl";

export function threeRecomputeNormal(geometry, flat = false) {
    geometry.verticesNeedUpdate = true;
    geometry.normalsNeedUpdate = true;
    geometry.uvsNeedUpdate = true;
    // geometry.computeCentroids();
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    // geometry.computeTangents();
}



export function threeAdvancedMatcapMaterial({
    normalTexture = null,
    matcapTexture = null,
    time = 0,
    bump = 0,
    noise = 0.04,
    repeat = new three.Vector2(1, 1),
    useNormal = 1,
    useRim = 1,
    rimPower = 2,
    useScreen = 0,
    normalScale = .5,
    normalRepeat = 1,
    shading = three.SmoothShading,
    side = three.DoubleSide,
}) {
    var uniforms = {
        tNormal: { type: 't', value: normalTexture },
        tMatCap: { type: 't', value: matcapTexture },
        time: { type: 'f', value: time },
        bump: { type: 'f', value: bump },
        noise: { type: 'f', value: noise },
        repeat: { type: 'v2', value: repeat },
        useNormal: { type: 'f', value: useNormal },
        useRim: { type: 'f', value: useRim },
        rimPower: { type: 'f', value: rimPower },
        useScreen: { type: 'f', value: useScreen },
        normalScale: { type: 'f', value: normalScale },
        normalRepeat: { type: 'f', value: normalRepeat }
    };
    return new three.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: matcap_shaders.vert,
        fragmentShader: matcap_shaders.frag,
        wrapping: three.ClampToEdgeWrapping,
        shading: shading,
        side: side
    });
}

// material =;

// material.uniforms.tMatCap.value.wrapS = material.uniforms.tMatCap.value.wrapT = 
// THREE.ClampToEdgeWrapping;

// material.uniforms.tNormal.value.wrapS = material.uniforms.tNormal.value.wrapT = 
// THREE.RepeatWrapping;

