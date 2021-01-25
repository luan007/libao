import {
    SMAAImageLoader,
    BlendFunction,
    KernelSize,
    BloomEffect,
    EffectComposer,
    EffectPass,
    RenderPass,
    SMAAEffect,
    SSAOEffect,
    NormalPass,
    // @ts-ignore
} from 'postprocessing'
import { threeDefaultCtx, threeUseRenderSeq } from "./three-util";
import * as postprocessing from "postprocessing";
import { HalfFloatType } from "three";
import * as three from "three";



import { HorizontalTiltShiftShader } from "./patch/HorizontalTiltShiftShader"
import { VerticalTiltShiftShader } from "./patch/VerticleTiltShiftShader"

import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass'
import { PatchedUnrealBloomPass } from "./patch/UnreallBloomPassPatched";
import { deltaTMultipler, loop } from '../core';

export function threeFXPatchEffect(proto) {
    if (proto.patched) return; //skip, already done!
    proto.patched = true;
    console.warn("AO-PATCH", "FX Patched for postprocessing lib", proto)
    proto.prototype = Object.assign(proto.prototype, {
        initialize() { },
        originalRender: proto.prototype.render,
        render(renderer, inputBuffer, outputBuffer, delta, maskActive) {
            this.originalRender(renderer, outputBuffer, inputBuffer, delta, maskActive);
        }
    });
    proto.prototype.setDepthTexture = () => {
        console.warn("Not implemented in patcher")
    };
    return proto;
}

export var threeFXComposer = ({ skipRenderPass = false }, ctx = threeDefaultCtx) => {
    var clock = new three.Clock();
    const composer = new EffectComposer(ctx.renderer, {
        frameBufferType: HalfFloatType,
        depthBuffer: true
    });
    ctx.composer = composer;
    ctx.clock = clock;
    threeUseRenderSeq(ctx).push(() => {
        var delta = clock.getDelta();
        composer.render(delta);
        return true;
    });
    if (!skipRenderPass) {
        threeFXRenderPass({}, ctx);
    }
    return composer;
};

export var threeFXAddPass = (pass, ctx = threeDefaultCtx) => {
    ctx.composer.addPass(pass);
    var params = {};
    return { pass: pass, params: params, update: () => { } };
};

export var threeFXRenderPass = ({
    material = null,
    clear = true,
}, ctx = threeDefaultCtx) => {
    var pass = new RenderPass(ctx.scene, ctx.camera, material);
    ctx.composer.addPass(pass);
    pass.clear = clear;
    var params = { material, clear };
    return { pass: pass, params: params, update: () => { } };
};

export var threeFXPreservedRenderPass = ({ material = null }, ctx = threeDefaultCtx) => threeFXRenderPass({ material, clear: false }, ctx)



export var threeFXUnrealPass = ({
    resolution = new three.Vector2(512, 512),
    threshold = 0.8,
    strength = 0.4,
    radius = 1,
    unifiedFactor = 0.5
}, ctx = threeDefaultCtx) => {
    threeFXPatchEffect(PatchedUnrealBloomPass);
    var pass = new PatchedUnrealBloomPass(resolution, strength, radius, threshold, unifiedFactor)
    ctx.composer.addPass(pass);
    var params = {
        resolution,
        threshold,
        strength,
        radius,
        unifiedFactor
    };
    return { pass: pass, params: params, update: () => { } };
};

export var threeFXFilmPass = ({
    noiseIntensity = 0.2,
    scanlineIntensity = 0,
    scanlineCount = 0,
    grayscale = false
}, ctx = threeDefaultCtx) => {
    threeFXPatchEffect(FilmPass);
    var pass = new FilmPass(noiseIntensity, scanlineIntensity, scanlineCount, grayscale);
    ctx.composer.addPass(pass);
    var params = {
        noiseIntensity, scanlineIntensity, scanlineCount, grayscale
    };
    return { pass: pass, params: params, update: () => { } };
};

export var threeFXEffect = (effect, params) => {
    //why? because we can!
    return { effect: new effect(params), params: params, update: () => { }, is_effect_shell: true };
}

export var threeFXToneMappingEffect = ({
    blendFunction = BlendFunction.NORMAL,
    adaptive = true,
    resolution = 256,
    middleGrey = 0.6,
    maxLuminance = 16.0,
    averageLuminance = 1.0,
    adaptationRate = 3.0
}) => threeFXEffect(postprocessing.ToneMappingEffect, {
    blendFunction, adaptationRate, resolution, middleGrey, maxLuminance, averageLuminance, adaptive
});

export var threeFXGammaCorrectionEffect = ({
    blendFunction = BlendFunction.NORMAL,
    gamma = 2.0
}) => threeFXEffect(postprocessing.GammaCorrectionEffect, {
    blendFunction, gamma
});


export var threeBCHCorrectionEffect = ({
    blendFunction = BlendFunction.NORMAL,
    brightness = .0,
    contrast = .0
}) => threeFXEffect(postprocessing.BrightnessContrastEffect, {
    blendFunction, brightness, contrast
});

export var threeFXSMAAEffect = ({
    edgeDetection = 0.01,
    searchImage,
    areaImage
}, ctx = threeDefaultCtx) => {
    if (!searchImage && !ctx.fx_smaa_textures) {
        throw "SMAA Effect requires ctx.fx_smaa_textures, load them first or manually set searchImage"
    }
    searchImage = searchImage || ctx.fx_smaa_textures[0];
    areaImage = areaImage || ctx.fx_smaa_textures[1];
    var params = {
        searchImage, areaImage, edgeDetection
    };
    const smaaEffect = new SMAAEffect(searchImage, areaImage)
    smaaEffect.colorEdgesMaterial.setEdgeDetectionThreshold(edgeDetection)
    smaaEffect.applyPreset(postprocessing.SMAAPreset.ULTRA)
    return { effect: smaaEffect, params: params, update: () => { }, is_effect_shell: true };
};

export var threeFXEffectPass = (arr_of_effects = [], ctx = threeDefaultCtx) => {
    var pure = [];
    arr_of_effects.forEach((v) => {
        pure.push(v.is_effect_shell ? v.effect : v);
    });
    var pass = new EffectPass(ctx.camera, ...pure);
    ctx.composer.addPass(pass);
    console.log(pass);
    var params = {};
    return { pass: pass, params: params, update: () => { } };
};

export var threeFXNormalPass = ({
    resolutionScale = 0.5
}, ctx = threeDefaultCtx) => {
    var params = { resolutionScale };
    var pass = new NormalPass(ctx.scene, ctx.camera);
    ctx.composer.addPass(pass);
    pass.resolution.scale = resolutionScale;
    ctx.composer_normal_pass = pass;
    return { pass: pass, params: params, update: () => { } };
}

export var threeFXTiltShiftPass = ({
    r = 0.5,
    focus_area = 1,
    hv_amount = 1,
    auto_loop = true
}, ctx = threeDefaultCtx) => {
    var params = {
        r, hv_amount, focus_area
    }
    var horShader = new three.ShaderMaterial(
        HorizontalTiltShiftShader
    );
    var verShader = new three.ShaderMaterial(
        VerticalTiltShiftShader
    );
    const hor = new postprocessing.ShaderPass(horShader, "tDiffuse");
    const ver = new postprocessing.ShaderPass(verShader, "tDiffuse");
    function update() {
        horShader.uniforms.h.value = 1 / window.innerWidth * params.hv_amount;
        verShader.uniforms.v.value = 1 / window.innerHeight * params.hv_amount;
        horShader.uniforms.r.value = params.r;
        verShader.uniforms.r.value = params.r;
        verShader.uniforms.f.value = params.focus_area;
        verShader.uniforms.f.value = params.focus_area;
    };
    update();
    if (auto_loop) {
        loop(update);
    }
    ctx.composer.addPass(hor);
    ctx.composer.addPass(ver);
    return { h: hor, v: ver, params: params, update: update };
};

export var threeFXSSAOEffect_PRESETS = {
    DBG: {
        blendFunction: BlendFunction.MULTIPLY,
        samples: 21, // May get away with less samples
        rings: 4, // Just make sure this isn't a multiple of samples
        distanceThreshold: 1.0,
        distanceFalloff: 0.0,
        rangeThreshold: 0.015, // Controls sensitivity based on camera view distance **
        rangeFalloff: 0.002,
        // luminanceInfluence = 0.9,
        luminanceInfluence: 0.1,
        radius: 20, // Spread range
        scale: 1.0, // Controls intensity **
        bias: 0.05,
        intensity: 100,
        fade: 0.001,
        color: new three.Color(1, 0, 0)
    },
    Splash_Large: {
        blendFunction: BlendFunction.MULTIPLY,
        samples: 21 / 3, // May get away with less samples
        rings: 4, // Just make sure this isn't a multiple of samples
        distanceThreshold: 1.0,
        distanceFalloff: 0.0,
        rangeThreshold: 0.015, // Controls sensitivity based on camera view distance **
        rangeFalloff: 0.002,
        // luminanceInfluence = 0.9,
        luminanceInfluence: 0.1,
        radius: 10, // Spread range
        scale: 1.0, // Controls intensity **
        bias: 0.05,
        intensity: 30,
        fade: 0.01,
        color: new three.Color(0, 0, 0)
    },
    Fake_Shadow: {
        blendFunction: BlendFunction.MULTIPLY,
        samples: 15, // May get away with less samples
        rings: 4, // Just make sure this isn't a multiple of samples
        distanceThreshold: 1.0,
        distanceFalloff: 0.0,
        rangeThreshold: 0.015, // Controls sensitivity based on camera view distance **
        rangeFalloff: 0.002,
        // luminanceInfluence = 0.9,
        luminanceInfluence: 0.1,
        radius: 10, // Spread range
        scale: 1.0, // Controls intensity **
        bias: 0.05,
        intensity: 10,
        fade: 0.001,
        color: new three.Color(0, 0, 0)
    },
    SuperDarkCorners: {
        blendFunction: BlendFunction.MULTIPLY,
        samples: 15, // May get away with less samples
        rings: 4, // Just make sure this isn't a multiple of samples
        distanceThreshold: 1.0,
        distanceFalloff: 0.0,
        rangeThreshold: 0.015, // Controls sensitivity based on camera view distance **
        rangeFalloff: 0.002,
        // luminanceInfluence = 0.9,
        luminanceInfluence: 0.1,
        radius: 5, // Spread range
        scale: 1, // Controls intensity **
        bias: 0.01,
        intensity: 500,
        fade: 0.001,
        color: new three.Color(0, 0, 0)
    },
    Default: {
        blendFunction: BlendFunction.MULTIPLY,
        samples: 18, // May get away with less samples
        rings: 4, // Just make sure this isn't a multiple of samples
        distanceThreshold: 1.0,
        distanceFalloff: 0.0,
        rangeThreshold: 0.015, // Controls sensitivity based on camera view distance **
        rangeFalloff: 0.002,
        // luminanceInfluence = 0.9,
        luminanceInfluence: 0.1,
        radius: 5, // Spread range
        scale: 1, // Controls intensity **
        bias: 0.01,
        intensity: 2,
        fade: 0.001,
        color: new three.Color(0, 0, 0)
    },
    DustEverywhere: {
        blendFunction: BlendFunction.MULTIPLY,
        samples: 6, // May get away with less samples
        rings: 4, // Just make sure this isn't a multiple of samples
        distanceThreshold: 1.0,
        distanceFalloff: 0.0,
        rangeThreshold: 0.015, // Controls sensitivity based on camera view distance **
        rangeFalloff: 0.002,
        // luminanceInfluence = 0.9,
        luminanceInfluence: 0.05,
        radius: 5, // Spread range
        scale: 1, // Controls intensity **
        bias: 0.01,
        intensity: 50,
        fade: 0.001,
        color: new three.Color(0, 0, 0),
        resolutionScale: 0.5 //fast
    },

    Fast_SSAO_Detail: {
        samples: 9,
        rings: 7,
        color: 0,
        intensity: 3,
        bias: 0.1,
        radius: 2,
        luminanceInfluence: 0.2
    },
    Fast_SSAO: {
        samples: 7,
        rings: 3,
        color: 0,
        intensity: 2,
        bias: 0.05,
        radius: 10,
        luminanceInfluence: 0.2
    }
};

export var threeFXSSAOEffect = ({
    blendFunction = BlendFunction.MULTIPLY,
    samples = 21, // May get away with less samples
    rings = 4, // Just make sure this isn't a multiple of samples
    distanceThreshold = 1.0,
    distanceFalloff = 0.0,
    rangeThreshold = 0.015, // Controls sensitivity based on camera view distance **
    rangeFalloff = 0.002,
    // luminanceInfluence = 0.9,
    luminanceInfluence = 0.1,
    radius = 20, // Spread range
    scale = 1.0, // Controls intensity **
    bias = 0.05,
    intensity = 10,
    fade = 0.001,
    resolutionScale = 0.5,
    color = new three.Color(1, 0, 0)
}, ctx = threeDefaultCtx) => {
    if (!ctx.composer_normal_pass) {
        throw 'please add NormalPass for SSAO to work'
    }
    var params = {
        blendFunction, samples, rings, distanceThreshold,
        distanceFalloff, rangeThreshold, rangeFalloff,
        luminanceInfluence, radius, scale, bias, intensity,
        resolutionScale,
        depthAwareUpsampling: true,
        distanceScaling: false,
        fade, color
    };
    const ssaoEffect = new SSAOEffect(ctx.camera, ctx.composer_normal_pass.renderTarget.texture,
        params);
    console.log(ssaoEffect);
    return { effect: ssaoEffect, params: params, update: () => { }, is_effect_shell: true };
};

export var threeFXBloomEffect = ({
    opacity = 1,
    blendFunction = BlendFunction.SCREEN,
    kernelSize = KernelSize.VERY_LARGE,
    luminanceThreshold = 0.9,
    luminanceSmoothing = 0.07,
    height = 600,
}, ctx = threeDefaultCtx) => {
    var params = {
        opacity,
        blendFunction,
        kernelSize,
        luminanceThreshold,
        luminanceSmoothing,
        height
    };
    const bloomEffect = new BloomEffect(params);
    return { effect: bloomEffect, params: params, update: () => { }, is_effect_shell: true };
};


export var threeFXSMAAEffect_GetImages = (ctx = threeDefaultCtx) => {
    var smaa = new SMAAImageLoader();
    return new Promise((res, rej) => {
        smaa.load((result) => {
            ctx.fx_smaa_textures = result;
            res(result);
        }, rej);
    })
}