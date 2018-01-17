import { DialogController } from 'aurelia-dialog';
import { autoinject, noView, bindable, InlineViewStrategy } from 'aurelia-framework';

@noView
@autoinject
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

