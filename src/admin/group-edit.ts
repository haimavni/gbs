import { autoinject } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';

@autoinject
export class GroupEdit {
    curr_group;
    controller: DialogController;

    constructor(controller: DialogController) {
        this.controller = controller;
    }

    activate(params) {
        this.curr_group = params.curr_group;
    }

    save() {
        this.controller.ok();
    }

    cancel() {
        this.controller.cancel();
    }

}
