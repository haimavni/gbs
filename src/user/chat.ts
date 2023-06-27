import { IDialogController } from '@aurelia/dialog';

export class Chat {
    chatroom_id;
    constructor(@IDialogController private readonly controller: IDialogController) {

    }

    activate(model) {
        this.chatroom_id = model.chatroom_id;
    }

    room_deleted() {
        this.controller.ok({ status: 'deleted' });
    }
}
