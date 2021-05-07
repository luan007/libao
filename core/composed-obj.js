//this is another try on making smart objects

import { loop } from "./ticker"



/**
 * exec this now, get result.
 * @template T
 * @param {()=>T} fn 
 * @returns {T}
 */
export function co_setup(fn) {
    return fn();
}

/**
 * exec this now, get result - async version!
 * @template T
 * @param {()=>Promise<T>} fn 
 * @returns {T}
 */
export async function co_a_setup(fn) {
    return await fn();
}

/**
 * exec this function during loop
 * @param {(t: number, dt: number) => void} fn 
 * @returns 
 */
export function co_loop(fn) { //some process to be looped
    var looper = {
        enabled: true,
        fn: fn
    };
    //TODO: this is rather stupid for now
    loop((t, dt) => {
        looper.enabled && fn(t, dt);
    });
    return looper; //controllable :)
}

//currently, does nothing.
/**
 * @template T
 * @param {T} d 
 * @returns {T}
 */
export function co_data(d, key) {
    //mvvm data chunk,
    //where you can watch? some shit?
    //if data changes, report, react?
    
    //what is data,
    //data drives everything
    
    //transparent?

    return d;
}

/**
 * @template T
 * @param {()=>T} fn 
 * @returns {()=>T}
 */
export function co_lazy(fn, lazy) {
    var res = null;
    var called = false;
    if (!lazy) {
        res = fn();
        called = true;
    }
    return (refresh) => {
        if (!called || refresh) {
            called = true;
            res = fn();
        }
        return res;
        //if you call me, your result will be remembered
    }
}


/**
 * @template T
 * @param {()=>Promise<T>} fn 
 * @returns {()=>Promise<T>}
 */
export async function co_a_lazy(fn, lazy) {
    var res = null;
    var called = false;
    if (!lazy) {
        res = await fn();
        called = true;
    }
    return async (refresh) => {
        if (!called || refresh) {
            called = true;
            res = await fn();
        }
        return res;
        //if you call me, your result will be remembered
    }
}


/**
 * 
 * 
 * 
 * tiny samples
async function some_component() {
    this.data = co_data({
        data: 1,
        dt: 3
    });
    this.mesh = null;
    this.process = co_loop(() => {
    });
}
new (class {
    id = "background";
    data = {
        a: 5,
        b: 77
    };
    mesh = co_setup(() => {

    });
    process1 = co_loop(() => {

    })
});


 */