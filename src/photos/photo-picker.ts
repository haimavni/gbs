import { ITheme } from "../services/theme";
import { IDialogController } from "@aurelia/dialog";

export class PhotoPicker {
    associated_photos = [];
    params: {};

    constructor(
        @ITheme private readonly theme: ITheme,
        @IDialogController private readonly dc: IDialogController
    ) {}

    activate(model) {
        this.associated_photos = model.associated_photos;
        this.params = {
            associated_photos: this.associated_photos,
            show_recent_photo_ids: true,
        };
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
        document.body.classList.add("dialog-body");
    }

    deactivate() {
        this.theme.hide_title = false;
        this.theme.hide_menu = false;
        document.body.classList.remove("dialog-body");
    }

    go_back() {
        this.dc.ok(this.params);
    }

    cancel() {
        this.dc.cancel();
    }
}
