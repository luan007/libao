import PhysicsRenderer from "../thirdparty/patched_prender";
import * as three from "three";
//compute stuff using three
//yey i mean shaders

export function threeRTT(renderer, width, height, frag, uniforms) {
    myScene = new THREE.Scene();

    var renderTargetParams = {
        minFilter: THREE.LinearFilter,
        stencilBuffer: false,
        depthBuffer: false
    };
    myTexture = new THREE.WebGLRenderTarget(width, height, renderTargetParams);

    myUniforms = {
        resolution: {
            type: "v2",
            value: {
                x: width,
                y: height
            }
        }
    };

    for (var i in uniforms) {
        myUniforms[i] = uniforms[i];
    }

    myTextureMat = new THREE.ShaderMaterial({
        uniforms: myUniforms,
        vertexShader: `
        uniform float time;
        uniform vec2 resolution;

        void main()	{
            gl_Position = vec4( position, 1.0 );
        }
        `,
        fragmentShader: frag
    });

    // Setup render-to-texture scene
    myCamera = new THREE.OrthographicCamera(imageWidth / -2,
        imageWidth / 2,
        imageHeight / 2,
        imageHeight / -2, -10000, 10000);

    var myTextureGeo = new THREE.PlaneGeometry(imageWidth, imageHeight);
    myTextureMesh = new THREE.Mesh(myTextureGeo, myTextureMat);
    myTextureMesh.position.z = -100;
    myScene.add(myTextureMesh);


    var debug_mesh = threeVisualizeTexture(width, height, myTexture);

    return {
        uniforms: myUniforms,
        render: (clear) => {
            clear = clear || true;
            var target = renderer.getRenderTarget();
            renderer.setRenderTarget(myTexture);
            if (clear) {
                renderer.clear();
            }
            renderer.render(myScene, myCamera);
            renderer.setRenderTarget(target);
            debug_mesh.material.needsUpdate = true;
        },
        texture: myTexture,
        debug_mesh: debug_mesh
    };
}

export function threeVisualizeTexture(width, height, texture) {
    var myTextureGeo = new THREE.PlaneGeometry(width / 100, height / 100);
    var debug_mesh = new three.Mesh(myTextureGeo, new three.MeshBasicMaterial({
        map: texture
    }));
    return debug_mesh;
}

export function threeGPGPUSimulation(renderer, size, frag, uniforms) {
    var size = size || 512;
    var pr = new PhysicsRenderer(size, frag, renderer);

    for (var u in uniforms) {
        pr.material.uniforms[u] = uniforms[u];
    }
    var uniform_out = {
        t_pos: {
            type: "t",
            value: null
        }
    };
    pr.addBoundTexture(uniform_out.t_pos, "output");
    pr.resetRand(10);

    pr.update();
    return {
        size: size,
        simulation: pr,
        uniform_out: uniform_out,
        uniforms: pr.material.uniforms
    };
}

//good old points
export function threeGPGPULookupGeometry(simulation, mat) {
    // var uniforms = Object.assign({}, simulation.uniform_out);
    mat = mat || {};

    function createLookupGeometry(size) {
        var geo = new THREE.BufferGeometry();
        var positions = new Float32Array(size * size * 3);
        for (var i = 0, j = 0, l = positions.length / 3; i < l; i++, j += 3) {
            positions[j] = (i % size) / size;
            positions[j + 1] = Math.floor(i / size) / size;

        }
        var posA = new THREE.BufferAttribute(positions, 3);
        geo.addAttribute('position', posA);
        return geo;
    }

    var geometry = createLookupGeometry(simulation.size);
    var material = new three.PointsMaterial(mat);
    material.onBeforeCompile = (shader) => {
        console.log(shader);
        Object.assign(shader.uniforms, simulation.uniform_out);
        // Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
            vec3 transformed = texture2D( t_pos , position.xy ).xyz;
        `);
        shader.vertexShader = `uniform sampler2D t_pos;\n` + shader.vertexShader;
        //     "uniform float size;
        //     uniform float scale;
        //     #include <common>
        //     #include <color_pars_vertex>
        //     #include <fog_pars_vertex>
        //     #include <morphtarget_pars_vertex>
        //     #include <logdepthbuf_pars_vertex>
        //     #include <clipping_planes_pars_vertex>
        //     void main() {
        //         #include <color_vertex>
        //         #include <begin_vertex>
        //         #include <morphtarget_vertex>
        //         #include <project_vertex>
        //         gl_PointSize = size;
        //         #ifdef USE_SIZEATTENUATION
        //             bool isPerspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 );
        //             if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
        //         #endif
        //         #include <logdepthbuf_vertex>
        //         #include <clipping_planes_vertex>
        //         #include <worldpos_vertex>
        //         #include <fog_vertex>
        //     }"
        // };
        // var material = new THREE.ShaderMaterial({
        //     uniforms: uniforms,
        //     vertexShader: `
        //     uniform sampler2D t_pos;
        //     void main(){
        //       vec4 pos = texture2D( t_pos , position.xy );
        //       gl_Position = projectionMatrix * modelViewMatrix * vec4( pos.xyz , 1. );
        //     }
        //     `,
        //     fragmentShader: frag || three.ShaderLib.points.fragmentShader
        // });
        return shader;
    };
    // Object.assign(material.uniforms, uniforms);
    var particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false;
    return particles;
}

//u're on ur own
export function threeGPGPUVertFragGeometry(simulation, uniforms, vert, frag) {
    uniforms = uniforms || {};
    var uniforms = Object.assign(uniforms, simulation.uniform_out);

    function createLookupGeometry(size) {
        var geo = new THREE.BufferGeometry();
        var positions = new Float32Array(size * size * 3);
        for (var i = 0, j = 0, l = positions.length / 3; i < l; i++, j += 3) {
            positions[j] = (i % size) / size;
            positions[j + 1] = Math.floor(i / size) / size;

        }
        var posA = new THREE.BufferAttribute(positions, 3);
        geo.addAttribute('position', posA);
        return geo;
    }

    var geometry = createLookupGeometry(simulation.size);
    var material = new three.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vert || `
        uniform sampler2D t_pos;
        varying vec4 screenPos;
        void main(){
            vec4 pos = texture2D( t_pos , position.xy );
            gl_Position = projectionMatrix * modelViewMatrix * vec4( pos.xyz , 1. );
            screenPos = gl_Position;
        }
`,
        fragmentShader: frag || `
        void main(){
            gl_FragColor = vec4( 0., 0., 0., 0.01 );
        }
        `
    });

    var particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false;
    return particles;
}