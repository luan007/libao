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

export function threeLoadCubemap(file, renderer, key, resolution) {
    loaded = false;
    var env_loader = new THREE.TextureLoader();
    env_loader.load(file, (res) => {
        var p = new THREE.EquirectangularToCubeGenerator(res, {
            resolution: resolution || 1024
        });
        p.update(renderer);
        threeResources[key] = p.renderTarget;
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