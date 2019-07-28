import { Theme } from "../services/theme";
import { autoinject } from 'aurelia-framework';

@autoinject
export class DocPage {
    doc_src;
    theme;

    constructor(theme: Theme) {
        this.theme = theme;
    }

    activate(model) {
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
}
