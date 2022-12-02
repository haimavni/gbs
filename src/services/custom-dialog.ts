import { ICustomElementViewModel } from 'aurelia';
import { IDialogController } from '@aurelia/runtime-html';


export class CustomDialog implements ICustomElementViewModel {
    model: any;

    static $view = this.model.html;

    constructor(@IDialogController readonly controller: IDialogController) {

    }

    activate(model) {
        this.model = model
    }
}

