import "operative";

var dataReceiver = operative(function (buffer, cb) {
    var data = new Float32Array(buffer.data[0]);
    for (var i = buffer.start; i < buffer.end; i++) {
        data[i]++;
    }
    cb.transfer({
        test: data.buffer
    }, [data.buffer])
});

function chunk() {
    var arr = new Float32Array(3 * 240000);
    return dataReceiver.transfer({
            start: 0,
            end: 3 * 240000,
            data: [arr.buffer]
        },
        [arr.buffer]
        // ,
        // function (r) { // regular callback
        //     arr = new Float32Array(r.test);
        //     job(i - 1)
        // }
    ).then((r) => {
        arr = new Float32Array(r.test);
        // console.log(arr);
    });
}


function work() {
    var job = [];
    for (var batch = 0; batch < 6; batch++) {
        job.push(chunk());
    }
    console.time("go");
    Promise.all(job)
        .then(function () {
            console.timeEnd("go");
            // console.log("All Done!")
            requestAnimationFrame(work);
        })
}

// work();

var dummy = () => {
    a = a + b;
}

function strip_function(func) {
    var f = func.toString();
    f = f.substring(f.indexOf("{") + 1);
    f = f.substring(0, f.lastIndexOf("}"));
    return f.trim();
}

function build() {
    function template(buffer, cb) {
        var a = 20;
        var b = 12;
        REPLACE_ME;
        test(1,2);
        cb(test(3,4));
    }
    var temp;
    eval(
        "temp = " + template.toString().replace("REPLACE_ME;", strip_function(dummy)).replace("template", "")
    );
    return operative({
        work: temp,
        test: function (a, b) {
            return a + b;
        }
    });
}
// console.log(build());

var test2 = build();

test2.work.transfer({}, [], function (c) {
    console.log(c);
})