import { IDialogController } from 'aurelia';

export class Chat {
    chatroom_id;

    constructor(@IDialogController readonly controller: IDialogController) {

    }

    loading(model) {
        this.chatroom_id = model.chatroom_id;
    }

    room_deleted() {
        this.controller.closed(true, 'deleted');
    }
}
