import qps from "qps";

var _promise_queues = {};

export function Promise_Queue_Settings(_queue_name, concurrent_max, interval, qps) {
    _promise_queues[_queue_name] = _promise_queues[_queue_name] || [];
    _promise_queues[_queue_name].__min_interval = interval || undefined;
    _promise_queues[_queue_name].__lim_qps = qps || undefined;
    _promise_queues[_queue_name].__max_con = concurrent_max || undefined;
}

function p_q_add(_queue_name, __cur) {
    _promise_queues[_queue_name] = _promise_queues[_queue_name] || [];
    if (_promise_queues[_queue_name].__id == undefined) {
        _promise_queues[_queue_name].__id = 0;
    }
    if (_promise_queues[_queue_name].__last_call == undefined) {
        _promise_queues[_queue_name].__last_call = 0;
    }
    if (_promise_queues[_queue_name].__working == undefined) {
        _promise_queues[_queue_name].__working = [];
    }
    if (_promise_queues[_queue_name].__qps == undefined) {
        _promise_queues[_queue_name].__qps = new qps();
    }
    __cur.__id = _promise_queues[_queue_name].__id++;
    _promise_queues[_queue_name].unshift(__cur);
    p_q_next(_promise_queues[_queue_name]); //start the queue if needed
}

function p_q_next(queue) {
    if (!queue || queue.length == 0) return; //done
    if (queue.__max_con &&
        queue.__working.length >
        queue.__max_con) {
        console.warn("Promise_Queue", "CONCURRENCY LIM", queue.__max_con);
        return;
    }
    if (queue.__min_interval &&
        (Date.now() - queue.__last_call) <= queue.__min_interval) {
        var next = Math.max(100, queue.__min_interval - (Date.now() - queue.__last_call));
        clearTimeout(queue.__timeout);
        console.warn("Promise_Queue", "INTERVAL THROTTLE", next);
        queue.__timeout = setTimeout(() => {
            p_q_next(queue);
        }, next)
        return;
    }
    if (queue.__lim_qps && queue.__qps.get() >= queue.__lim_qps) {
        clearTimeout(queue.__timeout);
        console.warn("Promise_Queue", "QPS THROTTLE", queue.__qps.get(), queue.__lim_qps);
        queue.__timeout = setTimeout(() => {
            p_q_next(queue);
        }, 100)
        return;
    }
    var _next = queue.pop();
    var id = _next.__id;
    queue.__working.push(id);
    queue.__qps.plus(1);
    queue.__last_call = Date.now();
    _next(() => {
        var index = queue.__working.indexOf(id);
        queue.__working = queue.__working.splice(
            index, 1
        );
        p_q_next(queue);
    });
}

export function Promise_Queue(return_promise, _queue_name) {
    _queue_name = _queue_name || "default";
    var promise = new Promise((res, rej) => {
        function actual_work(__done) {
            return_promise().then(
                (data) => {
                    res(data);
                    __done();
                }, (e) => {
                    rej(data);
                    __done();
                })
        }
        p_q_add(_queue_name, actual_work);
    })
    return promise;
}