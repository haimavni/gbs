import { autoinject } from 'aurelia-dependency-injection';
import { DialogController } from 'aurelia-dialog';

@autoinject
export class Chat {
    chatroom_id;
    controller: DialogController;

    constructor(controller: DialogController) {
        this.controller = controller;
    }

    activate(model) {
        this.chatroom_id = model.chatroom_id;
    }

    room_deleted() {
        this.controller.close(true, 'deleted')
    }
}
