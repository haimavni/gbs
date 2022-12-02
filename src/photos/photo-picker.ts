import { ICustomElementViewModel, IDialogController } from 'aurelia';
import { ITheme } from '../services/theme';

export class PhotoPicker implements ICustomElementViewModel {
    associated_photos = [];
    params: {};

    constructor(@ITheme readonly theme: ITheme, @IDialogController readonly dc: IDialogController) {

    }

    activate(model) {
        this.associated_photos = model.associated_photos;
        console.log("photo picker assoc: ", this.associated_photos);
        this.params = {associated_photos: this.associated_photos};
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
        document.body.classList.add('dialog-body');
    }

    deactivate() {
        this.theme.hide_title = false;
        this.theme.hide_menu = false;
        document.body.classList.remove('dialog-body');
    }

    go_back() {
        console.log("going  back. params: ", this.params);
        this.dc.ok(this.params);
    }

    cancel() {
        this.dc.cancel();
    }

}
