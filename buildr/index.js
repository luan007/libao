import * as vue from "vue/dist/vue.esm-bundler.js";
import "./lite";

export const VERSION = '0-A';

var Dummy = (props) => {
    return <div>Dummy Item</div>
};


// [
//     {
//         generic: edit(0, "SomeName", { type: "number", title: "Some Important Number" }),
//         color: color("Color", [0, 0, 0], { some_meta: 0 }),
//         nested: complex_editor("Nested", {}, { some_other_meta: 0 })
//     }
// ];


var ComponentMap = {
    "obj": Buildr,
    "dummy": Dummy
};

var Buildr = vue.defineComponent({
    props: ["ctx"],
    // template: `
    //     <div>
    //         <component v-for="i in ctx" :is="i.type" v-bind="i" />
    //     </div>
    // `,
    render() {
        var m = this.ctx.m;
        return (<Buildr_Container obj={m}></Buildr_Container>)
    }
});

export function ctx() {
    return {
        m: vue.reactive({}) //m is the mounting point
    };
}

export function edit(obj_with_description, ctx = defaultContext) {
    ctx.m.push(obj_with_description)
}

export var defaultContext = ctx();
window.defaultContext = defaultContext;

export function mount(domElement = null, ctx = defaultContext) {
    //this will give 
    var app = vue.createApp({
        render() {
            return <Buildr ctx={ctx}></Buildr>
        }
    });

    for (var i in ComponentMap) {
        app.component(i, ComponentMap[i]);
    }
    ctx.app = app;

    if (!domElement) {
        var root = document.createElement("div");
        root.classList.add("buildr_root");
        domElement = root;
        document.body.appendChild(domElement);
    }
    ctx.domElement = domElement;
    ctx.app.mount(ctx.domElement);
    return ctx;
}