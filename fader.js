import {
    eased,
    loop
} from "./ticker";

//function based switching mechanisim

var scene_groups = {};

export class Scene {
    constructor(updateFunc, grpId, id, updateThreshold, init) {
        init = init || ((s) => {});
        grpId = grpId || "default";
        if (grpId) {
            scene_groups[grpId] = scene_groups[grpId] || [];
            scene_groups[grpId].push(this);
            this.index = scene_groups[grpId].length - 1;
        }
        this.visibility = eased(0, 0, 0.2, 0.00001);
        this.updateThreshold = updateThreshold || 0.01;
        this.id = id;
        this.update = updateFunc || (() => {});
        init(this);
        loop((t, dt) => {
            if (this.visibility.value > this.updateThreshold) {
                this.update(t, dt, this);
            }
        });
    }
}

export function sceneBuild(update, grpId, id, init) {
    var s = new Scene(update, grpId, id, undefined, init);
    return s;
}

export function sceneGroups() {
    return scene_groups;
}

export function sceneGroup(grpId) {
    return scene_groups[grpId];
}

export function sceneSelectIndex(arr, selection, exclusive) {
    for (var i = 0; i < arr.length; i++) {
        if (i == selection) {
            arr[i].visibility.to = 1;
        } else if (exclusive) {
            arr[i].visibility.to = 0;
        }
    }
}

export function sceneGrpSelectIndex(str, selection, exclusive) {
    if (!scene_groups[str]) return;
    var arr = scene_groups[str];
    sceneSelectIndex(arr, selection, exclusive);
}

export function sceneGrpSelectId(str, selection, exclusive) {
    if (!scene_groups[str]) return;
    var arr = scene_groups[str];
    sceneSelectId(arr, selection, exclusive);
}

export function sceneGrpGetId(str, selection) {
    if (!scene_groups[str]) return;
    var arr = scene_groups[str];
    return sceneGetId(arr, selection);
}


export function sceneGetId(arr, id) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].id == id) {
            return arr[i]
        }
    }
}

export function sceneSelectId(arr, id, exclusive) {
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].id == id) {
            arr[i].visibility.to = 1;
        } else if (exclusive) {
            arr[i].visibility.to = 0;
        }
    }
}

export function sceneExportToGlobal(global) {
    global = global || window;
    global.sceneSelectId = sceneSelectId;
    global.sceneBuild = sceneBuild;
    global.sceneGroups = sceneGroups;
    global.sceneGrpSelectId = sceneGrpSelectId;
    global.sceneGrpSelectIndex = sceneGrpSelectIndex;
    global.sceneSelectIndex = sceneSelectIndex;
    global.sceneGroup = sceneGroup;
    global.scene_groups = scene_groups;
}