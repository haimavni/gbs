import { bindable, inject, computedFrom, DOM, bindingMode } from 'aurelia-framework';
import { User } from '../../../services/user';
import { DialogService } from 'aurelia-dialog';
import { Chat } from '../../../user/chat';
import { timingSafeEqual } from 'crypto';

@inject(DOM.Element, User, DialogService, Chat)
export class ChatButtonCustomElement {
    @bindable({ defaultBindingMode: bindingMode.twoWay }) chatroom_id;
    user;
    dialog;
    element;

    constructor(element, user: User, dialog: DialogService) {
        this.user = user;
        this.dialog = dialog;
        this.element = element;
    }

    @computedFrom('user.isLoggedIn', 'chatroom_id')
    get can_chat() {
        return this.user.privileges.EDITOR && this.user.isLoggedIn || this.chatroom_id;
    }

    async chat() {
        let n = 0;
        if (!this.chatroom_id) {
            this.dispatch_new_chatroom_event();
            while (!this.chatroom_id && n < 50) {
                await sleep(100);
                n += 1;
            }
        }
        if (!this.chatroom_id) return;
        document.body.classList.add('edged-dialog');
        this.dialog.open({ viewModel: Chat, model: { chatroom_id: this.chatroom_id }, lock: false })
            .whenClosed(result => { document.body.classList.remove('edged-dialog'); });
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
