import { DI } from "aurelia";

export const IPopup = DI.createInterface<IPopup>('IPopup', x => x.singleton(Popup));
export type IPopup = Popup;

export class Popup {
    popupWindows = {};

    popup(key, url, params) {
        const hnd = this.popupWindows[key];

        if (hnd) {
            hnd.close();
        }

        const w = this.popupWindows[key] = window.open(url, '_blank', params);
        
        return w;
    }

}
