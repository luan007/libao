import * as post from "postprocessing";

// instantiate a loader
var loaded = true;
export var threeResources = [];

var manager = THREE.DefaultLoadingManager;
export function threeLoadObj(file, key) {
    var loader = new THREE.OBJLoader();
    loaded = false;
    loader.load(
        // resource URL
        file,
        // called when resource is loaded
        function (object) {
            threeResources[key] = object;
        }
    );
}

export function threeLoadPostprocessingTextures() {
    const areaImage = new Image();
    const searchImage = new Image();
    loaded = false;

    manager.itemStart("smaa_areaImageDataURL");
    manager.itemStart("smaa_searchImageDataURL");
    areaImage.addEventListener("load", function () {
        manager.itemEnd("smaa_areaImageDataURL");
    });
    areaImage.src = post.SMAAEffect.areaImageDataURL;

    searchImage.addEventListener("load", function () {
        manager.itemEnd("smaa_searchImageDataURL");
    });
    searchImage.src = post.SMAAEffect.searchImageDataURL;

    threeResources["smaa_search"] = searchImage;
    threeResources["smaa_area"] = areaImage;
}

var dracoLoader;
export function threeLoadDraco(file, key, draco_path) {
    loaded = false;
    dracoLoader = dracoLoader || new THREE.DRACOLoader();
    manager.itemStart(file);
    THREE.DRACOLoader.setDecoderPath(draco_path);
    var loader = dracoLoader;
    loader.load(
        // resource URL
        file,
        // called when resource is loaded
        function (geo) {
            threeResources[key] = geo;
            manager.itemEnd(file);
        }
    );
}

export function threeLoadCubemap(file, renderer, key, _resolution) {
    loaded = false;
    var env_loader = new THREE.TextureLoader();
    env_loader.load(file, (res) => {
        var options = {
            generateMipmaps: true,
            minFilter: THREE.LinearMipMapLinearFilter,
            magFilter: THREE.LinearFilter
        };
        var resolution = _resolution || 1024;
        var cubeMap = new THREE.WebGLRenderTargetCube(resolution, resolution, options).fromEquirectangularTexture(renderer, res);
        threeResources[key] = cubeMap.texture;
    });
}

export function threeLoadSphereEnv(file, key) {
    threeResources[key] = new THREE.TextureLoader().load(file);
    threeResources[key].mapping = THREE.SphericalReflectionMapping;
}

export function threeLoadTexture(file, key) {
    loaded = false;
    threeResources[key] = new THREE.TextureLoader().load(file);
}

export function threeGetResource(key) {
    return threeResources[key];
}

manager.onLoad = () => {
    console.log('All resources loaded');
    loaded = true;
};
manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
}

//todo, this should've been done better (proxy func + array of listeners)
export function threeOnload(cb) {
    //recur for now
    if (loaded) {
        return cb();
    }
    var c = manager.onLoad;
    manager.onLoad = () => {
        if (c) {
            c();
        }
        cb();
    };
}

//todo, this should've been done better (proxy func + array of listeners)
export function threeOnProgress(cb) {
    var c = manager.onProgress;
    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
        if (c) {
            c(url, itemsLoaded, itemsTotal);
        }
        cb();
    };
}



export function threeLoadHDR_PMREM(key, renderer, path, urls) {
    loaded = false;
    urls = urls || ['px.hdr', 'nx.hdr', 'py.hdr', 'ny.hdr', 'pz.hdr', 'nz.hdr'];
    var hdrCubeMap = new THREE.HDRCubeTextureLoader()
        .setPath(path)
        .setDataType(THREE.UnsignedByteType)
        .load(urls, function () {
            var pmremGenerator = new THREE.PMREMGenerator(hdrCubeMap);
            pmremGenerator.update(renderer);

            var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker(pmremGenerator.cubeLods);
            pmremCubeUVPacker.update(renderer);

            var hdrCubeRenderTarget = pmremCubeUVPacker.CubeUVRenderTarget;
            console.log(hdrCubeRenderTarget);

            hdrCubeMap.magFilter = THREE.LinearFilter;
            hdrCubeMap.needsUpdate = true;

            pmremGenerator.dispose();
            pmremCubeUVPacker.dispose();
            threeResources[key] = hdrCubeRenderTarget.texture;
            threeResources[key + "_cube"] = hdrCubeMap;
        });
}


export function threeLoadLDR_PMREM(key, renderer, path, urls) {
    loaded = false;
    urls = urls || ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];
    var ldrCubeMap = new THREE.CubeTextureLoader()
        .setPath(path)
        .load(urls, function () {
            var pmremGenerator = new THREE.PMREMGenerator(ldrCubeMap);
            pmremGenerator.update(renderer);

            var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker(pmremGenerator.cubeLods);
            pmremCubeUVPacker.update(renderer);

            var target = pmremCubeUVPacker.CubeUVRenderTarget;

            ldrCubeMap.magFilter = THREE.LinearFilter;
            ldrCubeMap.needsUpdate = true;

            pmremGenerator.dispose();
            pmremCubeUVPacker.dispose();
            threeResources[key] = target.texture;
            threeResources[key + "_cube"] = ldrCubeMap;
        });
}