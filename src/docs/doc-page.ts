import { Theme } from "../services/theme";
import { autoinject } from 'aurelia-framework';
import {DialogController} from 'aurelia-dialog';


@autoinject
export class DocPage {
    doc_src;
    theme;
    dialog;

    constructor(theme: Theme, dialog: DialogController) {
        this.theme = theme;
        this.dialog = dialog;
    }

    loading(model) {
        this.doc_src = model.doc_src;
    }

    drag_move_doc(customEvent) {
        if (! this.theme.is_desktop) {
            let event = customEvent.detail;
            let el = document.getElementById("doc-area");
            let mls = el.style.marginLeft || "0px";
            mls = mls.replace('px', '');
            let ml = Math.min(0, parseInt(mls) + event.dx);
            el.style.marginLeft = `${ml}px`;
        }

    }

    close_doc() {
        this.dialog.ok();
    }
}
