import { ICustomElementViewModel } from 'aurelia';
import { IDialogController } from '@aurelia/dialog';


export class CustomDialog implements ICustomElementViewModel {
    public model: any;

    //static $view = this.model.html;

    constructor(@IDialogController readonly controller: IDialogController) {

    }

    activate(model) {
        this.model = model
    }
}

