import { autoinject, computedFrom, singleton } from "aurelia-framework";
import { I18N } from "aurelia-i18n";
import { Theme } from '../services/theme';
import { MemberGateway } from '../services/gateway';
import { User } from '../services/user';

@autoinject
export class ConfirmStory {
    left_text = "";
    right_text = "";
    theme: Theme;
    api: MemberGateway;
    user: User;
    filter = "";
    i18n: I18N;
    story_id = 0;
    story_name;
    story_list = [];
    init = false;
    dirty = false;
    unapproved;
    author;
    updater;
    last_update_date;

    constructor(theme: Theme, i18n: I18N, api: MemberGateway, user: User) {
        this.theme = theme;
        this.i18n = i18n;
        this.api = api;
        this.user = user;
    }

    activate(params) {
        this.story_id = params.id;
        this.story_list = params.story_list || [];
        this.get_story_versions();
    }

    get_story_versions() {
        this.api.call_server('members/get_story_versions', { story_id: this.story_id })
            .then(response => {
                this.story_name = response.story_info.name;
                this.unapproved = response.unapproved;
                this.author = response.author;
                this.updater = response.updater;
                this.last_update_date = response.last_update_date;
                if (this.unapproved) {
                    this.left_text = response.prev_story_info ? response.prev_story_info.story_text : this.i18n.tr('stories.initial-version');
                    this.right_text = response.story_info.story_text;
                }
                this.init = true;
            })
    }


    saved() {
        let data = { user_id: this.user.id };
        let story = { story_id: this.story_id, story_text: this.right_text }
        data['story_info'] = story;
        this.api.call_server_post('members/save_story_info', data)
            .then(response => {
                this.next_story();
            })
    }

    approved() {
        let data = { user_id: this.user.id };
        let story = { story_id: this.story_id, story_text: this.right_text }
        data['story_info'] = story;
        this.api.call_server_post('members/approve_story_info', data)
            .then(response => {
                this.next_story();
            })
    }

    skip() {
        this.next_story();
    }

    next_story() {
        let idx = this.story_list.findIndex(itm => itm == this.story_id);
        console.log("idx: ", idx, "story id: ", this.story_id, " this.story_list ", this.story_list);
        if (idx < 0) idx = 0;
        if (idx < this.story_list.length - 1) {
            this.story_id = this.story_list[idx + 1]
            this.story_list.splice(idx, 1);
            this.get_story_versions();
        }
    }

}
