import { bindable, autoinject, singleton, bindingMode } from 'aurelia-framework';
import { User } from '../../../services/user';
import { Theme } from '../../../services/theme';
import { MemberGateway } from '../../../services/gateway';
import { EventAggregator } from 'aurelia-event-aggregator';

@autoinject()
@singleton()
export class ChatroomCustomElement {
    user: User;
    theme: Theme;
    api: MemberGateway;
    ea: EventAggregator;
    @bindable room_number;
    @bindable room_index;
    messages = [];
    chatroom_name;
    user_message = "";
    messages_filter = "";

    constructor(user: User, theme: Theme, api: MemberGateway, ea: EventAggregator) {
        this.user = user;
        this.theme = theme;
        this.api = api;
        this.ea = ea;
    }

    scroll_to_bottom() {
        let el = document.getElementById("scroll-area");
        el.scrollTop = 10000; //el.scrollHeight - el.scrollTop;
    }

    attached() {
        this.read_chatroom();
    }

    send_message() {
        if (! this.user_message) {
            return;
        }
        this.api.call_server('stories/send_message', { user_message: this.user_message, room_number: this.room_number, room_index: this.room_index, user_id: this.user.id | 2 })
            .then((data) => {
                this.user_message = "";
            });
    }

    read_chatroom() {
        this.api.call_server('stories/read_chatroom', { room_number: this.room_number })  //room number was injected onload in the html
            .then((data) => {
                this.chatroom_name = data.chatroom_name;
                this.messages = data.messages;
            });
        let info = { user_message: '' };
        this.api.listen('CHATROOM' + this.room_number);
        this.ea.subscribe('INCOMING_MESSAGE' + this.room_number, (msg) => {
            this.handle_incoming_message(msg);
        })
    }

    handle_incoming_message(msg) {
        this.messages.push(msg);
    };

    handle_selected() {
        window.setTimeout(() => {
            this.scroll_to_bottom();
        });
    }

    created() {
        this.ea.subscribe('SELECTED-chat', this.handle_selected)
    }
}

