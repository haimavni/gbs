export class Popup {
    popupWindows = {};

    popup(key, url, params, replace=true) {
        console.log("url in popup: ", url);
        let hnd = this.popupWindows[key];
        if (hnd && replace) {
            hnd.close();
        }
        let w = this.popupWindows[key] = window.open(url, '_blank', params);
        return w;
    }

}
