import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { autoinject } from 'aurelia-framework';
//import { StoryDetail } from './story-detail';
import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';
import { set_intersection, set_union, set_diff } from '../services/set_utils';

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
        selected_languages: [],
        selected_stories: []
    };
    topic_list = [];
    authors_list = [];
    days_since_upload_options;
    i18n;
    num_of_stories = 0;

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
        /*  this.api.call_server('members/get_story_previews')
              .then(response => this.story_previews = response.story_previews);*/
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
        return this.api.call_server_post('members/get_story_list', { params: this.params, used_for: used_for })
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
        this.params.selected_languages = event.detail.ungrouped_selected_options;
        this.update_story_list();
    }

    handle_words_change(event) {
        console.log("selecting words ", event.detail);
        let result = null;
        event.detail.grouped_selected_options.forEach(element => {
            let uni = new Set<number>();
            for (let x of element) {
                uni = set_union(uni, new Set(x.story_ids));
                console.log("x is: ", x);
            }
            if (result) {
                result = set_intersection(result, uni);
            } else {
                result = uni;
            }
        });
        console.log("result after grouped is: ", result);
        event.detail.ungrouped_selected_options.forEach(element => {
            console.log("ungrouped elment: ", element);
            for (let x of element) {
                if (result) {
                    result = set_intersection(result, new Set(x.story_ids));
                } else {
                    result = new Set(x.story_ids)
                }
            }
        });
        console.log("result after ungrouped is: ", result);
        if (result) {
            let story_list = Array.from(result);
            this.num_of_stories = story_list.length;
            if (story_list.length == 0) return;
            this.params.selected_stories = story_list;
            console.log("story list: ", story_list);
            this.update_story_list();
        }
    }

    handle_topic_change(event) {
        console.log("handle topic change ", event.detail);
    }


}