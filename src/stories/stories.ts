import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { autoinject } from 'aurelia-framework';
//import { StoryDetail } from './story-detail';
import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';

@autoinject
export class Stories {
    filter = "";
    story_list = [];
    stories_index;
    story_previews;
    api;
    user;
    router;
    dialog;
    win_width;
    win_height;
    used_languages;
    params = {
        selected_topics: [],
        selected_days_since_upload: 0,
        selected_uploader: "",
        from_date: "",
        to_date: "",
        selected_languages: []
    };
    topic_list = [];
    authors_list = [];
    days_since_upload_options;
    i18n;
    selected_stories = new Set([]);

    constructor(api: MemberGateway, user: User, dialog: DialogService, i18n: I18N, router: Router) {
        this.api = api;
        this.user = user;
        this.dialog = dialog;
        this.i18n = i18n;
        this.router = router;

    }

    created(params, config) {
        this.api.call_server('members/get_topic_list', {})
            .then(result => {
                this.topic_list = result.topic_list;
                console.log("topic list ", this.topic_list)
            });
        this.update_story_list();
        this.api.call_server('members/get_used_languages')
            .then(response => {
                this.used_languages = response.used_languages;
                for (let lang of this.used_languages) {
                    lang.name = this.i18n.tr(lang.name);
                    lang.name += ' (' + lang.count + ")"
                }
            });
        this.api.call_server('members/get_stories_index')
            .then(response => this.stories_index = response.stories_index);
        this.api.call_server('members/get_story_previews')
            .then(response => this.story_previews = response.story_previews);
    }

    attached() {
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
    }

    update_story_list() {
        let used_for = null;
        if (this.api.constants) {
            used_for = this.api.constants.STORY4EVENT;
        } else {
            used_for = 2;
        }
        return this.api.call_server_post('members/get_story_list', {  params: this.params, used_for: used_for })
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
        this.router.navigateToRoute('story-detail', { id: story.story_id });
    }

    handle_languages_change(event) {
        console.log("selection is now ", event.detail);
        this.params.selected_languages = event.detail.selected_options;
        this.update_story_list();
    }


}