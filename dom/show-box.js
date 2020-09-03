export function domMakeShowBox({
    el = "#ao-showbox",
    scaler = 0.8,
    production = false,
    autoCenter_production = true
}) {
    var d = document.querySelector(el);
    var child = d.children.item(0);

    if (production) {
        d.style.transformOrigin = "0% 0%";
        d.style.position = "absolute";
        if (autoCenter_production) {
            d.style.top = "50%";
            d.style.left = "50%";
            d.style.transform = "translate(-50%, -50%)";
        }
        // child.style.position = `absolute`;
        // child.style.transformOrigin = `0 0`;
        d.classList.add("production")
        return;
    }

    d.classList.add("dev")

    d.style.transform = "translate(-50%, -50%)";
    d.style.transformOrigin = "50% 50%";
    d.style.position = "absolute";
    d.style.top = "50%";
    d.style.left = "50%";
    d.style.opacity = 0;
    child.style.position = `absolute`;
    child.style.transformOrigin = `0 0`;

    var def = 0;
    var timer = 0;
    function defer(fn, timeout) {
        clearTimeout(timer);
        timer = setTimeout(fn, timeout);
    }

    function update() {
        var real_w = child.scrollWidth;
        var real_h = child.scrollHeight;
        // var good_w = d.parentElement.clientWidth;
        // var good_h = d.parentElement.clientHeight;
        var good_w = window.innerWidth;
        var good_h = window.innerHeight;
        var scale = Math.min(
            good_w / real_w,
            good_h / real_h
        ) * scaler;
        // var x = good_w / 2 - real_w * scale / 2;
        // var y = good_h / 2 - real_h * scale / 2;
        // d.style.transform = `translate(${x}px, ${y}px)`;
        child.style.transform = `scale(${scale.toFixed(3)})`;
        d.style.width = real_w * scale + "px";
        d.style.height = real_h * scale + "px";

        if (def == 0) {
            setTimeout(() => {
                child.style.transition = "transform 0.5s ease";
                d.style.transition = "transform 0.5s ease-out, opacity 0.1s ease, width 0.5s ease, height 0.5s ease";
                // d.style.transform = "translate(-50%, -50%) scale(1)";
                d.style.opacity = 1;
            }, 200)
        }
        def = 100;
    }

    window.addEventListener('resize', () => { defer(update, def); });
    var obs = new ResizeObserver(() => { defer(update, def); }).observe(child);
}