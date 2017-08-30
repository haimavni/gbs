import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Cache } from "../services/cache";
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
    cache;
    router;
    dialog;
    win_width;
    win_height;
    used_languages;
    params = {
        selected_topics: [],
        grouped_selected_topics: [],
        selected_days_since_upload: 0,
        selected_uploader: "",
        from_date: "",
        to_date: "",
        selected_languages: [],
        selected_stories: [],
        selected_story_types: []
    };
    help_data = {
        num_words: 65056
    }
    topic_list = [];
    authors_list = [];
    days_since_upload_options;
    i18n;
    num_of_stories = 0;
    story_types;

    constructor(api: MemberGateway, user: User, dialog: DialogService, i18n: I18N, router: Router, cache: Cache) {
        this.api = api;
        this.user = user;
        this.cache = cache;
        this.dialog = dialog;
        this.i18n = i18n;
        this.router = router;
        this.story_types = [
            //{name: i18n.tr('stories.all-types'), id: 0},
            { name: i18n.tr('stories.life-stories'), id: 1 },
            { name: i18n.tr('stories.events'), id: 2 },
            { name: i18n.tr('stories.photos'), id: 3 },
            { name: i18n.tr('stories.terms'), id: 4 }
        ]
    }

    created(params, config) {
        this.api.call_server('members/get_topic_list', {})
            .then(result => {
                this.topic_list = result.topic_list;
            });
        this.update_story_list(true);
        this.api.call_server('members/get_used_languages')
            .then(response => {
                this.used_languages = response.used_languages;
                for (let lang of this.used_languages) {
                    lang.name = this.i18n.tr(lang.name);
                    lang.name += ' (' + lang.count + ")"
                }
            });
        let cached_index = this.cache.getValue('StoriesIndex');
        if (cached_index) {
            this.stories_index = cached_index;
            this.help_data.num_words = this.stories_index.length;
        } else {
            this.api.call_server('members/get_stories_index')
                .then(response => {
                    this.stories_index = response.stories_index;
                    this.help_data.num_words = this.stories_index.length;
                    this.cache.setValue('StoriesIndex', this.stories_index);
                });
        }
            
        /*  this.api.call_server('members/get_story_previews')
                      .then(response => this.story_previews = response.story_previews);*/
    }

    attached() {
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
    }

    detached() {
        this.cache.setValue('StoryList', this.story_list);
    }

    update_story_list(tryCache?: boolean) {
        if (tryCache) {
            let lst = this.cache.getValue('StoryList')
            if (lst) {
                this.story_list = lst;
                return;
            }
        }
        let used_for = null;
        if (this.api.constants) {
            used_for = this.api.constants.story_type.STORY4EVENT;
        } else {
            used_for = 2;
        }
        return this.api.call_server_post('members/get_story_list', { params: this.params, used_for: used_for })
            .then(result => {
                this.story_list = result.story_list;
                for (let story of this.story_list) {
                    story.title = '<span dir="rtl">' + story.title + '</span>';
                }
            });
    }

    jump_to_the_full_story(story) {
        switch (story.used_for) {
            case this.api.constants.story_type.STORY4EVENT:
                this.router.navigateToRoute('story-detail', { id: story.story_id, what: 'story' });
                break;
            case this.api.constants.story_type.STORY4MEMBER:
                this.router.navigateToRoute('member-details', { id: story.story_id, what: 'story' });
                break;
            case this.api.constants.story_type.STORY4PHOTO:
                this.router.navigateToRoute('photo-detail', { id: story.story_id, what: 'story' });
                break;
            case this.api.constants.story_type.STORY4TERM:
                this.router.navigateToRoute('term-detail', { id: story.story_id, what: 'story' });
                break;
        }

    }

    handle_languages_change(event) {
        this.params.selected_languages = event.detail.ungrouped_selected_options;
        this.update_story_list();
    }

    handle_words_change(event) {
        let result = null;
        event.detail.grouped_selected_options.forEach(element => {
            let uni = new Set<number>();
            for (let x of element) {
                uni = set_union(uni, new Set(x.story_ids));
            }
            if (result) {
                result = set_intersection(result, uni);
            } else {
                result = uni;
            }
        });
        event.detail.ungrouped_selected_options.forEach(element => {
            if (result) {
                result = set_intersection(result, new Set(element.story_ids));
            } else {
                result = new Set(element.story_ids)
            }
        });
        if (result) {
            let story_list = Array.from(result);
            this.num_of_stories = story_list.length;
            if (story_list.length == 0) return;
            this.params.selected_stories = story_list;
            this.update_story_list();
        }
    }

    handle_topic_change(event) {
        this.params.selected_topics = event.detail.ungrouped_selected_options;
        this.params.grouped_selected_topics = event.detail.grouped_selected_options;
        this.update_story_list();
    }

    handle_story_types_change(event) {
        this.params.selected_story_types = event.detail.ungrouped_selected_options;
        //modify visible categories according to selected story types
        this.update_story_list();
    }


}