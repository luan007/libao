import * as openSimp from "open-simplex-noise";
import * as ao from "../../index"
import { changed, co_loop, ease, fetchYamlAsync, three, yaml } from "../../index";
import { threePerspectiveCamera } from "../../fx/three-util.js";
import { comp_three, reg_component } from "./cs.js";
import { defaultDatGUI, inspect, m_func, m_number, m_text, prep } from "../../prototyping/buildr/lite";

var n3d = openSimp.makeNoise3D(30203);

export class cs_env_lights extends comp_three {
    constructor(key, data) {
        super(key, data);
        this.data = {
            ...this.data,
            dir: 0,
            pwr_front: 1,
            pwr_swing: 0.5,
        };
        this.meta = {
            ...this.meta,
            ...m_number('dir', { min: 0, max: 1, step: 1 }),
            ...m_number('pwr_front', { min: 0, max: 1, step: 0.001 }),
            ...m_number('pwr_swing', { min: 0, max: 1, step: 0.001 })
        }

        var g = this.g;

        var rot = new three.Group();
        var fixed = new three.Group();
        var tilt = new three.Group();

        var front_light = new three.DirectionalLight(0xffffff, 10);
        front_light.position.x = 0;
        front_light.position.y = 0;
        front_light.position.z = 10;

        var side = new three.DirectionalLight(0xffffff, 4);
        side.position.x = 20;
        side.position.y = 10;
        side.position.z = 20;

        var rim = new three.DirectionalLight(0xffffff, 0.3);
        rim.position.x = 0;
        rim.position.y = -3;
        rim.position.z = 0;

        rot.add(side);
        rot.add(rim);
        fixed.add(tilt);
        tilt.add(front_light);
        g.add(rot);
        g.add(fixed);

        var light_sw = 0;

        co_loop((t) => {
            var ctrl = this.data;
            rot.rotation.x += 0.001;
            rot.rotation.y += 0.002;

            light_sw = ao.ease(light_sw, ctrl.dir, 0.03, 0.0000001);
            rot.visible = rim.intensity + side.intensity > 0.001;
            fixed.visible = front_light.intensity > 0.001;

            rim.intensity = ao.ease(rim.intensity, 0.3 * (1 - light_sw * light_sw * light_sw) * (ctrl.pwr_swing * 2), 0.2, 0.0000001);
            side.intensity = ao.ease(side.intensity, 4 * (1 - light_sw) * (ctrl.pwr_swing * 2), 0.2, 0.0000001);

            front_light.intensity = ao.ease(front_light.intensity, 10 * (ctrl.pwr_front * 10) * (0.8 + (Math.sin(t * 2) * 0.5 + 0.5) * 0.2) * (light_sw * light_sw * light_sw * light_sw), 0.1, 0.0000001);
            tilt.rotation.y = Math.PI * 0.8 * Math.pow(1 - light_sw, 2);
            tilt.rotation.z = Math.PI * 0.4 * (1 - light_sw * light_sw);
        })

    }
}

export class cs_env_camera extends comp_three {
    constructor(key, data, camera) {
        super(key, data);
        this.data = {
            ...this.data,
            ...{
                tweak: 1,
                rx: 0,
                ry: 0,
                rz: 0,
                r_e: 0.1,

                z: 0,
                z_e: 0.1,

                fov: 50,
                fov_e: 0.1,


            }
        }

        this.meta = {
            ...this.meta,
            ...m_number("z", { min: -55, max: 500, step: 0.0001 }),
            ...m_number("fov", { min: 2, max: 180, step: 0.0001 }),
            ...m_number("rx", { min: -Math.PI, max: Math.PI, step: 0.01 }),
            ...m_number("ry", { min: -Math.PI, max: Math.PI, step: 0.01 }),
            ...m_number("rz", { min: -Math.PI, max: Math.PI, step: 0.01 }),
        }

        var ctrl = this.data;
        var camera = camera ?? threePerspectiveCamera()

        var g = this.g;
        var camera_mount = new three.Group();
        var camera_rot = new three.Group();

        camera_mount.add(camera);
        camera_rot.add(camera_mount);

        /**
         * 
         * x_rot---------x_mount(camera)
         * 
         */

        g.add(camera_rot);

        co_loop(() => {
            camera_rot.rotation.x = ao.ease(camera_rot.rotation.x, this.data.rx, this.data.r_e, 0.0000001);
            camera_rot.rotation.y = ao.ease(camera_rot.rotation.y, this.data.ry, this.data.r_e, 0.0000001);
            camera_rot.rotation.z = ao.ease(camera_rot.rotation.z, this.data.rz, this.data.r_e, 0.0000001);
            camera_mount.position.z = ao.ease(camera_mount.position.z, this.data.z, this.data.z_e, 0.000000001);
            camera.fov = ao.ease(camera.fov, this.data.fov, this.data.fov_e, 0.000000001);
            camera.updateProjectionMatrix();
        });
    }
}

export class cs_env_stage extends comp_three {
    constructor(key, data) {
        super(key, data);
        this.data = {
            ...this.data,
            rx: 0,
            ry: 0,
            rz: 0,
            px: 0,
            py: 0,
            pz: 0,
            r_e: 0.02,
            p_e: 0.03,
            tweak: 1
        }

        this.meta = {
            ...this.meta,
            ...m_number('rx', { min: -Math.PI, max: Math.PI, step: 0.0001 }),
            ...m_number('ry', { min: -Math.PI, max: Math.PI, step: 0.0001 }),
            ...m_number('rz', { min: -Math.PI, max: Math.PI, step: 0.0001 }),
            ...m_number('px', { min: -55, max: 55, step: 0.0001 }),
            ...m_number('py', { min: -55, max: 55, step: 0.0001 }),
            ...m_number('pz', { min: -55, max: 55, step: 0.0001 }),
        };

        this.off = new three.Group();
        this.g = this.off; //core
        this.ext_g = new three.Group();
        this.ext_g.add(this.off);

        co_loop((t, dt) => {
            this.ext_g.rotation.x = ao.ease(this.ext_g.rotation.x, this.data.rx, this.data.r_e, 0.000001);
            this.ext_g.rotation.y = ao.ease(this.ext_g.rotation.y, this.data.ry, this.data.r_e, 0.000001);
            this.ext_g.rotation.z = ao.ease(this.ext_g.rotation.z, this.data.rz, this.data.r_e, 0.000001);
            this.off.position.x = ao.ease(this.off.position.x, this.data.px, this.data.p_e, 0.000001);
            this.off.position.y = ao.ease(this.off.position.y, this.data.py, this.data.p_e, 0.000001);
            this.off.position.z = ao.ease(this.off.position.z, this.data.pz, this.data.p_e, 0.000001);
        });

        this.pinned = new three.Group();
        this.pinned.add(this.ext_g);
    }
}


reg_component("stage", cs_env_stage)
reg_component("lights", cs_env_lights);
reg_component("camera", cs_env_camera);