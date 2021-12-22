import { Misc } from '../services/misc';
import { autoinject} from 'aurelia-framework';

@autoinject()
export class Popup {
    popupWindows = {};
    misc: Misc;

    constructor(misc: Misc) {
        this.misc = misc;
    }

    async popup(key, url, params) {
        let hnd = this.popupWindows[key];
        if (hnd) {
            hnd.close();
            await this.misc.sleep(2000);
        }
        let w = this.popupWindows[key] = window.open(url, '_blank', params);
        let d = w.document;
        return w;
    }

}
