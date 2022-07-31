import { MyDate } from './../services/my-date';
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
import { Popup } from '../services/popups';
import { Misc } from '../services/misc';
import { DocPage } from '../docs/doc-page';
import { debounce } from '../services/debounce';
import { PickerSettings } from '../resources/elements/picker/picker';

@autoinject
@singleton()
export class Stories {
    filter = "";
    story_list = [];
    stories_index;
    api;
    user;
    theme;
    popup: Popup;
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
        editing: false,
        selected_topics: [],
        selected_book: null,
        show_untagged: false,
        selected_words: [],
        selected_uploader: "",
        selected_story_visibility: 0,
        from_date: "",
        to_date: "",
        stories_date_str: "",
        stories_date_span_size: 1,
        selected_stories: [],  //stories that match currently selected words
        checked_story_list: [], //stores that were checked by the user. needs to be calculated from the set this.checked_stories before calling the server
        link_class: "basic",
        deleted_stories: false,
        days_since_update: 0,
        search_type: 'simple',
        approval_state: 0,
        order_option: { value: "" },
        first_year: 1928,
        last_year: 2021,
        base_year: 1925,
        num_years: 100,
        start_name: ""
    };
    prev_keywords;
    help_data = {
        num_words: 65056
    }
    topic_list = [];
    no_topics_yet = false;
    topic_groups = [];
    authors_list = [];
    checked_stories = new Set();
    days_since_update_options;
    approval_state_options;
    order_options;
    i18n;
    num_of_stories = 0;
    no_results = false;
    highlight_unselectors = "";
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
        show_only_if_filter: true,
        start_open: true
    });
    ea: EventAggregator;
    active_result_types;
    used_for = null;
    has_grouped_topics: false;
    clear_selected_topics_now = false;
    ready_for_new_story_list = true;
    result_type_counters = {};
    anchor = -1; //for multiple selections
    story_items = [];
    editing_filters = false;
    visibility_width = "100%";
    update_story_list_debounced;
    delete_or_undelete_now_title;
    start_name_history = [];
    misc;
    book_list = [];
    pickerSettings: PickerSettings = new PickerSettings({can_add: true});
    stories_date_valid = '';

    constructor(api: MemberGateway, user: User, dialog: DialogService, i18n: I18N, router: Router,
        word_index: WordIndex, theme: Theme, ea: EventAggregator, popup: Popup, misc: Misc) {
        this.api = api;
        this.user = user;
        this.misc = misc;
        this.theme = theme;
        this.word_index = word_index;
        this.dialog = dialog;
        this.i18n = i18n;
        this.router = router;
        this.ea = ea;
        this.popup = popup;
        this.delete_or_undelete_now_title = this.i18n.tr('stories.delete');
        this.days_since_update_options = [
            { value: 0, name: this.i18n.tr('stories.uploaded-any-time') },
            { value: 1, name: this.i18n.tr('stories.uploaded-today') },
            { value: 7, name: this.i18n.tr('stories.uploaded-this-week') },
            { value: 30, name: this.i18n.tr('stories.uploaded-this-month') },
            { value: 91, name: this.i18n.tr('stories.uploaded-this-quarter') },
            { value: 365, name: this.i18n.tr('stories.uploaded-this-year') }
        ];

        this.approval_state_options = [
            { name: i18n.tr('stories.approved-and-unapproved'), id: 1 },
            { name: i18n.tr('stories.unapproved'), id: 2 },
            { name: i18n.tr('stories.approved'), id: 3 }
        ];

        this.order_options = [
            { name: i18n.tr('stories.random-order'), value: 'normal' },
            { name: i18n.tr('stories.new-to-old'), value: 'new-to-old' },
            { name: i18n.tr('stories.old-to-new'), value: 'old-to-new' },
            { name: i18n.tr('stories.by-chats'), value: 'by-chats' },
            { name: i18n.tr('stories.by-update'), value: 'by-update' }
        ];

        this.ea.subscribe("GO-SEARCH", payload => { this.simple_search(payload.keywords, true) });
        this.ea.subscribe('STORY_WAS_SAVED', payload => { this.refresh_story(payload) });
        this.ea.subscribe('NEW_STORY_ADDED', payload => { this.add_story(payload) });
        //this.ea.subscribe('STORY-LIST-CHUNK', payload => { this.handle_chunk(payload) });
        this.update_story_list_debounced = debounce(this.update_story_list, 1700, false);
        this.pickerSettings.place_holder_text = 'stories.enter-book-name';
        this.pickerSettings.can_delete = this.user.editing;
        this.pickerSettings.help_topic = "search-book-list";

    }

    refresh_story(data) {
        let story_id = data.story_data.story_id;
        let story = this.story_list.find(itm => itm.story_id == story_id);
        if (story) {
            story.preview = data.story_data.preview;
            story.name = data.story_data.name;
        }
    }

    add_story(data) {
        this.story_list.splice(0, 0, data.story_data)
        this.story_list = this.story_list.slice(); //force refresh
        this.used_for = 2;
        console.log("add story data: ", data);
        this.router.navigateToRoute('story-detail', { id: data.story_data.story_id, what: 'story', keywords: [], search_type: this.params.search_type, story_list: this.story_list });
    }

    activate(params, config) {
        this.params.selected_story_visibility = 0;
        if (this.router.isExplicitNavigationBack) return;
        if (this.story_list && this.story_list.length > 0 && !params.keywords) return;
        if (params.keywords == this.params.keywords_str && this.story_list && this.story_list.length > 0) return;
        if (params.keywords && params.keywords == this.prev_keywords) return;
        this.prev_keywords = params.keywords;
        this.init_params();
        this.params.keywords_str = params.keywords || '';
        this.search_words = params.keywords ? params.keywords.split(/\s+/) : [];
        this.keywords = this.search_words;
        this.simple_search(this.params.keywords_str, false);
    }

    created(params, config) {
        if (this.story_list && this.story_list.length > 0 && !this.router.isExplicitNavigation) return;
        this.api.call_server('topics/get_topic_list', {})
            .then(result => {
                this.topic_list = result.topic_list;
                this.topic_groups = result.topic_groups;
                this.no_topics_yet = this.topic_list.length == 0;
            });
        this.api.call_server('members/get_used_languages')
            .then(response => {
                this.used_languages = response.used_languages;
                for (let lang of this.used_languages) {
                    lang.name = this.i18n.tr(lang.name.toLowerCase());
                    lang.name += ' (' + lang.count + ")"
                }
            });
        this.word_index.get_word_index()
            .then(response => {
                this.stories_index = this.word_index.word_index;
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
        this.api.call_server('members/get_book_list')
            .then(response => { this.book_list = response.book_list });
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
        let typ = 'simple'
        if (local) {
            this.keywords_to_selected_words();
        } else {
            typ = 'menu';
        }
        this.update_story_list(typ);
    }

    attached() {
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
        this.theme.display_header_background = true;
        this.theme.page_title = "stories.place-stories";
        this.scroll_area.scrollTop = this.scroll_top;
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

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
    }

    async update_story_list(search_type, from_words_change = false) {
        if (!from_words_change) {
            this.update_params_from_selected_words()
            if (this.no_results) return;
        }
        if (search_type != 'simple' && search_type != 'menu') {
            this.params.keywords_str = "";
        }
        this.params.checked_story_list = Array.from(this.checked_stories);
        let cnt = 0;
        while (!this.api.ptp_connected) {
            await sleep(100);
            cnt += 1;
            if (cnt > 50) {
                break;
            }
        }
        if (search_type) this.params.search_type = search_type;
        this.no_results = false;
        let used_for = null;
        if (this.api.constants) {
            used_for = this.api.constants.story_type.STORY4EVENT;
        } else {
            used_for = 2;
        }
        console.time('update-story-list');
        this.params.editing = this.user.editing;
        if (this.params.selected_book && this.user.editing) {
            this.clear_all_filters();
        }
        let promise = this.api.call_server_post('members/get_story_list', { params: this.params, used_for: used_for })
        this.params.start_name = "";
        promise
            .then(response => {
                //this.params.by_last_chat_time = false;
                //this.params.order_option = this.order_options[0];
                this.editing_filters = false;
                //this.params.selected_book = null;
                //this.story_list = result.story_list;
                this.no_results = response.no_results;
                this.highlight_unselectors = this.no_results ? "warning" : "";
                if (this.no_results) {
                    this.story_list = [];
                }
                this.story_list = response.result;
                for (let story of this.story_list) {
                    story.title = '<span dir="${theme.rtltr}">' + story.title + '</span>';
                }
                this.active_result_types = response.active_result_types;
                if (!this.used_for)
                    this.used_for = response.active_result_types[0];
                this.scroll_top = 0;
                if (!this.active_result_types.find(art => art == this.used_for))
                    this.used_for = this.active_result_types[0];
                this.result_type_counters = response.result_type_counters;
                //this.set_active_type();
                if (this.params.order_option.value == 'by-name') {
                    let next_name = this.find_next_name();
                    this.start_name_history = this.misc.update_history(this.start_name_history, next_name, 6);
                }
                if (this.params.selected_book && this.user.editing) {
                    let book_stories = this.story_list;
                    let story_ids = book_stories.map(story => story.story_id);
                    this.checked_stories = new Set(story_ids);
                    for (let story of book_stories) {
                        story.checked = true;
                    }
                }
                console.timeEnd('update-story-list');
                //this.scroll_top = 0;
            });
    }
    thumbnail(video_src) {
        return `https://i.ytimg.com/vi/${video_src}/mq2.jpg`
    }

    set_active_type() {
        let used_for = 0;
        let name = ""
        for (let art of this.active_result_types) {
            let story = this.story_list.find(st => st.used_for == art)
            if (!name || story.name < name) {
                used_for = art;
                name = story.name;
            }
        }
        this.used_for = used_for;
    }

    find_next_name() {
        let next_name = "~";
        let curr_name = this.start_name_history[0];
        for (let art of this.active_result_types) {
            let arr = this.story_list.filter(story => story.used_for == art);
            let names = arr.map(story => story.name);
            let name = names[names.length - 1];
            if (next_name == "~" || name < next_name) {
                if (name && name != curr_name)
                    next_name = name;
            }
        }
        if (next_name == "~")
            next_name = this.i18n.tr('stories.end-of-stories');
        return next_name;
    }

    jump_to_the_full_story(event, story) {
        this.scroll_top = this.scroll_area.scrollTop;
        let is_link = event.target.classList.contains('is-link');
        if (is_link) return true;
        let kws = this.params.keywords_str ? [this.params.keywords_str] : [''];
        let keywords_str = this.params.keywords_str || "";
        let keywords = this.keywords.length > 0 ? this.keywords : story.exact ? kws : keywords_str.split(' ');
        switch (story.used_for) {
            case this.api.constants.story_type.STORY4EVENT:
                let story_list = this.story_list.filter(item => item.used_for == this.api.constants.story_type.STORY4EVENT);
                story_list = story_list.map(itm => itm.story_id);
                this.router.navigateToRoute('story-detail', { id: story.story_id, what: 'story', keywords: keywords, search_type: this.params.search_type, story_list: story_list });
                break;
            case this.api.constants.story_type.STORY4MESSAGE:
                let message_list = this.story_list.filter(item => item.used_for == this.api.constants.story_type.STORY4MESSAGE);
                message_list = message_list.map(itm => itm.story_id);
                this.router.navigateToRoute('story-detail', { id: story.story_id, what: 'message', keywords: keywords, search_type: this.params.search_type, story_list: message_list });
                break;
            case this.api.constants.story_type.STORY4MEMBER:
                this.router.navigateToRoute('member-details', { id: story.story_id, what: 'story', keywords: keywords, search_type: this.params.search_type });
                break;
            case this.api.constants.story_type.STORY4ARTICLE:
                this.router.navigateToRoute('article-details', { id: story.story_id, what: 'story', keywords: keywords, search_type: this.params.search_type });
                break;
            case this.api.constants.story_type.STORY4PHOTO:
                let photo_list = this.story_list.filter(itm => itm.used_for == 3);
                let photo_ids = photo_list.map(itm => itm.story_id);
                this.router.navigateToRoute('photo-detail', { id: story.story_id, what: 'story', keywords: keywords, search_type: this.params.search_type, photo_ids: photo_ids });
                break;
            case this.api.constants.story_type.STORY4TERM:
                this.router.navigateToRoute('term-detail', { id: story.story_id, what: 'term', keywords: keywords, search_type: this.params.search_type });
                break;
            case this.api.constants.story_type.STORY4HELP:
                this.router.navigateToRoute('help-detail', { id: story.story_id, what: 'help', keywords: keywords, search_type: this.params.search_type });
                break;
            case this.api.constants.story_type.STORY4DOC:
                this.openDialog(story.doc_url);
                break;
            case this.api.constants.story_type.STORY4VIDEO:
                this.router.navigateToRoute('annotate-video', { video_id: story.story_id, what: 'story', keywords: keywords, search_type: this.params.search_type });
                break;
        }
    }

    view_details(story, event) {
        let doc_ids = []; //this.doc_list.map(doc => doc.id);
        this.scroll_top = this.scroll_area.scrollTop;
        this.router.navigateToRoute('doc-detail', { id: story.story_id, doc_ids: doc_ids, keywords: this.keywords, caller: 'stories' });
    }


    private openDialog(doc_url) {
        this.dialog.open({ viewModel: DocPage, model: { doc_src: doc_url }, lock: false, keyboard: ['Enter', 'Escape'] })
            .whenClosed(response => {
                //this.theme.page_title = title;
            });
    }

    apply_topics_to_selected_stories() {
        this.params.checked_story_list = Array.from(this.checked_stories);
        this.api.call_server_post('members/apply_topics_to_selected_stories', { params: this.params, used_for: this.used_for })
            .then(response => {
                this.clear_selected_topics_now = true;
                this.uncheck_selected_stories();
                this.params.selected_book = null;
                this.params.selected_story_visibility = 0;
                if (response.new_topic_was_added) {
                    this.update_topic_list();
                }
            });
    }

    uncheck_selected_stories() {
        //this.params.selected_stories = [];
        this.checked_stories = new Set();
        for (let story of this.story_list) {
            story.checked = false;
        }
    }

    clear_all_filters() {
        let p = this.params;
        p.base_year = 0;
        p.selected_topics = [];
        p.days_since_update = 0;
        p.first_year = 0;
        p.last_year = 0;
        this.filter = '';
        p.order_option = {value: ''};
        p.selected_uploader = "";
        p.selected_words = [];
        p.to_date = '';
        p.from_date = '';
    }

    handle_words_change(event) {
        let result = null;
        if (!event.detail) {
            return;
        }
        this.params.keywords_str = "";
        this.params.selected_words = event.detail.selected_options;
        this.update_params_from_selected_words();
        if (!this.no_results) {
            this.update_story_list_debounced('advanced', true);
        }
    }

    update_params_from_selected_words() {
        this.no_results = false;
        let result = null;
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
        } else if (result) {
            this.num_of_stories = 0;
            this.no_results = true;
            this.story_list = Array.from(result);
        } else {
            this.params.selected_stories = [];
            this.num_of_stories = 0;
        }
        this.keywords = this.params.selected_words.map(item => item.option.name);
    }

    handle_topic_change(event) {
        this.params.selected_topics = event.detail.selected_options;
        this.params.show_untagged = event.detail.show_untagged;
        this.update_story_list_debounced('other');
    }

    handle_approval_state_change(event) {
        this.update_story_list('other');
    }

    update_topic_list() {
        this.params.checked_story_list = Array.from(this.checked_stories);
        this.api.call_server_post('topics/get_topic_list', { params: this.params })
            .then(response => {
                this.topic_list = response.topic_list;
                this.topic_groups = response.topic_groups;
            });
    }

    toggle_story_selection(story, event, index) {
        let checked = event.detail.checked;
        let keys = event.detail.keys;
        let ii = this.story_list.findIndex((itm) => itm.story_id == story.story_id);
        index = ii;
        if (this.anchor < 0) this.anchor = index;
        //todo: if keys.shiftKey toggle checked for the range
        if (checked) {
            this.checked_stories.add(story.story_id)
        } else {
            this.checked_stories.delete(story.story_id)
        }
        if (keys.altKey) {
            this.checked_stories = new Set();
            if (checked)
                this.checked_stories.add(story.story_id);
            for (let itm of this.story_list) {
                if (itm.story_id != story.story_id)
                    itm.checked = false;
            }
        } else if (keys.shiftKey) {
            let i0, i1;
            if (this.anchor < index) {
                i0 = this.anchor;
                i1 = index;
            } else {
                i0 = index;
                i1 = this.anchor;
            }
            for (let i = i0; i < i1; i++) {
                let itm = this.story_list[i];
                if (itm) {
                    if (itm.used_for != this.used_for) continue;
                    itm.checked = checked;
                    if (checked) {
                        this.checked_stories.add(itm.story_id)
                    } else {
                        this.checked_stories.delete(itm.story_id)
                    }
                } else {
                    console.log("no itm. i is: ", i);
                }
            }
        }
        this.anchor = index;
        return false;
    }

    handle_age_change() {
        this.update_story_list('other');
    }

    handle_start_name_change(event) {
        event.stopPropagation();
        this.start_name_history = this.misc.update_history(this.start_name_history, this.params.start_name)
        this.update_story_list('advanced');
    }

    handle_order_change() {
        this.params.start_name = "";
        this.start_name_history = [];
        this.update_story_list('advanced');
    }

    delete_checked_stories() {
        this.params.checked_story_list = Array.from(this.checked_stories);
        this.api.call_server_post('members/delete_checked_stories', { params: this.params })
            .then(response => {
                //this.params.checked_story_list = [];
                this.story_list = this.story_list.filter(story => !this.checked_stories.has(story.story_id));
                this.checked_stories = new Set();
            });
    }

    delete_checked_stories_forever() {
        if (!confirm(this.i18n.tr("stories.delete-forever-warning"))) return;
        this.params.checked_story_list = Array.from(this.checked_stories);
        this.api.call_server_post('members/burry_stories', { params: this.params })
            .then(response => {
                //this.params.checked_story_list = [];
                this.story_list = this.story_list.filter(story => !this.checked_stories.has(story.story_id));
                this.checked_stories = new Set();
            });
    }

    promote_stories() {
        this.params.checked_story_list = Array.from(this.checked_stories);
        this.api.call_server_post('members/promote_stories', { params: this.params })
            .then(response => {
                this.checked_stories = new Set();
            });
    }

    toggle_deleted_stories() {
        this.params.deleted_stories = !this.params.deleted_stories;
        let t = this.params.deleted_stories ? 'stories.undelete-now' : 'stories.delete';
        this.delete_or_undelete_now_title = this.i18n.tr(t);
        this.params.checked_story_list = [];
        this.params.selected_stories = [];
        this.update_story_list('other');
    }

    @computedFrom('user.editing', 'has_grouped_topics', 'params.selected_topics', 'checked_stories.size')
    get phase() {
        let result = "not-editing";
        if (this.user.editing) {
            if (this.checked_stories.size > 0) {
                result = "selecting-stories";
            } else {
                result = this.topics_action();
            }
        }
        this.options_settings.update({
            mergeable: result != "applying-to-stories" && result != "selecting-stories",
            name_editable: result == "ready-to-edit",
            can_set_sign: this.user.editing && this.checked_stories.size > 0 && !this.has_grouped_topics,
            can_add: result == "ready-to-edit",
            can_delete: result == "ready-to-edit",
            hide_higher_options: this.checked_stories.size > 0 && this.user.editing,
            empty_list_message: this.i18n.tr('photos.no-topics-yet'),
            help_topic: 'topics-help',
            show_untagged: this.user.editing
        });
        this.words_settings.update({
            mergeable: result != "applying-to-stories" && result != "selecting-stories",
            can_set_sign: result == "not-editing",
            empty_list_message: this.i18n.tr('photos.no-words-yet')
        });
        this.pickerSettings.can_delete = result == "ready-to-edit";
        return result;
    }

    topics_action() {
        let n_groups = 0;
        let has_group_candidate = false;
        for (let topic_item of this.params.selected_topics) {
            if (topic_item.first && topic_item.last) {
                if (topic_item.option.topic_kind == 2) return 'ready-to-edit';
                has_group_candidate = true;
            }
            if (topic_item.last && !topic_item.first) {
                n_groups += 1;
            }
        }
        if (has_group_candidate && n_groups == 1) return 'can-create-group';
        if (n_groups == 1) return 'can-merge-topics';
        return 'ready-to-edit';
    }

    select_used_for(used_for) {
        this.used_for = used_for;
        this.scroll_area.scrollTop = this.scroll_top = 0;
    }

    goto_photos_page() {
        let photo_list = this.story_list.filter(itm => itm.used_for == 3);
        let photo_ids = photo_list.map(itm => itm.photo_id);
        this.router.navigateToRoute('photos', { photo_ids: photo_ids });
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

    save_topic_group(event: Event) {
        this.api.call_server_post('topics/add_topic_group', this.params)
            .then(response => {
                this.has_grouped_topics = false;
                this.clear_selected_topics_now = true;
                this.update_topic_list();
            });
    }

    consolidate_stories() {
        this.params.checked_story_list = Array.from(this.checked_stories);
        this.api.call_server_post('members/consolidate_stories', { stories_to_merge: this.params.checked_story_list })
            .then(() => {
                this.checked_stories = new Set();
                this.update_story_list('other');
            });
    }

    initial_params() {
        return {
            keywords_str: "",
            editing: false,
            selected_topics: [],
            show_untagged: false,
            selected_book: null,
            selected_words: [],
            selected_uploader: "",
            selected_story_visibility: 0,
            from_date: "",
            to_date: "",
            stories_date_str: "",
            stories_date_span_size: 1,
            selected_stories: [],
            checked_story_list: [],
            link_class: "basic",
            deleted_stories: false,
            days_since_update: 0,
            search_type: 'simple',
            approval_state: 0,
            order_option: { value: "" },
            first_year: 1928,
            last_year: 2021,
            base_year: 1925,
            num_years: 100,
            start_name: ""
        };
    }

    init_params(update=false) {
        this.params = this.initial_params();
        if (update) {
            this.update_story_list('other')
        }
    }

    add_topic(event) {
        let new_topic_name = event.detail.new_name;
        this.api.call_server_post('topics/add_topic', { topic_name: new_topic_name })
            .then(() => this.update_topic_list());
    }

    remove_topic(event) {
        let topic_id = event.detail.option.id;
        this.api.call_server_post('topics/remove_topic', { topic_id: topic_id })
            .then(() => this.update_topic_list());
    }

    topic_name_changed(event) {
        let t = event.detail.option;
        this.api.call_server_post('topics/rename_topic', t);
    }

    approve_story(story, event) {
        let story_list = this.story_list.filter(story => story.used_for == story.used_for)
        story_list = this.story_list.map(story => story.story_id);
        story_list = story_list.slice(0, 100);
        this.router.navigateToRoute('approve-story', { id: story.story_id, what: 'story', story_list: story_list });
    }

    show_filters_only() {
        this.editing_filters = true;
    }

    @computedFrom('user.editing', 'checked_stories.size')
    get can_set_dates() {
        return this.user.editing && this.checked_stories.size > 0
    }

    @computedFrom('params.stories_date_str')
    get date_is_valid() {
        let date = new MyDate(this.params.stories_date_str);
        return date.is_valid()
    }

    time_range_changed(event) {
        this.params.first_year = event.detail.first_year;
        this.params.last_year = event.detail.last_year;
        this.params.base_year = event.detail.base_year;
        this.update_story_list('other');
    }

    @computedFrom('theme.height')
    get panel_height() {
        return this.theme.height - 350;
    }

    create_new_book(customEvent) {
        let event = customEvent.detail;
        this.api.call_server('topics/create_new_book', {book_name: event.new_name})
        .then(result => {
            let book = {name: event.new_name, description: "", id: result.book_id};
            this.book_list.push(book)
        })
    }

    book_selected(customEvent) {
        let event = customEvent.detail;
        if (this.params.selected_book && this.params.selected_book.id == event.option.id)
            return;
        if (this.params.selected_book)
            this.uncheck_selected_stories();
        this.params.selected_book = event.option;
        this.update_story_list('other');
        if (this.user.editing) {
            //add all stories to the checked stories and make apply-button visible
            // this.checked_stories = 
            //     this.api.call_server_post('topics/collect_stories', {book_id: event.option.id})
        }
    }

    unselect_book(customEvent) {
        this.params.selected_book = null;
        this.uncheck_selected_stories();
        this.update_story_list('other');
    }

    modify_book_info(customEvent) {
        let event = customEvent.detail;
        this.api.call_server_post('topics/modify_book_info', {book: event.option})
    }

    remove_book(customEvent) {
        let event = customEvent.detail;
        this.api.call_server_post('topics/remove_book', {book: event.option})
    }

    scroll(h) {
        let div = document.getElementById('story-filters');
        div.scrollTop = h;
    }

    @computedFrom('stories_date_valid')
    get incomplete() {
        if (this.stories_date_valid != 'valid')
            return "disabled"
        return ''
    }

    @computedFrom('params.keywords_str', 'params.selected_topics', 'params.show_untagged', 'params.selected_words', 'params.selected_uploader',
        'params.selected_story_visibility', 'params.from_date', 'params.to_date', 'params.selected_stories', 'params.days_since_update')
    get is_filtered() {
        if (this.params.keywords_str != '' || 
            this.params.selected_topics.length > 0 ||
            this.params.show_untagged ||
            this.params.selected_words.length > 0 ||
            this.params.selected_uploader != '' ||
            this.params.selected_story_visibility != 0 ||
            this.params.from_date != '' ||
            this.params.to_date != '' ||
            this.params.selected_stories.length ||
            this.params.days_since_update > 0) {
                return true;
            }
        return false;
    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
