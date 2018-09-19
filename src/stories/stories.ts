import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { WordIndex } from "../services/word_index";
import { autoinject, computedFrom, singleton } from 'aurelia-framework';
import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';
import { set_intersection, set_union, set_diff } from '../services/set_utils';
import { EventAggregator } from 'aurelia-event-aggregator';
import { MultiSelectSettings } from '../resources/elements/multi-select/multi-select';

@autoinject
@singleton()
export class Stories {
    filter = "";
    story_list = [];
    stories_index;
    story_previews;
    api;
    user;
    theme;
    word_index;
    router;
    dialog;
    win_width;
    win_height;
    used_languages;
    keywords = [];
    search_words = [];
    scroll_area;
    scroll_top = 0;
    params = {
        keywords_str: "",
        selected_topics: [],
        selected_words: [],
        selected_uploader: "",
        from_date: "",
        to_date: "",
        selected_languages: [],
        selected_stories: [],
        selected_story_types: [],
        checked_story_list: [],
        link_class: "basic",
        deleted_stories: false,
        days_since_update: 0,
        search_type: 'simple',
        approval_state: 0
    };
    help_data = {
        num_words: 65056
    }
    topic_list = [];
    authors_list = [];
    checked_stories = new Set();
    days_since_update_options;
    approval_state_options;
    i18n;
    num_of_stories = 0;
    story_types;
    done_selecting = false;
    no_results = false;
    options_settings = new MultiSelectSettings({
        clear_filter_after_select: false,
        can_set_sign: true
    });
    words_settings = new MultiSelectSettings({
        clear_filter_after_select: false,
        name_editable: false,
        can_add: false,
        can_delete: false,
        can_group: true,
        show_only_if_filter: true
    });
    ea: EventAggregator;
    active_result_types;
    used_for = null;
    has_grouped_topics: false;
    clear_selected_topics_now = false;

    constructor(api: MemberGateway, user: User, dialog: DialogService, i18n: I18N, router: Router,
        word_index: WordIndex, theme: Theme, ea: EventAggregator) {
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.word_index = word_index;
        this.dialog = dialog;
        this.i18n = i18n;
        this.router = router;
        this.ea = ea;
        this.days_since_update_options = [
            { value: 0, name: this.i18n.tr('stories.uploaded-any-time') },
            { value: 1, name: this.i18n.tr('stories.uploaded-today') },
            { value: 7, name: this.i18n.tr('stories.uploaded-this-week') },
            { value: 30, name: this.i18n.tr('stories.uploaded-this-month') },
            { value: 91, name: this.i18n.tr('stories.uploaded-this-quarter') },
            { value: 365, name: this.i18n.tr('stories.uploaded-this-year') }
        ];

        this.story_types = [
            //{name: i18n.tr('stories.all-types'), id: 0},
            { name: i18n.tr('stories.life-stories'), id: 1 },
            { name: i18n.tr('stories.events'), id: 2 },
            { name: i18n.tr('stories.photos'), id: 3 },
            { name: i18n.tr('stories.terms'), id: 4 }
        ]

        this.approval_state_options = [
            { name: i18n.tr('stories.approved-and-unapproved'), id: 1 },
            { name: i18n.tr('stories.unapproved'), id: 2 },
            { name: i18n.tr('stories.approved'), id: 3 }
        ]

        this.ea.subscribe("GO-SEARCH", payload => { this.simple_search(payload.keywords, true) });
        this.ea.subscribe('STORY_WAS_SAVED', payload => { this.refresh_story(payload) });
    }

    refresh_story(data) {
        let story_id = data.story_data.story_id;
        let idx = this.story_list.findIndex(itm => itm.story_id == story_id);
        if (idx >= 0) {
            this.story_list[idx].story_preview = data.story_data.story_preview;
        }
    }

    activate(params, config) {
        if (this.router.isExplicitNavigationBack) return;
        if (this.story_list.length > 0 && ! params.keywords) return;
        if (params.keywords == this.params.keywords_str) return;
        this.init_params();
        this.params.keywords_str = params.keywords;
        this.search_words = params.keywords ? params.keywords.split(/\s+/) : [];
        this.keywords = this.search_words;
        this.simple_search(this.params.keywords_str, false);
    }

    created(params, config) {
        if (this.story_list && this.story_list.length > 0 && !this.router.isExplicitNavigation) return;
        this.api.call_server('topics/get_topic_list', {})
            .then(result => {
                this.topic_list = result.topic_list;
            });
        this.api.call_server('members/get_used_languages')
            .then(response => {
                this.used_languages = response.used_languages;
                for (let lang of this.used_languages) {
                    lang.name = this.i18n.tr(lang.name);
                    lang.name += ' (' + lang.count + ")"
                }
            });
        this.word_index.get_word_index()
            .then(response => {
                this.stories_index = response;
                this.params.selected_words = [];
                let g = 0;
                for (let wrd of this.search_words) {
                    let iw = this.stories_index.find(w => w.name == wrd);
                    if (iw) {
                        g += 1;
                        iw.sign = 'plus'
                        let item = { group_number: g, first: true, last: true, option: iw };
                        this.params.selected_words.push(item);
                    } else { //no such word in the vocabulary.
                        let idx = this.search_words.findIndex(itm => itm == wrd);
                        this.search_words = this.search_words.splice(idx, 1);
                        this.keywords = this.search_words;
                    }
                }
            });
    }

    keywords_to_selected_words() {
        this.params.selected_words = [];
        let g = 0;
        for (let wrd of this.search_words) {
            let iw = this.stories_index.find(w => w.name == wrd);
            if (iw) {
                g += 1;
                iw.sign = 'plus';
                let item = { group_number: g, first: true, last: true, option: iw };
                this.params.selected_words.push(item);
            } else {
                let idx = this.search_words.findIndex(itm => itm == wrd);
                this.search_words = this.search_words.splice(idx, 1);
                this.keywords = this.search_words;
            }
        }
    }

    simple_search(keywords, local) {
        this.search_words = keywords ? keywords.split(/\s+/) : [];
        this.keywords = this.search_words;
        this.params.selected_words = [];
        this.params.selected_stories = [];
        this.params.keywords_str = keywords;
        if (local) {
            this.keywords_to_selected_words();
        }
        this.update_story_list('simple');
    }

    attached() {
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
        this.theme.display_header_background = true;
        this.theme.page_title = "stories.place-stories";
        this.scroll_area.scrollTop = this.scroll_top;
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
    }

    update_story_list(search_type?) {
        if (search_type) this.params.search_type = search_type;
        this.no_results = false;
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
                this.no_results = this.story_list.length == 0;
                for (let story of this.story_list) {
                    story.title = '<span dir="rtl">' + story.title + '</span>';
                }
                this.active_result_types = result.active_result_types;
                this.used_for = result.active_result_types[0];
                console.timeEnd('update-story-list');
                this.scroll_top = 0;
            });
    }

    jump_to_the_full_story(event, story) {
        this.scroll_top = this.scroll_area.scrollTop;
        let is_link = event.target.classList.contains('is-link');
        if (is_link) return true;
        let what;
        let kws = this.params.keywords_str ? [this.params.keywords_str] : null;
        let keywords = story.exact ? kws : this.keywords;
        switch (story.used_for) {
            case this.api.constants.story_type.STORY4EVENT:
                what = 'EVENT';
                this.router.navigateToRoute('story-detail', { id: story.story_id, what: 'story', keywords: keywords, search_type: this.params.search_type });
                break;
            case this.api.constants.story_type.STORY4MEMBER:
                what = 'MEMBER';
                this.router.navigateToRoute('member-details', { id: story.story_id, what: 'story', keywords: keywords, search_type: this.params.search_type });
                break;
            case this.api.constants.story_type.STORY4PHOTO:
                what = 'PHOTO';
                this.router.navigateToRoute('photo-detail', { id: story.story_id, what: 'story' });
                break;
            case this.api.constants.story_type.STORY4TERM:
                what = "TERM";
                this.router.navigateToRoute('term-detail', { id: story.story_id, what: 'term', keywords: keywords, search_type: this.params.search_type });
                break;
        }
    }

    handle_words_change(event) {
        let result = null;
        if (!event.detail) {
            return;
        }
        this.params.keywords_str = "";
        this.params.selected_words = event.detail.selected_options;
        let uni = new Set<number>();
        let group_sign;
        for (let sign of ['plus', 'minus']) {
            this.params.selected_words.forEach(element => {
                if (element.first) {
                    group_sign = element.option.sign
                    uni = new Set<number>();
                }
                if (group_sign == sign) {
                    uni = set_union(uni, new Set(element.option.story_ids));
                    if (element.last) {
                        if (result) {
                            if (sign == 'plus') {
                                result = set_intersection(result, uni);
                            } else {
                                result = set_diff(result, uni)
                            }
                        } else {
                            result = uni;
                        }
                    }
                }
            });
        };
        if (result && result.size > 0) {
            let story_list = Array.from(result);
            this.num_of_stories = story_list.length;
            if (story_list.length == 0) return;
            this.params.selected_stories = story_list;
            this.update_story_list('advanced');
        } else if (result) {
            this.num_of_stories = 0;
            this.no_results = true;
            this.story_list = Array.from(result);
        } else {
            this.params.selected_stories = [];
            this.update_story_list('advanced');
            this.num_of_stories = 0;
        }
        this.keywords = this.params.selected_words.map(item => item.option.name);
    }

    handle_topic_change(event) {
        this.params.selected_topics = event.detail.selected_options;
        this.update_story_list();
    }

    handle_approval_state_change(event) {
        this.update_story_list();
    }

    update_topic_list() {
        this.api.call_server_post('topics/get_topic_list', { params: this.params })
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
    }

    toggle_link_class() {
        //todo: "primary" displays only stories with links to the old givat-brenner site. This button is temporary and should be removed after porting is finished.
        this.params.link_class = (this.params.link_class == "basic") ? "primary" : "basic";
        this.update_story_list();
    }

    handle_age_change() {
        this.update_story_list();
    }

    delete_checked_stories() {
        this.api.call_server_post('members/delete_checked_stories', { params: this.params })
            .then(response => {
                this.params.checked_story_list = [];
                this.checked_stories = new Set();
                this.story_list = [];
            });
    }

    promote_stories() {
        this.api.call_server_post('members/promote_stories', { params: this.params })
            .then(response => {
                this.params.checked_story_list = [];
                this.checked_stories = new Set();
            });
    }

    toggle_deleted_stories() {
        this.params.deleted_stories = !this.params.deleted_stories;
        this.update_story_list();
    }

    @computedFrom('user.editing', 'done_selecting', 'has_grouped_topics', 'params.selected_topics')
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
                if (this.has_grouped_topics) {
                    result = "can-modify-tags";
                } else {
                    result = "ready-to-edit"
                }
            }
        }
        this.options_settings.update({
            mergeable: result != "applying-to-stories" && result != "selecting-stories",
            name_editable: result == "ready-to-edit",
            can_set_sign: result != "can-modify-tags",
            can_add: result == "ready-to-edit",
            can_delete: result == "ready-to-edit"
        });
        this.words_settings.update({
            mergeable: result != "applying-to-stories" && result != "selecting-stories",
            can_set_sign: result == "not-editing",
        });
        return result;
    }

    select_used_for(used_for) {
        this.used_for = used_for;
        this.scroll_area.scrollTop = this.scroll_top = 0;
    }

    save_merges(event: Event) {
        //todo: if event.ctrl create a super group rather than merge?
        this.api.call_server_post('topics/save_tag_merges', this.params)
            .then(response => {
                this.has_grouped_topics = false;
                this.clear_selected_topics_now = true;
                this.update_topic_list();
            });
    }

    consolidate_stories() {
        this.api.call_server_post('members/consolidate_stories', { stories_to_merge: this.params.checked_story_list })
            .then(() => {
                this.checked_stories = new Set();
                this.update_story_list();
            });
    }

    init_params() {
        this.params = {
            keywords_str: "",
            selected_topics: [],
            selected_words: [],
            selected_uploader: "",
            from_date: "",
            to_date: "",
            selected_languages: [],
            selected_stories: [],
            selected_story_types: [],
            checked_story_list: [],
            link_class: "basic",
            deleted_stories: false,
            days_since_update: 0,
            search_type: 'simple',
            approval_state: 0
        };

    }

    remove_topic(event) {
        let topic_id = event.detail.option.id;
        this.api.call_server_post('topics/remove_topic', {topic_id: topic_id})
            .then(() => this.update_topic_list());
    }

}
