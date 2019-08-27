export function webWorkerFromSource(src) {
    var blob = new Blob([src], {
        type: 'text/javascript'
    });
    var workerUrl = URL.createObjectURL(blob);
    var worker = new Worker(workerUrl);
    return worker;
}

