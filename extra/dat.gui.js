import * as dat from 'dat.gui';

export var datGUI = new dat.GUI();
datGUI.destroy();

export function datGUIInit() {
    datGUI = new dat.GUI();
}

export function datGUIHide() {
    datGUI.hide();
}