export const global_vars = ["THREE", "PIXI"];

export function useGlobal(arr, alias, debug) {
    arr = arr || global_vars;
    debug = debug || false;
    alias = alias || true;
    var code = "{";
    code += `
        var debug = ${debug};
        var error = 0;
    `;
    for (var i = 0; i < arr.length; i++) {
        code += (`
        try {
            ${arr[i]} = window["${arr[i]}"]
        } catch(e) {
            error++;
            if(debug) {
                console.warn("Warning: global var [${arr[i]}] not available\\n\\n", e)
            }
        }
        `);
        if (alias) {
            code += (`
                try {
                    ${arr[i].toLowerCase()} = window["${arr[i]}"]
                } catch(e) {
                    error++;
                    if(debug) {
                        console.warn("Warning: lower case alias [${arr[i].toLowerCase()}] not available\\n\\n", e)
                    }
                }
        `);
        }
    }
    code += `
        if(error == 0 && debug) {
            console.log("useGlobal() -> injection successful");
        }
    `;
    code += "}"
    return code;
}