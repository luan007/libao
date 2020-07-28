import * as React from "react";
import { observer } from "mobx-react";
import { isObservable } from "mobx";

import * as core from "../core"


//this is for react
export function loopEffect(fn, unmount) {
    return () => { //returns high order func
        core.loop(fn);
        return () => {
            core.noLoop(fn);
            unmount && unmount();
        };
    };
}

/**
 * Wraps observable data
 * @param children - function of (data) { where data is watched variable }
 */
export var Observe = React.memo(observer(({ children }) => {
    return children(0);
}));

/**
 * 
 * @param {children} | ()=>{} children function
 */
export var Loop = React.memo(({ children }) => {
    var [s, setState] = React.useState(0);
    React.useEffect(loopEffect((t) => {
        setState(t);
    }), []);
    return children(s);
});


/**
 * 
 * @param {children} | ()=>{} children function
 */
export var Scene = React.memo(({ grp = "main", id = "main", e = 0.1, children }) => {
    var [viz, setViz] = React.useState(0);
    var [to, setTo] = React.useState(0);
    var [scene, setScene] = React.useState(null);
    React.useEffect(() => {
        var scene = core.sceneBuild((t, dt, s) => {
            setViz(scene.visibility.value);
            setTo(scene.visibility.to);
        }, grp, id);
        scene.visibility.e = e;
        setScene(scene);
    }, []);
    if (scene) {
        scene.visibility.e = e;
    }
    return children({
        viz: viz,
        to: to,
        shown: viz == to && viz == 1,
        hidden: viz == to && viz == 0,
        middle: viz != to
    });
});

