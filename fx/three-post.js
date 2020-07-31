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

import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass'
import { PatchedUnrealBloomPass } from "./patch/UnreallBloomPassPatched";

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
    });
    ctx.composer = composer;
    ctx.clock = clock;
    threeUseRenderSeq(ctx).push(() => {
        composer.render(clock.getDelta());
        return true;
    });
    if (!skipRenderPass) {
        threeFXRenderPass(ctx);
    }
    return composer;
};

export var threeFXAddPass = (pass, ctx = threeDefaultCtx) => {
    ctx.composer.addPass(pass);
    var params = {};
    return { pass: pass, params: params, update: () => { } };
};

export var threeFXRenderPass = (ctx = threeDefaultCtx) => {
    var pass = new RenderPass(ctx.scene, ctx.camera);
    ctx.composer.addPass(pass);
    var params = {};
    return { pass: pass, params: params, update: () => { } };
};

export var threeFXUnrealPass = ({
    resolution = new three.Vector2(512, 512),
    threshold = 0.8,
    strength = 0.4,
    radius = 1
}, ctx = threeDefaultCtx) => {
    threeFXPatchEffect(PatchedUnrealBloomPass);
    var pass = new PatchedUnrealBloomPass(resolution, strength, threshold, radius)
    ctx.composer.addPass(pass);
    var params = {
        resolution,
        threshold,
        strength,
        radius
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

export var threeFXToneMappingEffect = () => threeFXEffect(postprocessing.ToneMappingEffect, {
    blendFunction: BlendFunction.NORMAL,
    adaptive: true,
    resolution: 256,
    middleGrey: 0.6,
    maxLuminance: 16.0,
    averageLuminance: 1.0,
    adaptationRate: 3.0
});

export var threeFXSMAAEffect = ({
    edgeDetection = 0.1,
    searchImage,
    areaImage
}, ctx = threeDefaultCtx) => {
    const smaaEffect = new SMAAEffect(searchImage, areaImage)
    smaaEffect.colorEdgesMaterial.setEdgeDetectionThreshold(edgeDetection)
    return { pass: smaaEffect, params: params, update: () => { } };
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

export var threeFXNormalPass = (ctx = threeDefaultCtx) => {
    var params = {};
    var pass = new NormalPass(ctx.scene, ctx.camera);
    ctx.composer.addPass(pass);
    ctx.composer_normal_pass = pass;
    return { pass: pass, params: params, update: () => { } };
}

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
    color = new three.Color(1, 0, 0)
}, ctx = threeDefaultCtx) => {
    if (!ctx.composer_normal_pass) {
        throw 'please add NormalPass for SSAO to work'
    }
    var params = {
        blendFunction, samples, rings, distanceThreshold,
        distanceFalloff, rangeThreshold, rangeFalloff,
        luminanceInfluence, radius, scale, bias, intensity,
        fade, color
    };
    const ssaoEffect = new SSAOEffect(ctx.camera, ctx.composer_normal_pass.renderTarget.texture,
        params);
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
