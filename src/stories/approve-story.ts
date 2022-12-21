import { I18N } from '@aurelia/i18n';
import { ITheme } from '../services/theme';
import { IMemberGateway } from '../services/gateway';
import { IUser } from '../services/user';

export class ConfirmStory {
    left_text = '';
    right_text = '';
    filter = '';
    story_id = 0;
    story_name;
    story_list = [];
    init = false;
    dirty = false;
    unapproved;
    author;
    updater;
    last_update_date;

    constructor(
        @ITheme readonly theme: ITheme,
        @I18N readonly i18n: I18N,
        @IMemberGateway readonly api: IMemberGateway,
        @IUser readonly user: IUser
    ) {

    }

    loading(params) {
        this.story_id = params.id;
        this.story_list = params.story_list || [];
        this.get_story_versions();
    }

    get_story_versions() {
        this.api
            .call_server('members/get_story_versions', {
                story_id: this.story_id,
            })
            .then((response) => {
                this.story_name = response.story_info.name;
                this.unapproved = response.unapproved;
                this.author = response.author;
                this.updater = response.updater;
                this.last_update_date = response.last_update_date;
                if (this.unapproved) {
                    this.left_text = response.prev_story_info
                        ? response.prev_story_info.story_text
                        : this.i18n.tr('stories.initial-version');
                    this.right_text = response.story_info.story_text;
                }
                this.init = true;
            });
    }

    saved() {
        const data = { user_id: this.user.id };
        const story = { story_id: this.story_id, story_text: this.right_text };
        data['story_info'] = story;
        this.api
            .call_server_post('members/save_story_info', data)
            .then((response) => {
                this.next_story();
            });
    }

    approved() {
        const data = { user_id: this.user.id };
        const story = { story_id: this.story_id, story_text: this.right_text };
        data['story_info'] = story;
        this.api
            .call_server_post('members/approve_story_info', data)
            .then((response) => {
                this.next_story();
            });
    }

    skip() {
        this.next_story();
    }

    next_story() {
        let idx = this.story_list.findIndex((itm) => itm == this.story_id);
        if (idx < 0) idx = 0;
        if (idx < this.story_list.length - 1) {
            this.story_id = this.story_list[idx + 1];
            this.story_list.splice(idx, 1);
            this.get_story_versions();
        }
    }
}
