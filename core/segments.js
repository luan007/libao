import { loop, eased, ease } from "../";

export class SmartSegment {
    constructor() {
        this.ease_vis = false;
        this.use_eased_val_for_computation = false;
        this.ticks = []; //base elements - elements contains more elements.. potentially
        this.updatables = [];
        this.size = 0;
        this.visibility = 1;
        this.from = 0;
        this.center = 0;
        this.to = 0;
        this.totalSize = 0;
        this.eased = {
            size: 0,
            from: 0,
            to: 0,
            center: 0,
            totalSize: 0,
            visibility: 1
        };
        this.mapped_e = {
            size: 0,
            from: 0,
            to: 0,
            center: 0,
            totalSize: 0,
            visibility: 1
        };
        this.mapped = {
            size: 0,
            from: 0,
            to: 0,
            center: 0,
            totalSize: 0,
            visibility: 1
        };
        this.e_factor = 0.1;
    }

    filterDeep(fn) {
        var arr = [];
        this.ticks.forEach(v => {
            if (fn(v)) {
                arr.push(v);
            }
            arr = arr.concat(v.filterDeep(fn));
        });
        return arr;
    }

    add(t) {
        this.ticks.push(t);
    }

    addExtra(t) {
        this.updatables.push(t);
    }

    update() {
        return 0;
    }

    updateEase() {
        for (var i in this.mapped) {
            this.mapped_e[i] = ease(this.mapped_e[i], this.mapped[i], this.e_factor, 0.0000001);
            this.eased[i] = ease(this.eased[i], this[i], this.e_factor, 0.0000001);
        }
    }
    collectSize() {
        //collect
        if (this.ease_viz) {
            this.size = this.update() * this.eased.visibility;
        }
        else {
            this.size = this.update() * this.visibility;
        }
        this.totalSize = this.size; //self totalsize
        for (var i = 0; i < this.ticks.length; i++) {
            this.ticks[i].from = this.totalSize;
            this.ticks[i].collectSize();
            this.ticks[i].to = this.ticks[i].totalSize + this.ticks[i].from;
            this.ticks[i].center = (this.ticks[i].from + this.ticks[i].to) / 2;
            this.totalSize += this.ticks[i].totalSize;
        }
        return this.totalSize; //collapse me incl children;
    }
    renderRoot(map_from, map_to) { //i.e 0 ~ 1 //called by external user
        //dispatch
        this.updateEase();
        var t = this.use_eased_val_for_computation ? this.eased : this;
        var range = map_to - map_from;
        var ratio = range / t.totalSize; //slice
        if (range == 0 || t.totalSize == 0) {
            ratio = 0;
            this.noRender(); //dont render
        }
        else {
            this.render(); //DRAW ME!
        }
        this.ticks.forEach((v) => {
            //compute stuff before render
            v.mapped.size = v.size * ratio;
            v.mapped.visibility = v.visibility;
            v.mapped.from = map_from + v.from * ratio; //offset by from
            v.mapped.to = map_from + v.to * ratio; //offset by from
            v.mapped.center = map_from + v.center * ratio; //offset by from
            v.mapped.totalSize = v.totalSize * ratio; //offset by from
            v.renderRoot(v.mapped.from, v.mapped.to); //from mapped range to deeper levels
        });

        //when done rendering - check overlays?
        this.updatables.forEach((v) => {
            v.update();
            if (v.size > 0 || v.always_render) {
                v.render();
            }
            else {
                v.noRender();
            }
        });
    }
    auto(map_from = 0, map_to = 1) {
        this.collectSize();
        this.renderRoot(map_from, map_to);
    }
    render() {

    }
    noRender() {
    }
}

export class SmartSegmentRange {
    //calculates
    constructor() {
        this.ticks = []; //stuff some segs into this stuff
        this.track_eased_value = true;
        this.always_render = true;

        this.from = 0;
        this.to = 0;
        this.center = 0;
        this.size = 0;
        this.mapped = {
            from: 0,
            to: 0,
            center: 0,
            size: 0
        };
        this.size = 0;
    }
    update() {
        var from = Number.POSITIVE_INFINITY;
        var from_e = Number.POSITIVE_INFINITY;
        var to = Number.NEGATIVE_INFINITY;
        var to_e = Number.NEGATIVE_INFINITY;
        for (var i = 0; i < this.ticks.length; i++) {
            var target = this.track_eased_value ? this.ticks[i].eased : this.ticks[i];
            from = target.from < from ? target.from : from;
            to = target.to >= to ? target.to : to;
        }
        for (var i = 0; i < this.ticks.length; i++) {
            var target = this.track_eased_value ? this.ticks[i].mapped_e : this.ticks[i].mapped;
            from_e = target.from < from_e ? target.from : from_e;
            to_e = target.to >= to_e ? target.to : to_e;
        }


        if (from == Number.POSITIVE_INFINITY || from_e == Number.POSITIVE_INFINITY || to == Number.NEGATIVE_INFINITY || to_e == Number.NEGATIVE_INFINITY) {
            from = 0;
            to = 0;
            from_e = 0;
            to_e = 0;
        }

        this.from = from;
        this.to = to;
        this.mapped.from = from_e;
        this.mapped.to = to_e

        this.mapped.center = (this.mapped.to - this.mapped.from) / 2 + this.mapped.from;
        this.center = (this.to - this.from) / 2 + this.from;
        this.size = this.to - this.from;
        this.mapped.size = this.mapped.to - this.mapped.from;
    }
    render() {

    }
    noRender() {

    }

}

export class PaddingSeg extends SmartSegment {
    constructor(padding = 1) {
        super();
        // this.padding = ao.eased(0, 1, 0.1, 0.00001);
        this.padding = padding;
    }
    update() {
        return 0.3 + this.padding * 0.2;
    }
    render() {
    }
}


export class NullSeg extends SmartSegment {
    constructor(data) {
        super();
        this.data = data;
    }
    update() {
        return 0;
    }
    render() {

    }
}