import * as three from "three";


export function threeInstancedBufferAttribute(count, size, normalized, attPerMesh) {
    var attr = new three.InstancedBufferAttribute(new Float32Array(count * size), size, normalized, attPerMesh);
    attr.setUsage(three.DynamicDrawUsage)
    return attr;
}

export function threePatchAttr(type, name, target, shader) {
    shader.vertexShader = `
    attribute ${type} ${name};
    varying ${type} _${name};
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace("void main() {", `
    void main() {
        _${name} = ${name};
    `)

    shader.fragmentShader = `
    varying ${type} _${name};
    ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(`uniform ${type} ${target};`, ``);
    shader.fragmentShader = shader.fragmentShader.replace("void main() {", `
    void main() {
        ${type} ${target} = _${name};    
    `);
}

export const BEFORE = 1 << 1;
export const AFTER = 1 << 2;
export const REPLACE = 1 << 3;

export var threeShaderSignatures = {
    main: `void main() {`,
    gl_FragColor: /gl_FragColor.*/i,
    diffuse: /vec4 diffuseColor.*/i,
    lightEnd: "#include <lights_physical_fragment>"
};

export var threeShaderFuncs = {
    rng_rand: `
        float rng_rand(vec3 scale, float seed, vec3 offsetSource) { return fract(sin(dot(offsetSource.xyz + seed, scale)) * 43758.5453 + seed); }
        float rng_rand(vec3 scale, float seed) { return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed); }
        float rng_rand(float seed) { return rng_rand(vec3(1.), seed); }
        float rng_rand() { return rng_rand(length(gl_FragCoord)); }
    `,

    rim: `
    vec3 rim(vec3 tint, float strength, float power, vec3 vNormal, vec3 vEye) {
        float f = strength * abs(dot(vNormal, normalize(vEye)));
        f = pow(1. - smoothstep(0.0, 1., f), power);
        return vec3(f) * tint;
    }
    vec3 rim(vec3 tint, float strength, float power) {
        return rim(tint, strength, power, vNormal, vViewPosition);
    }
    vec3 rim(float strength, float power) {
        return rim(vec3(1.), strength, power, vNormal, vViewPosition);
    }
    vec3 rim(float strength, float power, vec3 vNormal, vec3 vEye) {
        return rim(vec3(1.), strength, power, vNormal, vEye);
    }
    `,

    matcap_core: `
    vec4 matcapSampling(vec3 vViewPosition, sampler2D matcapTexture, vec3 normal) {
        vec3 viewDir = normalize( vViewPosition );
        vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
        vec3 y = cross( viewDir, x );
        vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
        vec4 matcapColor = texture2D( matcapTexture, uv );
        return sRGBToLinear(matcapColor);
    }
    `
};

export function threePatchShader(shader, signature, content, action) {
    var before = action & BEFORE ? content : "";
    var replaced = action & REPLACE ? content : (shader.match(signature) ? shader.match(signature)[0] : signature);
    var after = action & AFTER ? content : "";
    shader = shader.replace(signature,
        `
            ${before}
            ${replaced}
            ${after}
        `);
    return shader;
}

class _patcher {
    constructor(str) {
        this.str = str;
    }
    toString() {
        return this.str;
    }
    top(content) {
        this.str = content + this.str;
        return this;
    }
    before(sig, content) {
        this.str = threePatchShader(this.str, sig, content, BEFORE);
        return this;
    }
    shaderFunc(fn) {
        this.str = threePatchShader(this.str, threeShaderSignatures.main, fn, BEFORE);
        return this;
    }
    shaderDef(fn) {
        this.str = threePatchShader(this.str, threeShaderSignatures.main, fn, BEFORE);
        return this;
    }
    shaderMain(content) {
        this.str = threePatchShader(this.str, threeShaderSignatures.main, content, AFTER);
        return this;
    }
    shaderEnd(content) {
        this.str = threePatchShader(this.str, "}", content, BEFORE);
        return this;
    }
    beforeColor(content) {
        this.str = threePatchShader(this.str, threeShaderSignatures.gl_FragColor, content, BEFORE);
        return this;
    }
    delete(sig) {
        this.str = threePatchShader(this.str, sig, '', REPLACE);
        return this;
    }
    after(sig, content) {
        this.str = threePatchShader(this.str, sig, content, AFTER);
        return this;
    }
    swap(sig, content) {
        this.str = threePatchShader(this.str, sig, content, REPLACE);
        return this;
    }
    change(sig, content) {
        return this.swap(sig, content); //alias
    }
    patch(sig, content, action) {
        this.str = threePatchShader(this.str, sig, content, action);
        return this;
    }
    done() {
        return this.str;
    }

    PATCH_ADD_NOISE(strength = 0.3, scalerX = 1.0, scalerY = 1.0, scalerZ = 1.0) {
        return this
            .shaderFunc(threeShaderFuncs.rng_rand)
            .beforeColor(
                `
                        float noise = ${strength.toFixed(2)} * (0.5 - rng_rand(vec3(${scalerX.toFixed(2)}, ${scalerY.toFixed(2)}, ${scalerZ.toFixed(2)}), length(gl_FragCoord)));
                        outgoingLight *= (1.0 - noise);
                        `
            )
    }

    PATCH_ADD_UV_NOISE(strength = 0.3, scalerX = 1.0, scalerY = 1.0, scalerZ = 1.0, uv = 'uv') {
        return this
            .shaderFunc(threeShaderFuncs.rng_rand)
            .beforeColor(
                `
                        float noise = ${strength.toFixed(2)} * (0.5 - rng_rand(vec3(${scalerX.toFixed(2)}, ${scalerY.toFixed(2)}, ${scalerZ.toFixed(2)}), length(gl_FragCoord), vec3(${uv}.xy, 1.0)));
                        outgoingLight *= (1.0 + noise);
                        `
            )
    }

    PATCH_ADD_RIMLIGHT(factor = 0.3, strength = 1.0, power = 1.0, action = "+", target = "outgoingLight", tint = "vec3(1.0, 1.0, 1.0)") {
        return this
            .shaderFunc(threeShaderFuncs.rim)
            .beforeColor(
                `
                    ${target} ${action}= ${tint} * ${factor.toFixed(2)} * rim(${strength.toFixed(2)}, ${power.toFixed(2)});
                `
            )
    }

    PATCH_BRIGHTNESS_AS_TRANSPARENCY() {
        return this
            .after(threeShaderSignatures.gl_FragColor,
                `
                float _b = (gl_FragColor.x + gl_FragColor.y + gl_FragColor.z) / 3.0;
                gl_FragColor = vec4(gl_FragColor.xyz, gl_FragColor.a * _b);
                `
            )
    }

    PATCH_CLAMP_COLOR() {
        return this
            .beforeColor(
                `
                outgoingLight = vec3(clamp(outgoingLight.r, 0.0, 1.0), clamp(outgoingLight.g, 0.0, 1.0), clamp(outgoingLight.b, 0.0, 1.0));
                `
            )
    }

    PATCH_SCREEN_MIX() {
        return this
            .beforeColor(
                `
                        outgoingLight = vec3(1.) - (vec3(1.) - outgoingLight) * (vec3(1.) - outgoingLight);
                        `
            )
    }

    PATCH_COLOR_POWER(r = 1.0, g = 1.0, b = 1.0) {
        return this.beforeColor(
            `
                        outgoingLight = vec3(
                            pow(outgoingLight.r, ${r.toFixed(3)}),
                            pow(outgoingLight.g, ${g.toFixed(3)}),
                            pow(outgoingLight.b, ${b.toFixed(3)})
                        );
                        `
        )
    }

    PATCH_ADD_MATCAP_FRAG({ OP = "*", FACTOR = 1, TEXTURE_NAME = 'matcapTexture', PATCH_POINT = threeShaderSignatures.gl_FragColor, PHASE = BEFORE, TARGET = "outgoingLight" }) {
        return this
            .shaderDef(`
                uniform sampler2D ${TEXTURE_NAME};
            `)
            .patch(
                PATCH_POINT,
                `
                    //PATCHED
                    ${TARGET} ${OP}= matcapSampling(vViewPosition, ${TEXTURE_NAME}, normal).xyz;
                `,
                PHASE
            )
    }
    PATCH_ADD_MATCAP_VERT() {
        return this
            .shaderEnd(
                `vViewPosition = - mvPosition.xyz;`
            )
    }

}

export function patch(str) {
    return new _patcher(str);
}

export function threeCombineMatcapMaterial(shader, { texture = null }, {
    TEXTURE_NAME = 'matcapTexture' + (Math.random() * 1000).toFixed(0),
    FACTOR = 1.0,
    OP = "*",
    PATCH_POINT = threeShaderSignatures.gl_FragColor, PHASE = BEFORE, TARGET = "outgoingLight"
}) {

    if (!shader._patch_matcap) {
        shader.fragmentShader = patch(shader.fragmentShader).shaderFunc(
            threeShaderFuncs.matcap_core
        ).done();
        shader.vertexShader = patch(shader.vertexShader).PATCH_ADD_MATCAP_VERT().done();
    }
    shader.fragmentShader = patch(shader.fragmentShader).PATCH_ADD_MATCAP_FRAG({
        PATCH_POINT, PHASE, TARGET, TEXTURE_NAME,
        FACTOR, OP
    }).done();
    shader._patch_matcap = true;
    shader.uniforms[TEXTURE_NAME] = {
        type: "t",
        value: texture
    };
}

export var threeCombineMatcapMaterial_DiffusePatch = {
    PATCH_POINT: threeShaderSignatures.lightEnd,
    PHASE: BEFORE,
    TARGET: "diffuseColor.xyz",
    OP: "*",
    FACTOR: 1.0
};


export function threeExpandShaderIncludes(s) {
    const includePattern = /^[ \t]*#include +<([\w\d./]+)>/gm;
    function resolveIncludes(string) {

        return string.replace(includePattern, includeReplacer);

    }
    function includeReplacer(match, include) {
        const string = three.ShaderChunk[include];

        if (string === undefined) {

            throw new Error('Can not resolve #include <' + include + '>');

        }
        return resolveIncludes(string);
    }
    return resolveIncludes(s);
}