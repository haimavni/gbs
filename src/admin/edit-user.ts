import { autoinject } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';

@autoinject
export class EditUser {
    curr_user;
    controller: DialogController;

    constructor(controller: DialogController) {
        this.controller = controller;
    }

    activate(params) {
        this.curr_user = params.curr_user;
    }

    save() {
        this.controller.ok();
    }

    cancel() {
        this.controller.cancel();
    }

}
