
uniform float time;
uniform float bump;
uniform sampler2D tNormal;
uniform sampler2D tMatCap;
uniform float noise;
uniform float useNormal;
uniform float useRim;
uniform float rimPower;
uniform float useScreen;
uniform float normalScale;
uniform float normalRepeat;

varying vec2 vUv;
varying vec3 vTangent;
varying vec3 vBinormal;
varying vec3 vNormal;
varying vec3 vEye;
varying vec3 vU;
varying vec2 vN;

float random(vec3 scale, float seed) { return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed); }

/**
 * 
 * 
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks
 * 
 **/

void main()
{

    vec3 finalNormal = vNormal;
    vec2 calculatedNormal = vN;

    if (useNormal == 1.)
    {
        vec3 normalTex = texture2D(tNormal, vUv * normalRepeat).xyz * 2.0 - 1.0;
        normalTex.xy *= normalScale;
        normalTex.y *= -1.;
        normalTex = normalize(normalTex);
        mat3 tsb = mat3(normalize(vTangent), normalize(vBinormal), normalize(vNormal));
        finalNormal = tsb * normalTex;

        vec3 r = reflect(vU, normalize(finalNormal));
        float m = 2.0 * sqrt(r.x * r.x + r.y * r.y + (r.z + 1.0) * (r.z + 1.0));
        calculatedNormal = vec2(r.x / m + 0.5, r.y / m + 0.5);
    }

    vec3 base = texture2D(tMatCap, calculatedNormal).rgb;

    // rim lighting

    if (useRim > 0.)
    {
        float f = rimPower * abs(dot(vNormal, normalize(vEye)));
        f = useRim * (1. - smoothstep(0.0, 1., f));
        base += vec3(f);
    }

    // screen blending

    if (useScreen == 1.)
    {
        base = vec3(1.) - (vec3(1.) - base) * (vec3(1.) - base);
    }

    // noise

    base += noise * (.5 - random(vec3(1.), length(gl_FragCoord)));

    gl_FragColor = vec4(base, 1.);
}
