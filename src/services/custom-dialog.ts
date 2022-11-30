import { DI } from 'aurelia';
import { DialogController } from '@aurelia/runtime-html';

export const ICustomDialog = DI.createInterface<ICustomDialog>('ICustomDialog', x => x.singleton(CustomDialog));
export type ICustomDialog = CustomDialog;


export class CustomDialog {
    controller: DialogController;
    model: any;

    constructor(controller: DialogController) {
        this.controller = controller
    }

    activate(model) {
        this.model = model
    }

    getViewStrategy() {
        return new InlineViewStrategy(this.model.html) //requires <template></template> tags
    }
}

