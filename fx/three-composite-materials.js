import { threeCombineMatcapMaterial, patch } from "./three-shader";
import { threeLoadTexture } from "./three-util";

export function threeCMATBase(material_in) {
    if (material_in.patch_arr) return material_in;
    material_in = material_in.clone();
    material_in.patch_arr = material_in.patch_arr || [];
    material_in.onBeforeCompile = (shader) => {
        material_in.patch_arr.forEach((v) => {
            v(shader);
        });
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
