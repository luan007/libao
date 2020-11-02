// import "@babel/polyfill" //this has been removed
import "core-js/stable";
import "regenerator-runtime/runtime";
//according to https://stackoverflow.com/questions/53558916/babel-7-referenceerror-regeneratorruntime-is-not-defined
export * from "./core/index"
export * from "./ux/index"
export * from "./fx/index"
import * as _buildr from "./prototyping/buildr/index";

import _sort from 'fast-sort';

export var sort = _sort;

import * as _yaml from "js-yaml";
export var yaml = _yaml;

//export base libs for const instances
import * as _vue from "vue3";
import _vue2 from "vue";
import _p5 from "p5";
import * as _three from "three";
import * as _postprocessing from "postprocessing";
import * as _ev3 from "eventemitter3";

export var vue = _vue;
export var Vue = _vue2;
export var p5 = _p5;
export var three = _three;
export var postprocessing = _postprocessing;
export var EventEmitter = _ev3.EventEmitter;
export var buildr = _buildr;

export * from "./storm/index"
export * from "./dom/index"
export * from "./glue/glue"
export * from "./glue/adaptors"
export * from "./glue/gasset"
import "./dom/*.less";
