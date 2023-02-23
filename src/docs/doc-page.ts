import { ICustomElementViewModel } from "aurelia";
import { IDialogController } from '@aurelia/dialog';
import { ITheme } from "../services/theme";

export class DocPage implements ICustomElementViewModel {
    doc_src;

    constructor(
        @ITheme readonly theme: ITheme,
        @IDialogController readonly dialog: IDialogController
    ) {}

    activate(model) {
        this.doc_src = model.doc_src;
    }

    drag_move_doc(customEvent) {
        if (!this.theme.is_desktop) {
            const event = customEvent.detail;
            const el = document.getElementById("doc-area");
            let mls = el.style.marginLeft || "0px";
            mls = mls.replace("px", "");
            const ml = Math.min(0, parseInt(mls) + event.dx);
            el.style.marginLeft = `${ml}px`;
        }
    }

    close_doc() {
        this.dialog.ok();
    }
}
