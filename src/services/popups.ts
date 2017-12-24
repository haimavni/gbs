export class Popup {
    popupWindows = {};

    popup(key, url, params) {
        let hnd = this.popupWindows[key];
        if (hnd) {
            hnd.close();
        }
        let w = this.popupWindows[key] = window.open(url, '_blank', params);
        let d = w.document;
        return w;
    }
}
