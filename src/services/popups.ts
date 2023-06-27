import { DI } from "aurelia";

export type IPopup = Popup;
export const IPopup = DI.createInterface<IPopup>("IPopup", (x) =>
    x.singleton(Popup)
);

export class Popup {
    popupWindows = {};

    popup(key, url, params) {
        let hnd = this.popupWindows[key];
        if (hnd) {
            hnd.close();
        }
        let w = this.popupWindows[key] = window.open(url, '_blank', params);
        return w;
    }

}
