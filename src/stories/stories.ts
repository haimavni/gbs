import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { autoinject } from 'aurelia-framework';
//import { StoryDetail } from './story-detail';
import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';

@autoinject
export class Stories {
    filter = "";
    story_list = [];
    api;
    user;
    dialog;
    win_width;
    win_height;
    params = {
        selected_topics: [],
        selected_days_since_upload: 0,
        selected_uploader: "",
        from_date: "",
        to_date: "",
    };
    topic_list = [];
    authors_list = [];
    days_since_upload_options;
    i18n;
    selected_stories = new Set([]);

    constructor(api: MemberGateway, user: User, dialog: DialogService, i18n: I18N) {
        this.api = api;
        this.user = user;
        this.dialog = dialog;
        this.i18n = i18n;
    }

    created(params, config) {
        this.api.call_server('members/get_story_list', {})
            .then(result => {
                this.topic_list = result.topic_list;
                console.log("topic list ", this.topic_list)
            });
        this.update_story_list();
    }

    attached() {
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
    }

    update_story_list() {
        return this.api.call_server_post('members/get_story_list', {keywords: this.filter, params: this.params})
            .then(result => {
                this.story_list = result.story_list;
                this.filter = result.used_keywords;
                for (let story of this.story_list) {
                    story.title = '<span dir="rtl">' + story.title + '</span>';
                }
                if (this.story_list) {
                    console.log(this.story_list.length + " storys");
                } else {
                    console.log("no storys found");
                }
            });
    }

    jump_to_the_full_story(story) {
        console.log("jump_to_the_full_story of ", story);
    }

}