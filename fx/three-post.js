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
import { threeDefaultCtx } from "./three-util";
import * as postprocessing from "postprocessing";
import { HalfFloatType } from "three";
import * as three from "three";

import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass'
import { PatchedUnrealBloomPass } from "./patch/UnreallBloomPassPatched";


PatchedUnrealBloomPass.prototype = Object.assign(PatchedUnrealBloomPass.prototype, {
    initialize() { },
    originalRender: PatchedUnrealBloomPass.prototype.render,
    render(renderer, inputBuffer, outputBuffer, delta, maskActive) {
        this.originalRender(renderer, outputBuffer, inputBuffer, delta, maskActive);
    }
});

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
    return proto;
}

export var threeFXComposer = (ctx = threeDefaultCtx) => {
    var clock = new three.Clock();
    const composer = new EffectComposer(ctx.renderer, {
        frameBufferType: HalfFloatType,
    });
    ctx.composer = composer;
    ctx.clock = clock;
    ctx.alterRender = () => {
        composer.render(clock.getDelta());
    };
    return composer;
};

export var threeFXAddPass = (pass, ctx = threeDefaultCtx) => {
    ctx.composer.addPass(pass);
    var params = {};
    return { pass: pub, params: params, update: () => { } };
};

export var threeFXRenderPass = (ctx = threeDefaultCtx) => {
    var pass = new RenderPass(ctx.scene, ctx.camera);
    ctx.composer.addPass(pass);
    var params = {};
    return { pass: pub, params: params, update: () => { } };
};

export var threeFXUnrealPass = ({
    resolution = new three.Vector2(512, 512),
    threshold = 0.8,
    strength = 0.4,
    radius = 1
}, ctx = threeDefaultCtx) => {
    threeFXPatchEffect(PatchedUnrealBloomPass);
    var pub = new PatchedUnrealBloomPass(resolution, strength, threshold, radius)
    ctx.composer.addPass(pass);
    var params = { ...arguments[0] };
    return { pass: pub, params: params, update: () => { } };
};

export var threeFXFilmPass = ({
    noiseIntensity = 0.2,
    scanlineIntensity = 0,
    scanlineCount = 0,
    grayscale = false
}, ctx = threeDefaultCtx) => {
    threeFXPatchEffect(FilmPass);
    var pub = new FilmPass(noiseIntensity, scanlineIntensity, scanlineCount, grayscale);
    ctx.composer.addPass(pass);
    var params = { ...arguments[0] };
    return { pass: pub, params: params, update: () => { } };
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

// export var threeFXSMAAEffect = ({
//     edgeDetection = 0.1,
// }, ctx = threeDefaultCtx) => {
//     const smaaEffect = new SMAAEffect()
//     smaaEffect.colorEdgesMaterial.setEdgeDetectionThreshold(edgeDetection)
// };

export var threeFXEffectPass = (arr_of_effects = [], ctx = threeDefaultCtx) => {
    var pure = [];
    arr_of_effects.forEach((v) => {
        pure.push(v.is_effect_shell ? v.effect : v);
    });
    var pass = new (Function.prototype.bind.apply(EffectPass, [null].concat(pure)));
    ctx.composer.addPass(pass);
    var params = { ...arguments[0] };
    return { pass: pub, params: params, update: () => { } };
};

export var threeFXNormalPass = (ctx = threeDefaultCtx) => {
    var params = {};
    const pass = new NormalPass(ctx.scene, ctx.camera);
    ctx.composer.addPass(pass);
    ctx.composer_normal_pass = pass;
    return { pass: pass, params: params, update: () => { } };
}

export var threeFXSSAOEffect = ({
    blendFunction = BlendFunction.MULTIPLY,
    samples = 21, // May get away with less samples
    rings = 4, // Just make sure this isn't a multiple of samples
    distanceThreshold = 1.0,
    distanceFalloff = 0.0,
    rangeThreshold = 0.015, // Controls sensitivity based on camera view distance **
    rangeFalloff = 0.002,
    luminanceInfluence = 0.9,
    radius = 20, // Spread range
    scale = 1.0, // Controls intensity **
    bias = 0.05,
}, ctx = threeDefaultCtx) => {
    if (!ctx.composer_normal_pass) {
        throw 'please add NormalPass for SSAO to work'
    }
    const ssaoEffect = new SSAOEffect(ctx.camera, ctx.composer_normal_pass.renderTarget.texture,
        arguments[0]);
    return { effect: ssaoEffect, params: arguments[0], update: () => { }, is_effect_shell: true };
};

export var threeFXBloomEffect = ({
    opacity = 1,
    blendFunction = BlendFunction.SCREEN,
    kernelSize = KernelSize.VERY_LARGE,
    luminanceThreshold = 0.9,
    luminanceSmoothing = 0.07,
    height = 600,
}, ctx = threeDefaultCtx) => {
    const bloomEffect = new BloomEffect(arguments[0]);
    return { effect: bloomEffect, params: arguments[0], update: () => { }, is_effect_shell: true };
};
