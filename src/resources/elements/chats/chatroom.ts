import { bindable, autoinject, inject, DOM, bindingMode, computedFrom } from 'aurelia-framework';
import { User } from '../../../services/user';
import { Theme } from '../../../services/theme';
import { MemberGateway } from '../../../services/gateway';
import { EventAggregator } from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';

@inject(DOM.Element, User, Theme, I18N, MemberGateway, EventAggregator)
//@singleton()
export class ChatroomCustomElement {
    element;
    user: User;
    theme: Theme;
    api: MemberGateway;
    ea: EventAggregator;
    i18n: I18N;
    @bindable room_number;
    @bindable room_index;
    messages = [];
    chatroom_name;
    user_message = "";
    messages_filter = "";
    scroll_area;
    edited_message_id = 0;
    subscription;
    listener;
    editing = false;
    was_logged_in = false;

    constructor(element, user: User, theme: Theme, i18n: I18N, api: MemberGateway, ea: EventAggregator) {
        this.element = element;
        this.user = user;
        this.theme = theme;
        this.i18n = i18n;
        this.api = api;
        this.ea = ea;
    }

    async scroll_to_bottom() {
        let div = null;
        for (let i = 0; i < 10; i++) {
            div = this.scroll_area;
            if (div) break;
            await sleep(10);
        }
        if (!div) return;
        setTimeout(() => {
            div.scrollTop = div.scrollHeight; // - div.clientHeight + 150
        }, 10);
    }

    attached() {
        this.read_chatroom();
        this.was_logged_in = this.user.isLoggedIn;
    }

    detached() {
        this.subscription.dispose();
        this.listener.then((data) => {
            data.close();
        });
        if (this.messages.length == 0) {
            this.api.call_server('chats/disconnect_chatroom', { room_number: this.room_number });
        }
        if (this.user.isLoggedIn && !this.was_logged_in)
            this.user.logout();
    }

    send_message() {
        if (!this.user_message) {
            return;
        }
        this.api.call_server_post('chats/send_message', { user_message: this.user_message, room_number: this.room_number, room_index: this.room_index, user_id: this.user.id | 2 })
            .then((data) => {
                this.user_message = "";
            });
    }

    read_chatroom() {
        this.api.call_server('chats/read_chatroom', { room_number: this.room_number })  //room number was injected onload in the html
            .then((data) => {
                this.chatroom_name = data.chatroom_name;
                this.messages = data.messages;
                this.scroll_to_bottom();
            });
        this.listener = this.api.listen('CHATROOM' + this.room_number);
        this.subscription = this.ea.subscribe('INCOMING_MESSAGE' + this.room_number, (msg) => {
            this.handle_incoming_message(msg);
        })
    }

    handle_incoming_message(msg) {
        this.messages.push(msg);
        let div = this.scroll_area;
        setTimeout(() => {
            div.scrollTop = div.scrollHeight; // - div.clientHeight + 150
        }, 10);
    };

    handle_selected() {
        window.setTimeout(() => {
            this.scroll_to_bottom();
        });
    }

    created() {
        this.ea.subscribe('SELECTED-chat', this.handle_selected)
    }

    delete_message(msg, index) {
        this.messages.splice(index, 1);
        this.api.call_server_post('chats/delete_message', { message: msg })
    }

    edit_message(msg, index) {
        this.edited_message_id = msg.id;
        msg.message = msg.message.replace(/<br\/>/g, "\n");
    }

    save_edited_message(msg) {
        this.edited_message_id = 0;
        msg.message = msg.message.replace(/\n/g, '<br/>');
        this.api.call_server('chats/update_message', { user_message: msg.message, user_id: this.user.id | 2, msg_id: msg.id });
    }

    @computedFrom('user.isLoggedIn')
    get readonly() {
        return !this.user.isLoggedIn;
    }

    delete_chatroom() {
        if (! confirm(this.i18n.tr('chats.confirm-delete'))) return;
        this.api.call_server('chats/delete_chatroom', { room_number: this.room_number })
            .then(response => {
                this.dispatch_event('deleted');
                //notify chatroom group to remove it from the list
            })
    }

    edit_chatroom_name() {
        this.editing = true;
    }

    save_chatroom_name() {
        this.editing = false;
        this.api.call_server('chats/rename_chatroom', { new_chatroom_name: this.chatroom_name, room_number: this.room_number });
    }

    dispatch_event(what) {
        let changeEvent = new CustomEvent(what, {
            detail: {
                command: what
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


