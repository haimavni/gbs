import { IDialogController } from '@aurelia/dialog';

export class EditUser {
    curr_user;

    constructor(@IDialogController readonly controller: IDialogController) {}

    loading(params) {
        this.curr_user = params.curr_user;
    }

    save() {
        this.controller.ok();
    }

    cancel() {
        this.controller.cancel();
    }
}
