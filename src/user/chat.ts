import { ICustomElementViewModel } from 'aurelia';
import { IDialogController } from '@aurelia/dialog';

export class Chat implements ICustomElementViewModel {
    chatroom_id;

    constructor(@IDialogController readonly controller: IDialogController) {

    }

    activate(model) {
        this.chatroom_id = model.chatroom_id;
    }

    room_deleted() {
        this.controller.closed;
    }
}
