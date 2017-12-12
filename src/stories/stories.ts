import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { Cache } from "../services/cache";
import { autoinject, computedFrom } from 'aurelia-framework';
//import { StoryDetail } from './story-detail';
import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';
import { set_intersection, set_union, set_diff } from '../services/set_utils';
import { EventAggregator } from 'aurelia-event-aggregator';
import default_multi_select_options from '../resources/elements/multi-select';

@autoinject
export class Stories {
    filter = "";
    story_list = [];
    stories_index;
    story_previews;
    api;
    user;
    theme;
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
        selected_story_types: [],
        checked_story_list: [],
        link_class: "basic",
        deleted_stories: false,
        days_since_update: 0
    };
    help_data = {
        num_words: 65056
    }
    topic_list = [];
    authors_list = [];
    checked_stories = new Set();
    days_since_update_options;
    i18n;
    num_of_stories = 0;
    story_types;
    done_selecting = false;
    options_settings = default_multi_select_options;
    story_types_settings = default_multi_select_options;
    words_settings = default_multi_select_options;
    ea: EventAggregator;

    constructor(api: MemberGateway, user: User, dialog: DialogService, i18n: I18N, router: Router, cache: Cache, theme: Theme, ea: EventAggregator) {
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.cache = cache;
        this.dialog = dialog;
        this.i18n = i18n;
        this.router = router;
        this.ea = ea;
        this.days_since_update_options = [
            { value: 0, name: this.i18n.tr('photos.uploaded-any-time') },
            { value: 1, name: this.i18n.tr('photos.uploaded-today') },
            { value: 7, name: this.i18n.tr('photos.uploaded-this-week') },
            { value: 30, name: this.i18n.tr('photos.uploaded-this-month') },
            { value: 91, name: this.i18n.tr('photos.uploaded-this-quarter') },
            { value: 365, name: this.i18n.tr('photos.uploaded-this-year') }
        ];

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
            console.time('get_words_index');
            this.api.call_server('members/get_stories_index')
                .then(response => {
                    this.stories_index = response.stories_index;
                    this.help_data.num_words = this.stories_index.length;
                    this.cache.setValue('StoriesIndex', this.stories_index);
                    console.timeEnd('get_words_index');
                });
        }
        this.ea.subscribe('WORD_INDEX_CHANGED', (response) => {
            console.log("word index changed: ", response);
        })
    }

    attached() {
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
        this.theme.display_header_background = true;
    }

    detached() {
        this.cache.setValue('StoryList', this.story_list);
        this.theme.display_header_background = false;
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
        console.time('update-story-list');
        return this.api.call_server_post('members/get_story_list', { params: this.params, used_for: used_for })
            .then(result => {
                this.story_list = result.story_list;
                for (let story of this.story_list) {
                    story.title = '<span dir="rtl">' + story.title + '</span>';
                }
                console.timeEnd('update-story-list');
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
        } else {
            this.num_of_stories = 0;
        }
        this.update_story_list();
    }

    handle_topic_change(event) {
        this.params.selected_topics = event.detail.ungrouped_selected_options;
        this.params.grouped_selected_topics = event.detail.grouped_selected_options;
        this.update_story_list();
    }

    handle_story_types_change(event) {
        this.params.selected_story_types = event.detail.ungrouped_selected_options;
        this.update_topic_list();
        //modify visible categories according to selected story types
        this.update_story_list();
    }

    update_topic_list() {
        this.api.call_server_post('members/get_topic_list', { params: this.params })
            .then(response => {
                this.topic_list = response.topic_list;
            });
    }

    toggle_story_selection(story, event) {
        let checked = event.detail.checked;
        if (checked) {
            this.checked_stories.add(story.story_id)
        } else {
            this.checked_stories.delete(story.story_id)
        }
        this.params.checked_story_list = Array.from(this.checked_stories);
        console.log("checked stories: ", this.checked_stories, " checked list: ", this.params.checked_story_list);
    }

    toggle_link_class() {
        //todo: "primary" displays only stories with links to the old givat-brenner site. This button is temporary and should be removed after porting is finished.
        this.params.link_class = (this.params.link_class == "basic") ? "primary" : "basic";
        this.update_story_list();
    }

    handle_age_change() {

    }

    delete_checked_stories() {
        this.api.call_server_post('members/delete_checked_stories', { params: this.params })
            .then(response => {
                this.params.checked_story_list = [];
                this.checked_stories = new Set();
                this.update_story_list();
            });
    }

    toggle_deleted_stories() {
        this.params.deleted_stories = !this.params.deleted_stories;
        this.update_story_list();
    }

    @computedFrom('user.editing', 'done_selecting', 'params.grouped_selected_topics', 'params.selected_topics')
    get phase() {
        let result = "not-editing";
        if (this.user.editing) {
            if (this.checked_stories.size > 0) {
                if (this.done_selecting) {
                    result = "applying-to-stories"
                } else {
                    result = "selecting-stories";
                }
            } else {
                this.done_selecting = false;
                if (this.params.grouped_selected_topics.length > 0) {
                    result = "can-modify-tags";
                } else {
                    result = "ready-to-edit"
                }
            }
        }
        this.options_settings = {
            clear_filter_after_select: false,
            mergeable: result != "applying-to-stories" && result != "selecting-stories",
            name_editable: result == "ready-to-edit",
            can_set_sign: result == "ready-to-edit",
            can_add: result == "ready-to-edit",
            can_delete: result == "ready-to-edit"
        };
        this.words_settings = {
            clear_filter_after_select: false,
            mergeable: result != "applying-to-stories" && result != "selecting-stories",
            name_editable: false,
            can_set_sign: result == "not-editing",
            can_add: false,
            can_delete: false
        };
        return result;
    }

    save_merges(event: Event) {
        //todo: if event.ctrl create a super group rather than merge?
        console.log("before save merges, grouped: ", this.params.grouped_selected_topics);
        this.api.call_server_post('members/save_tag_merges', this.params)
    }




}