import * as THREE from 'three'
import { threeDefaultCtx } from "./three-util";
import { three } from '..';
const pcss = ({
    frustrum = 3.75,
    size = 0.005,
    near = 9.5,
    samples = 17,
    rings = 11,
}) => `#define LIGHT_WORLD_SIZE ${size}
  #define LIGHT_FRUSTUM_WIDTH ${frustrum}
  #define LIGHT_SIZE_UV (LIGHT_WORLD_SIZE / LIGHT_FRUSTUM_WIDTH)
  #define NEAR_PLANE ${near}
  #define NUM_SAMPLES ${samples}
  #define NUM_RINGS ${rings}
  #define BLOCKER_SEARCH_NUM_SAMPLES NUM_SAMPLES
  #define PCF_NUM_SAMPLES NUM_SAMPLES
  vec2 poissonDisk[NUM_SAMPLES];
  void initPoissonSamples(const in vec2 randomSeed) {
      float ANGLE_STEP = PI2 * float(NUM_RINGS) / float(NUM_SAMPLES);
      float INV_NUM_SAMPLES = 1.0 / float(NUM_SAMPLES);
      float angle = rand(randomSeed) * PI2;
      float radius = INV_NUM_SAMPLES;
      float radiusStep = radius;
      for (int i = 0; i < NUM_SAMPLES; i++) {
          poissonDisk[i] = vec2(cos(angle), sin(angle)) * pow(radius, 0.75);
          radius += radiusStep;
          angle += ANGLE_STEP;
      }
  }
  float penumbraSize(const in float zReceiver, const in float zBlocker) { // Parallel plane estimation
      return (zReceiver - zBlocker) / zBlocker;
  }
  float findBlocker(sampler2D shadowMap, const in vec2 uv, const in float zReceiver) {
      float searchRadius = LIGHT_SIZE_UV * (zReceiver - NEAR_PLANE) / zReceiver;
      float blockerDepthSum = 0.0;
      int numBlockers = 0;
      for (int i = 0; i < BLOCKER_SEARCH_NUM_SAMPLES; i++) {
          float shadowMapDepth = unpackRGBAToDepth(texture2D(shadowMap, uv + poissonDisk[i] * searchRadius));
          if (shadowMapDepth < zReceiver) {
              blockerDepthSum += shadowMapDepth;
              numBlockers++;
          }
      }
      if (numBlockers == 0) return -1.0;
      return blockerDepthSum / float(numBlockers);
  }
  float PCF_Filter(sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius) {
      float sum = 0.0;
      for (int i = 0; i < PCF_NUM_SAMPLES; i++) {
          float depth = unpackRGBAToDepth(texture2D(shadowMap, uv + poissonDisk[ i ] * filterRadius));
          if (zReceiver <= depth) sum += 1.0;
      }
      for (int i = 0; i < PCF_NUM_SAMPLES; i++) {
          float depth = unpackRGBAToDepth(texture2D(shadowMap, uv + -poissonDisk[ i ].yx * filterRadius));
          if (zReceiver <= depth) sum += 1.0;
      }
      return sum / (2.0 * float(PCF_NUM_SAMPLES));
  }
  float PCSS(sampler2D shadowMap, vec4 coords) {
      vec2 uv = coords.xy;
      float zReceiver = coords.z; // Assumed to be eye-space z in this code
      initPoissonSamples(uv);
      float avgBlockerDepth = findBlocker(shadowMap, uv, zReceiver);
      if (avgBlockerDepth == -1.0) return 1.0;
      float penumbraRatio = penumbraSize(zReceiver, avgBlockerDepth);
      float filterRadius = penumbraRatio * LIGHT_SIZE_UV * NEAR_PLANE / zReceiver;
      return PCF_Filter(shadowMap, uv, zReceiver, filterRadius);
  }`

//called before anything
export const threePatchPCSS_Shadow = ({
    frustrum = 3.75,
    size = 0.005,
    near = 9.5,
    samples = 17,
    rings = 11,
    three = null,
}) => {
    three = three || THREE;
    // Avoid adding the effect twice, which may happen in HMR scenarios
    if (!three.pcss_patched) {
        console.warn("AO-PATCH", "PCSS Enabled")
        three.pcss_patched = true
        let shader = three.ShaderChunk.shadowmap_pars_fragment
        shader = shader.replace('#ifdef USE_SHADOWMAP', '#ifdef USE_SHADOWMAP\n' + pcss({ frustrum, size, near, samples, rings }))
        shader = shader.replace(
            '#if defined( SHADOWMAP_TYPE_PCF )',
            '\nreturn PCSS(shadowMap, shadowCoord);\n#if defined( SHADOWMAP_TYPE_PCF )'
        )
        three.ShaderChunk.shadowmap_pars_fragment = shader
    }
}

export const threeVSMShadow = (ctx = threeDefaultCtx) => {
    ctx.renderer.shadowMap.enabled = true;
    ctx.renderer.shadowMap.type = THREE.VSMShadowMap;
};

export const threeUseToneMapping = ({
    toneMapping = THREE.ACESFilmicToneMapping,
    aces_exposure = 1.3
}, ctx = threeDefaultCtx) => {
    var params = {
        toneMapping, aces_exposure
    };
    if (!THREE.ShaderChunk.tonemapping_pars_fragment_backup) {
        THREE.ShaderChunk.tonemapping_pars_fragment_raw = THREE.ShaderChunk.tonemapping_pars_fragment;
        THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
            'vec3 CustomToneMapping( vec3 color ) { return color; }',
            `#define Uncharted2Helper( x ) max( ( ( x * ( 0.15 * x + 0.10 * 0.50 ) + 0.20 * 0.02 ) / ( x * ( 0.15 * x + 0.50 ) + 0.20 * 0.30 ) ) - 0.02 / 0.30, vec3( 0.0 ) )
        float toneMappingWhitePoint = 1.0;
        vec3 CustomToneMapping( vec3 color ) {
            color *= toneMappingExposure;
            return saturate( Uncharted2Helper( color ) / Uncharted2Helper( vec3( toneMappingWhitePoint ) ) );
        }`
        );
        THREE.ShaderChunk.tonemapping_pars_fragment_backup = THREE.ShaderChunk.tonemapping_pars_fragment;
    }

    THREE.ShaderChunk.tonemapping_pars_fragment_aces = THREE.ShaderChunk.tonemapping_pars_fragment_backup.replace("return saturate( color );", "return color * " + (Math.round(aces_exposure * 10) / 10).toFixed(1) + ";");
    if (toneMapping == THREE.ACESFilmicToneMapping) {
        console.warn("AO-PATCH", "ACES")
        THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment_aces;
    }
    else {
        THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment_backup;
    }
    ctx.renderer.toneMapping = toneMapping;
    function update() { }
    return {
        update: update,
        params: params,
        ctx: ctx
    };
};

export const threeAutoColorMGMT = (use_srgb = true, ctx = threeDefaultCtx) => {
    if (use_srgb) { ctx.renderer.outputEncoding = three.sRGBEncoding }
    // ctx.renderer.gammaOutput = true;
    // ctx.renderer.gammaFactor = 2.2;
    // renderer.gammaFactor = 2.2;
    ctx.renderer.physicallyCorrectLights = true;
    threeUseToneMapping({}, ctx);
};

