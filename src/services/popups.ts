import { EventAggregator } from 'aurelia-event-aggregator';
import { autoinject } from 'aurelia-framework';
import { DialogService } from 'aurelia-dialog';

@autoinject
export class Popup {
    popupWindows = {};
    dialogs = [];
    ea: EventAggregator;
    dialog: DialogService;

    constructor(ea: EventAggregator, dialog: DialogService) {
        this.ea = ea;
        this.dialog = dialog;
        this.ea.subscribe('router:navigation:complete', response => {
            this.dialog.closeAll();
        })
    }

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
