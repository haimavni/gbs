import { autoinject, singleton, computedFrom } from 'aurelia-framework';
import { User } from '../../../services/user';
import { Theme } from '../../../services/theme';
import { MemberGateway } from '../../../services/gateway';
import { EventAggregator } from 'aurelia-event-aggregator';

@autoinject()
@singleton()
export class ChatroomGroupCustomElement {
    user: User;
    theme: Theme;
    api: MemberGateway;
    ea: EventAggregator;

    chatrooms = [];
    first_chatroom_number = 0;
    new_chatroom_name_visible = false;
    new_chatroom_name = '';
    subscriber;

    constructor(user: User, theme: Theme, api: MemberGateway, ea: EventAggregator) {
        this.user = user;
        this.theme = theme;
        this.api = api;
        this.ea = ea;
    }

    read_chatrooms() {
        this.api.call_server('chats/read_chatrooms')
            .then((data) => {
                this.chatrooms = data.chatrooms;
                this.first_chatroom_number = 0;
            });
    };

    attached() {
        this.theme.hide_menu = true;
        this.theme.hide_title = true;
        this.read_chatrooms();
        this.subscriber = this.ea.subscribe('DELETE_CHATROOM',(data)  => {
            this.remove_chatroom(data.room_number)
        });
    }

    detached() {
        this.subscriber.dispose();
    }

    remove_chatroom(room_number) {
        let idx = this.chatrooms.findIndex(cr => cr.room_number == room_number);
        this.chatrooms.splice(idx, 1);
    }

    add_chatroom() {
        if (this.new_chatroom_name) {
            this.api.call_server('chats/add_chatroom', { new_chatroom_name: this.new_chatroom_name })
                .then( (data) => {
                    let chatroom = { id: data.chatroom_id, messages: [], info: { user_message: '' } };
                    this.chatrooms.push(chatroom);
                    this.first_chatroom_number = this.chatrooms.length - this.chats_per_page;
                    if (this.first_chatroom_number < 0) {
                        this.first_chatroom_number = 0;
                    }
                });
            this.new_chatroom_name = '';
            this.new_chatroom_name_visible = false;
        }
        else {
            this.new_chatroom_name_visible = true;
        }
    }

    cancel_add_chatroom() {
        this.new_chatroom_name = '';
        this.new_chatroom_name_visible = false;
    }

    @computedFrom('first_chatroom_number')
    get can_move_left() {
        return (this.first_chatroom_number > 0)
    }

    move_left() {
        if (this.can_move_left) {
            this.first_chatroom_number -= 1;
        }
    };

    @computedFrom('first_chatroom_number', 'chatrooms.length')
    get can_move_right() {
        return (this.first_chatroom_number < this.chatrooms.length - this.chats_per_page)
    }

    move_right() {
        if (this.can_move_right) {
            this.first_chatroom_number += 1;
        }
    };

    @computedFrom('theme.width')
    get chats_per_page() {
        return Math.round((this.theme.width-100) / 350);
    }

}
