export function denote(str, ops) {
    var ops = {
        sk: "<", //start key
        ak: "+", //append key
        ek: ">", //end key
        dk: "?", //defer key
        skm: "[", //start key meta
        ekm: "]", //end key meta
        sv: "[", //defer key
        ev: "]", //defer key
    };
    var result = {};
    var meta = {};
    var is_defered = 0;
    var context = 0; //0 = none, 1 = key, 2 = value
    var key_frag = "";
    var key_meta = [];
    var val_frag = "";
    var key = "";
    var vals = [];
    var start = 0;
    var clean_counter = 0;
    var len = 0;
    var to = 0;

    var text = "";

    function human(i) {
        if (i < 0) {
            text = text.substr(0, text.length + i);
            clean_counter += i;
            len += i;
            return;
        }
        clean_counter += 1;
        len += 1;
        text += (str[i]);
    }

    function end_seg(pos) {

        if (key_frag != "") {
            if (vals.length == 0) {
                result[key_frag] = null;
            }
            else if (vals.length == 1) {
                result[key_frag] = vals[0];
            } else {
                result[key_frag] = vals;
            }
        }

        for (var i = 0; i < key_meta.length; i++) {
            try {
                //currently, we only support numbers
                var min_len = parseInt(key_meta[i]);
                if (!Array.isArray(result[key_frag])) {
                    result[key_frag] = [result[key_frag]];
                }
                result[key_frag].length = Math.max(result[key_frag].length, min_len);
            }
            catch (e) {

            }
        }

        meta[key_frag] = {
            chunk: text.substr(start, to - start)
        };

        key_frag = "";
        val_frag = "";
        key = "";
        key_meta = [];
        vals = [];
        start = pos;
        to = pos;
        len = 0;
        is_defered = 0;

    }

    function check_key_command() {
        if (key_frag[key_frag.length - 1] != ops.ekm) {
            return; //nothing to do
        }
        var cmd = "";
        var valid_Cmd = false;

        for (var i = key_frag.length - 2; i >= 0; i--) {
            if (key_frag[i] == ops.skm) {
                valid_Cmd = true;
                break;
            }
            cmd = key_frag[i] + cmd;
        }
        if (!valid_Cmd) return;
        human(-cmd.length - 2);
        key_frag = key_frag.substr(0, key_frag.length - cmd.length - 2);
        key_meta.push(cmd);
    }

    function next_key(starts) {
        var i = starts;
        for (i = starts; i < str.length; i++) {
            if (str[i] == ops.sk) {
                //found
                i += 1;
                starts = i - 1;
                start = clean_counter;
                break;
            }
            human(i);
        }
        for (i; i < str.length; i++) {
            var c = str[i];
            if (c == ops.ek) {
                if (key_frag == ops.dk) {
                    is_defered = 1;
                    key_frag = "";
                    human(-1);
                    break;
                }
                //post process key
                check_key_command();
                to = clean_counter;
                break;
            }
            if (str[i] == ops.ak) {
                continue;
            }
            key_frag += str[i];
            human(i);
        }
        return i;
    }

    function grab_value(starts) {
        var i = starts;
        var val = "";
        var good = false;
        for (i; i < str.length; i++) {
            var c = str[i];
            if (c == ops.ev) {
                good = true;
                break;
            }
            human(i);
            val += c;
        }
        if(!good) return;
        to = clean_counter;
        var float = Number.parseFloat(val);
        var int = Number.parseInt(val);
        var fin = val;
        if (!Number.isNaN(int) && !Number.isNaN(float)) {
            if (int == float) {
                fin = int;
            }
            else {
                fin = float;
            }
        }
        vals.push(fin);
        return i;
    }

    for (var i = 0; i < str.length; i++) {
        var c = str[i];
        if (key_frag != "" || is_defered) { //has active key
            if (c == ops.sk && str[i + 1] != ops.ak) { //cur key is terminated
                end_seg(clean_counter); //starts new key now, rewind i
                i = next_key(i);
                continue;
            }
            else if (c == ops.sk && str[i + 1] == ops.ak) {
                i = next_key(i);
                continue;
            }
            //not inside key
            else if (c == ops.sv) {
                i = grab_value(i + 1);
                continue;
            }
        }
        else {
            i = next_key(i); //find keys
            continue;
        }
        human(i);
    }
    end_seg(clean_counter);

    // console.log(text);
    return {
        raw: str,
        text: text,
        data: result,
        meta: meta
    };
}

//sample -> 
//  denote('患者<肺部体积>为：[1552.3][ml]，其中<病灶占肺部>的<+比例>为：[26.6][%]，所有<病灶平均Hu[2]>为：[-469]，<肺部区域>共发现[10处][异常]区域，<病情评估[2]>为：[较为严重]。')
