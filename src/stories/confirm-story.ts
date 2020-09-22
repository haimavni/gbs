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
    init = false;
    dirty = false;
    unapproved;

    constructor(theme: Theme, i18n: I18N, api: MemberGateway, user: User) {
        this.theme = theme;
        this.i18n = i18n;
        this.api = api;
        this.user = user;
    }

    activate(params) {
        console.log("confirm story activate")
        this.story_id = params.id;
        this.api.call_server('members/get_story_versions', { story_id: this.story_id })
            .then(response => {
                this.unapproved = response.unapproved;
                if (this.unapproved) {
                    this.left_text = response.prev_story_info ? response.prev_story_info.story_text : this.i18n.tr('stories.initial_version');
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
    }

    approved() {
        let data = { user_id: this.user.id };
        let story = { story_id: this.story_id, story_text: this.right_text }
        data['story_info'] = story;
        this.api.call_server_post('members/approve_story_info', data)
    }
}
