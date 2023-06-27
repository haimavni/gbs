import { IDialogController } from '@aurelia/dialog';

export class CustomDialog {
    model: any;

    constructor(@IDialogController private readonly controller: IDialogController) {

    }

    activate(model) {
        this.model = model
    }
}

