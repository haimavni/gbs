import { bindable, autoinject, singleton, bindingMode } from 'aurelia-framework';
import { User } from '../../../services/user';
import { MemberGateway } from '../../../services/gateway';
import { EventAggregator } from 'aurelia-event-aggregator';

@autoinject()
@singleton()
export class Chatroom {
    user: User;
    api: MemberGateway;
    ea: EventAggregator;
    room_number;
    messages = [];

    constructor(user: User, api: MemberGateway, ea: EventAggregator) {
        this.user = user;
        this.api = api;
        this.ea = ea;
    }

    scroll_to_bottom() {
        let el = document.getElementById("scroll-area");
        el.scrollTop = 10000; //el.scrollHeight - el.scrollTop;
    }

    read_chatroom() {
        this.api.call_server('stories/read_chatroom', { room_number: room_number })  //room number was injected onload in the html
            .then((data) => {
                let chatroom_name = data.chatroom_name;
                let messages = data.messages;
            });
        let info = { user_message: '' };
        this.api.listen('CHATROOM' + this.room_number);
        this.ea.subscribe('INCOMING_MESSAGE' + this.room_number, () => {
            this.api.call_server('stories/send_message', { user_message: info.user_message, room_number: this.room_number, room_index: this.room_index })
                .then(function (data) {
                    info.user_message = "";
                });
        }
    }

    handle_incoming_message(msg) {
        this.messages.push(msg);
    };

    handle_selected() {
        window.setTimeout(() => () {
            this.scroll_to_bottom();
        });
    }

    created() {
        this.ea.subscribe('SELECTED-chat', this.handle_selected)
    }
}

