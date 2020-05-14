import { autoinject, computedFrom } from "aurelia-framework";
import { I18N } from "aurelia-i18n";
import { Router } from "aurelia-router";
import { Theme } from '../services/theme';
import { DialogController } from 'aurelia-dialog';
import { MemberGateway } from '../services/gateway';
import { User } from '../services/user';

@autoinject
export class MergeHelpMessages {
    left_text = "<p>bla bla bla</p>";
    right_text = "<p>boom boom boom</p>";
    theme: Theme;
    api: MemberGateway;
    user: User;
    filter = "";
    i18n: I18N;
    message_list = [];
    empty = false;
    curr_story_id = 0;
    init = false;

    constructor(theme: Theme, i18n: I18N, api: MemberGateway, user: User) {
        this.theme = theme;
        this.i18n = i18n;
        this.api = api;
        this.user = user;
    }

    activate() {
        this.api.call_server('help/get_overridden_help_messages')
            .then(response => {
                this.message_list = response.message_list;
                console.log("message list: ", this.message_list);
                this.empty = this.message_list.length == 0;
            })
    }

    attached() {
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
    }

    detached() {
        this.theme.hide_title = false;
        this.theme.hide_menu = false;
    }

    select_message(message) {
        console.log(message);
        let story_id = message.id;
        this.curr_story_id = story_id;
        this.api.call_server('help/get_help_message', {story_id: story_id})
        .then(response => {
            this.left_text = response.prev_story_info.story_text;
            this.right_text = response.story_info.story_text;
            this.init = true;
        })
    }

    saved() {
        console.log("SAVED IT ", this.right_text);
    }

}
