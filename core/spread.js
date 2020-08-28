export function forCircle(count, cb = (deg, i, count) => { }) {
    for (var i = 0; i < count; i++) {
        cb(i / count * Math.PI * 2, i, count);
    }
}
export function forSphere(count, cb = (deg, i, count) => { }) {
    for (var i = 0; i < count; i++) {
        // cb(i / count * Math.PI * 2, i, count);
    }
}