import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer"
import { threeDefaultCtx } from "./three-util"

export function threeGPUCompute(x, y, ctx = threeDefaultCtx) {
    var gpu = new GPUComputationRenderer(x, y, threeDefaultCtx.renderer)
    return gpu;
}