import { three } from "..";
import { fogFrag, fogParsFrag, fogParsVert, fogVert } from "./shaders/fog/fog";
import { threeCombineMatcapMaterial, patch } from "./three-shader";
import { threeLoadTexture } from "./three-util";

export function threeCMATBase(material_in) {
    if (material_in.patch_arr) return material_in;
    material_in = material_in.clone();
    material_in.patch_arr = material_in.patch_arr || [];
    material_in.onBeforeCompile = (shader) => {
        material_in.patch_arr.forEach((v) => {
            v(shader, material);
        });
        material_in.shader = shader;
    };
    material_in.patch = (fn) => {
        if (Array.isArray(fn)) {
            material_in.patch_arr = material_in.patch_arr.concat(fn);
        }
        else {
            material_in.patch_arr.push(fn);
        }
        return material_in;
    };
    return material_in;
}

export function threeCMATUnique(material_in) {
    if (material_in.patch_arr) return material_in;
    material_in.cache_key = Math.random();
    material_in.customProgramCacheKey = function () {
        return material_in.cache_key;
    }
    material_in.patch_arr = material_in.patch_arr || [];
    material_in.onBeforeCompile = (shader) => {
        material_in.patch_arr.forEach((v) => {
            v(shader, material_in);
        });
        material_in.shader = shader;
    };
    material_in.patch = (fn) => {
        if (Array.isArray(fn)) {
            material_in.patch_arr = material_in.patch_arr.concat(fn);
        }
        else {
            material_in.patch_arr.push(fn);
        }
        return material_in;
    };
    return material_in;
}

export function threeCMAT(material_in, ...fn) {
    return threeCMATBase(material_in).patch(fn);
}


export function threeCMAT_U(material_in, ...fn) {
    return threeCMATUnique(material_in).patch(fn);
}

export var threeCMAT_Custom = (fn) => {
    return fn;
};

export var threeCMAT_SandBlast = (factor = 0.5) => {
    return (shader) => {
        shader.fragmentShader = patch(shader.fragmentShader)
            .PATCH_ADD_NOISE(factor)
            .done()
    };
};

export var threeCMAT_SelectiveFog = () => {
    return (shader, mat) => {
        shader.vertexShader = shader.vertexShader.replace(
            `#include <fog_pars_vertex>`,
            fogParsVert
        );
        shader.vertexShader = shader.vertexShader.replace(
            `#include <fog_vertex>`,
            fogVert
        );
        shader.fragmentShader = shader.fragmentShader.replace(
            `#include <fog_pars_fragment>`,
            fogParsFrag
        );
        shader.fragmentShader = shader.fragmentShader.replace(
            `#include <fog_fragment>`,
            fogFrag
        );
        const uniforms = ({
            fogNearColor: { value: new three.Color(1, 0.1, 0.1) },
            fogColor: { value: new three.Color(0.7, 0.6, 0.6) },
            fogNoiseFreq: { value: 0.0096 },
            fogNoiseSpeed: { value: 0 },
            fogNoiseImpact: { value: 0.5 },
            fogNear: { value: 100 },
            fogFar: { value: 1000 },
            fogDensity: { value: 0.00 },
            time: { value: 0 }
        });
        shader.uniforms = three.UniformsUtils.merge([shader.uniforms, uniforms]);
    };
};

export var threeCMAT_Rimlight = (factor = 0.3, strength = 1.0, power = 1.0, action = "+", target = "outgoingLight") => {
    return (shader) => {
        shader.fragmentShader = patch(shader.fragmentShader)
            .PATCH_ADD_RIMLIGHT(factor, strength, power, action, target)
            .done()
    };
};

export var threeCMAT_ColorClamp = () => {
    return (shader) => {
        shader.fragmentShader = patch(shader.fragmentShader)
            .PATCH_CLAMP_COLOR().done()
    };
};

export var threeCMAT_BasA = () => {
    return (shader) => {
        shader.fragmentShader = patch(shader.fragmentShader)
            .PATCH_BRIGHTNESS_AS_TRANSPARENCY().done()
    };
};

export var threeCMAT_Matcap = (texture = "./resources/Matcap/gooch.jpg", {
    TEXTURE_NAME = 'matcapTexture' + (Math.random() * 1000).toFixed(0),
    FACTOR = 1.0,
    OP = "*",
    PATCH_POINT = threeShaderSignatures.gl_FragColor, PHASE = BEFORE, TARGET = "outgoingLight"
}) => {
    return (shader) => {
        threeCombineMatcapMaterial(shader, {
            texture: threeLoadTexture(texture)
        }, {
            OP, FACTOR, TEXTURE_NAME, PATCH_POINT,
            PHASE, TARGET
        })
    };
};
