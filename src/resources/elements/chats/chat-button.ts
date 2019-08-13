import { bindable, inject, computedFrom, DOM } from 'aurelia-framework';
import { User } from '../../../services/user';
import { DialogService } from 'aurelia-dialog';
import { Chat } from '../../../user/chat';
import { timingSafeEqual } from 'crypto';

@inject(DOM.Element, User, DialogService, Chat)
export class ChatButtonCustomElement {
    @bindable chatroom_id;
    user;
    dialog;
    element;

    constructor(element, user: User, dialog: DialogService) {
        this.user = user;
        this.dialog = dialog;
        this.element = element;
    }

    @computedFrom('user.isLoggedIn')
    get can_chat() {
        return this.user.privileges.EDITOR && this.user.isLoggedIn || this.chatroom_id;
    }

    chat() {
        if (!this.chatroom_id) {
            this.dispatch_new_chatroom_event();
            //sleep until this.chatroom_id is not null
        }
        this.dialog.open({ viewModel: Chat, model: { chatroom_number: this.chatroom_id }, lock: false })
    }

    dispatch_new_chatroom_event() {
        let customEvent = new CustomEvent('new-chatroom', {
            detail: {
                new_name: 'new chatroom'
            },
            bubbles: true
        });
        this.element.dispatchEvent(customEvent);
    }

}
