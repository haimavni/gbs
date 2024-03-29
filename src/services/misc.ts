import { autoinject, noView, singleton } from "aurelia-framework";
import { MemberGateway } from "./gateway";
import { I18N } from "aurelia-i18n";
import environment from "../environment";

@autoinject()
@singleton()
@noView()
export class Misc {
    i18n;
    api;
    crc_table;
    storage = {};
    _url_shortcut = null;
    recent_photo_ids = [];

    constructor(api: MemberGateway, i18n: I18N) {
        this.api = api;
        this.i18n = i18n;
        //this.create_table();
    }

    calc_life_cycle_text(member_info) {
        let s = "";
        let birth_place = member_info.placeofbirth;
        let birth_date = member_info.date_of_birth
            ? member_info.date_of_birth.date
            : "";
        let death_place = member_info.place_of_death;
        let death_date = member_info.date_of_death
            ? member_info.date_of_death.date
            : "";
        let gender = member_info.gender || "M";
        if (birth_date || birth_place) {
            s += this.i18n.tr("members.born-" + gender.toLowerCase()) + " ";
            if (birth_place) {
                s += this.i18n.tr("members.in-place") + birth_place + " ";
            }
            if (birth_date) {
                s += this.i18n.tr("members.in-date") + birth_date + ".";
            }
        }
        if (death_date) {
            const n = death_date.length;
            const s = death_date.substring(n - 4, n);
            if (s == "1000") death_date = null;
        }
        if (death_date) {
            let cod_idx = member_info.cause_of_death || 0;
            if (!this.api.constants.cause_of_death) return s;
            let keys = Object.keys(this.api.constants.cause_of_death);
            let cod = "";
            for (let key of keys) {
                if (this.api.constants.cause_of_death[key] == cod_idx) {
                    key =
                        "consts." +
                        (key.replace(/_/g, "-") + "-" + gender).toLowerCase();
                    cod = this.i18n.tr(key);
                    break;
                }
            }
            s += " " + cod + " ";
            if (death_place) {
                s += this.i18n.tr("members.in-place") + death_place + " ";
            }
            s += this.i18n.tr("members.in-date") + death_date;
        }
        return s;
    }

    old_display_name(rec) {
        let s = rec.name || "";
        if (rec.formername) s += " (" + rec.formername + ")";
        if (rec.nickname) s += " - " + rec.nickname;
        return s;
    }

    calc_member_display_name(rec) {
        if (!rec.first_name) return this.old_display_name(rec);
        let s =
            (rec.title ? rec.title + " " : "") +
            (rec.first_name || "") +
            " " +
            (rec.last_name || "");
        if (rec.former_first_name || rec.former_last_name) {
            s += " (";
            if (rec.former_first_name) s += rec.former_first_name;
            if (rec.former_last_name) {
                if (rec.former_first_name) s += " ";
                s += rec.former_last_name;
            }
            s += ")";
        }
        if (rec.nickname) s += " - " + rec.nickname;
        return s;
    }

    static last(array) {
        return array[array.length - 1];
    }

    make_selection(section, option_names) {
        let result = [];
        for (let opt of option_names) {
            let option = {
                value: opt,
                name: this.i18n.tr(section + "." + opt),
            };
            result.push(option);
        }
        return result;
    }

    empty_object(obj) {
        let keys = Object.keys(obj);
        return keys.length == 0;
    }

    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    extrapolate(s, params) {
        if (!params) return s;
        //in rtl the $ might be on the right
        s = s.replace(
            /{.+?}\$/g,
            (x) => "${" + x.substr(1, x.length - 3) + "}"
        );
        return s
            .replace(/\${.+?}/g, (x) => params[x.substr(2, x.length - 3)])
            .slice(0);
    }

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    update_history(history, str, max_count = 5) {
        let i = history.findIndex((option) => option == str);
        if (i > 0) {
            history.splice(i, 1);
        }
        if (i != 0) {
            let lst = [str];
            history = lst.concat(history);
        }
        history.splice(max_count, 999);
        return history;
    }

    random_string() {
        return Math.random();
        //return crypto.randomBytes(64).toString('hex');
    }

    crc32FromArrayBufferOld(ab, crc = null) {
        let table = new Uint32Array([
            0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419,
            0x706af48f, 0xe963a535, 0x9e6495a3, 0x0edb8832, 0x79dcb8a4,
            0xe0d5e91e, 0x97d2d988, 0x09b64c2b, 0x7eb17cbd, 0xe7b82d07,
            0x90bf1d91, 0x1db71064, 0x6ab020f2, 0xf3b97148, 0x84be41de,
            0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7, 0x136c9856,
            0x646ba8c0, 0xfd62f97a, 0x8a65c9ec, 0x14015c4f, 0x63066cd9,
            0xfa0f3d63, 0x8d080df5, 0x3b6e20c8, 0x4c69105e, 0xd56041e4,
            0xa2677172, 0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b,
            0x35b5a8fa, 0x42b2986c, 0xdbbbc9d6, 0xacbcf940, 0x32d86ce3,
            0x45df5c75, 0xdcd60dcf, 0xabd13d59, 0x26d930ac, 0x51de003a,
            0xc8d75180, 0xbfd06116, 0x21b4f4b5, 0x56b3c423, 0xcfba9599,
            0xb8bda50f, 0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924,
            0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d, 0x76dc4190,
            0x01db7106, 0x98d220bc, 0xefd5102a, 0x71b18589, 0x06b6b51f,
            0x9fbfe4a5, 0xe8b8d433, 0x7807c9a2, 0x0f00f934, 0x9609a88e,
            0xe10e9818, 0x7f6a0dbb, 0x086d3d2d, 0x91646c97, 0xe6635c01,
            0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e, 0x6c0695ed,
            0x1b01a57b, 0x8208f4c1, 0xf50fc457, 0x65b0d9c6, 0x12b7e950,
            0x8bbeb8ea, 0xfcb9887c, 0x62dd1ddf, 0x15da2d49, 0x8cd37cf3,
            0xfbd44c65, 0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2,
            0x4adfa541, 0x3dd895d7, 0xa4d1c46d, 0xd3d6f4fb, 0x4369e96a,
            0x346ed9fc, 0xad678846, 0xda60b8d0, 0x44042d73, 0x33031de5,
            0xaa0a4c5f, 0xdd0d7cc9, 0x5005713c, 0x270241aa, 0xbe0b1010,
            0xc90c2086, 0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f,
            0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4, 0x59b33d17,
            0x2eb40d81, 0xb7bd5c3b, 0xc0ba6cad, 0xedb88320, 0x9abfb3b6,
            0x03b6e20c, 0x74b1d29a, 0xead54739, 0x9dd277af, 0x04db2615,
            0x73dc1683, 0xe3630b12, 0x94643b84, 0x0d6d6a3e, 0x7a6a5aa8,
            0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1, 0xf00f9344,
            0x8708a3d2, 0x1e01f268, 0x6906c2fe, 0xf762575d, 0x806567cb,
            0x196c3671, 0x6e6b06e7, 0xfed41b76, 0x89d32be0, 0x10da7a5a,
            0x67dd4acc, 0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5,
            0xd6d6a3e8, 0xa1d1937e, 0x38d8c2c4, 0x4fdff252, 0xd1bb67f1,
            0xa6bc5767, 0x3fb506dd, 0x48b2364b, 0xd80d2bda, 0xaf0a1b4c,
            0x36034af6, 0x41047a60, 0xdf60efc3, 0xa867df55, 0x316e8eef,
            0x4669be79, 0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236,
            0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f, 0xc5ba3bbe,
            0xb2bd0b28, 0x2bb45a92, 0x5cb36a04, 0xc2d7ffa7, 0xb5d0cf31,
            0x2cd99e8b, 0x5bdeae1d, 0x9b64c2b0, 0xec63f226, 0x756aa39c,
            0x026d930a, 0x9c0906a9, 0xeb0e363f, 0x72076785, 0x05005713,
            0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38, 0x92d28e9b,
            0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21, 0x86d3d2d4, 0xf1d4e242,
            0x68ddb3f8, 0x1fda836e, 0x81be16cd, 0xf6b9265b, 0x6fb077e1,
            0x18b74777, 0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c,
            0x8f659eff, 0xf862ae69, 0x616bffd3, 0x166ccf45, 0xa00ae278,
            0xd70dd2ee, 0x4e048354, 0x3903b3c2, 0xa7672661, 0xd06016f7,
            0x4969474d, 0x3e6e77db, 0xaed16a4a, 0xd9d65adc, 0x40df0b66,
            0x37d83bf0, 0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9,
            0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6, 0xbad03605,
            0xcdd70693, 0x54de5729, 0x23d967bf, 0xb3667a2e, 0xc4614ab8,
            0x5d681b02, 0x2a6f2b94, 0xb40bbe37, 0xc30c8ea1, 0x5a05df1b,
            0x2d02ef8d,
        ]);

        let ds = new Uint8Array(ab);

        if (!crc) crc = 0xffffffff;

        let dsArr = ds;
        for (let i = 0; i < dsArr.byteLength; i++) {
            crc = table[(crc ^ dsArr[i]) & 0xff] ^ (crc >> 8);
        }

        return -1 - crc;
        //return (crc ^ (-1)) >>> 0;
    }

    crc32FromArrayBuffer(data, crc = 0) {
        const poly = 0xedb88320;
        const lookup = new Uint32Array(256);
        lookup.forEach((_, i, self) => {
            let crc = i;
            for (let bit = 0; bit < 8; bit++) {
                crc = crc & 1 ? (crc >>> 1) ^ poly : crc >>> 1;
            }

            self[i] = crc;
        });
        crc = crc ? crc : 0xffffffff;
        const input = Uint8Array.from(data);
        for (let i = 0; i < input.byteLength; i++) {
            let x = input[i];
            crc = lookup[(x ^ crc) & 0xff] ^ (crc >>> 8);
        }
        return -1 - crc;
    }

    save(keys: any[], value: any) {
        let obj = this.storage;
        let key = keys[keys.length - 1];
        keys.slice(keys.length - 1);
        for (let k of keys) {
            if (!obj[k]) {
                obj[k] = {};
            }
            obj = obj[k];
        }
        obj[key] = value;
    }

    load(keys: any[]) {
        let obj = this.storage;
        let key = keys[keys.length - 1];
        keys.slice(keys.length - 1);
        for (key of keys) {
            obj = obj[key];
            if (obj == undefined) return obj;
        }
        return obj[key];
    }

    loadImage(url, elem) {
        return new Promise((resolve, reject) => {
            elem.onload = () => resolve(elem);
            elem.onerror = reject;
            elem.src = url;
        });
    }

    async cache_image(url) {
        let img_elem = document.createElement("img");
        await this.loadImage(url, img_elem);
    }

    cache_images(image_list) {
        let n = image_list.length;
        for (let image of image_list) {
            let img_elem = document.createElement("img");
            this.loadImage(image.src, img_elem).then(() => {
                n -= 1;
                if (n == 0) return;
            });
        }
    }

    make_url(name, rest = "") {
        let sep = environment.push_state ? "" : "#";
        return `${location.origin}${location.pathname}${sep}/${name}/${rest}`;
    }

    set url_shortcut(url) {
        console.log("take shortcut for url ", url);
        if (!url) {
            this._url_shortcut = null;
            return;
        }
        this.api
            .call_server_post("default/get_shortcut", { url: url })
            .then((response) => {
                let base_url = `${location.host}`;
                if (base_url == "localhost:9000") {
                    base_url = environment.baseURL; //for the development system
                }
                this._url_shortcut = base_url + response.shortcut;
                console.log("shortcut in misc: ", this._url_shortcut);
            });
    }

    get url_shortcut() {
        return this._url_shortcut;
    }

    public keep_photo_id(photo_id) {
        let idx = this.recent_photo_ids.findIndex((pid) => pid == photo_id);
        if (idx > 0) {
            this.recent_photo_ids.splice(idx, 1);
            this.recent_photo_ids.splice(0, 0, photo_id);
        } else if (idx < 0) {
            this.recent_photo_ids.splice(0, 0, photo_id);
            this.recent_photo_ids = this.recent_photo_ids.slice(0, 5);
        }
    }

    public get_recent_photo_ids() {
        return this.recent_photo_ids;
    }

    private hours() {
        const minute = 1000 * 60;
        const hour = minute * 60;
        return Math.round(Date.now() / hour);
    }

    public temp_encrypt(arg) {
        const h = this.hours();
        return (h * h) ^ arg;
    }

    public validate(arg, encr_arg) {
        for (let gap = 0; gap < 2; gap++) {
            const h = this.hours() + gap;
            const key = h * h;
            const arg1 = key ^ encr_arg;
            if (arg == arg1) return true;
        }
        return false;
    }
}
