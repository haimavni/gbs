import { IDialogController } from '@aurelia/dialog';

export class EditUser {
    curr_user;

    constructor(@IDialogController private readonly controller: IDialogController) {

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
