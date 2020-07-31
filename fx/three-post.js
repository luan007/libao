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
import * as postprocessing from "postprocessing";

import { HalfFloatType } from "three";
import * as three from "three";

import { PatchedUnrealBloomPass } from "./patch/UnreallBloomPassPatched";
PatchedUnrealBloomPass.prototype = Object.assign(PatchedUnrealBloomPass.prototype, {
    initialize() { },
    originalRender: PatchedUnrealBloomPass.prototype.render,
    render(renderer, inputBuffer, outputBuffer, delta, maskActive) {
        this.originalRender(renderer, outputBuffer, inputBuffer, delta, maskActive);
    }
});

export var threeUsePostprocessing = ({ renderer }) => {
}


console.log(three.REVISION);
