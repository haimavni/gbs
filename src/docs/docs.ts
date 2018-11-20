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
import { UploadDocs } from './upload-docs';

@autoinject
@singleton()
export class Docs {
    filter = "";
    doc_list = [];
    docs_index;
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
        selected_docs: [],
        checked_doc_list: [],
        link_class: "basic",
        deleted_docs: false,
        days_since_update: 0,
        search_type: 'simple',
        approval_state: 0
    };
    prev_keywords;
    help_data = {
        num_words: 65056
    }
    topic_list = [];
    topic_groups = [];
    authors_list = [];
    checked_docs = new Set();
    days_since_update_options;
    approval_state_options;
    i18n;
    num_of_docs = 0;
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
    }

    refresh_story(data) {
        let story_id = data.story_data.story_id;
        let idx = this.doc_list.findIndex(itm => itm.story_id == story_id);
        if (idx >= 0) {
            this.doc_list[idx].story_preview = data.story_data.story_preview;
        }
    }

    activate(params, config) {
        if (this.router.isExplicitNavigationBack) return;
        if (this.doc_list && this.doc_list.length > 0 && !params.keywords) return;
        if (params.keywords == this.params.keywords_str && this.doc_list && this.doc_list.length > 0) return;
        if (params.keywords && params.keywords == this.prev_keywords) return;
        this.prev_keywords = params.keywords;
        this.init_params();
        this.params.keywords_str = params.keywords;
        this.search_words = params.keywords ? params.keywords.split(/\s+/) : [];
        this.keywords = this.search_words;
    }

    created(params, config) {
        this.ea.subscribe('DOCS_WERE_UPLOADED', () => { this.update_doc_list() });
        if (this.doc_list && this.doc_list.length > 0 && !this.router.isExplicitNavigation) return;
        this.api.call_server('topics/get_topic_list', {})
            .then(result => {
                this.topic_list = result.topic_list;
                this.topic_groups = result.topic_groups;
                console.log("topic groups: ", this.topic_groups);
            });
        this.word_index.get_word_index()
            .then(response => {
                this.docs_index = response;
                this.params.selected_words = [];
                let g = 0;
                for (let wrd of this.search_words) {
                    let iw = this.docs_index.find(w => w.name == wrd);
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

    attached() {
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
        this.theme.display_header_background = true;
        this.theme.page_title = "docs.docs";
        this.scroll_area.scrollTop = this.scroll_top;
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
    }

    upload_files() {
        this.theme.hide_title = true;
        this.dialog.open({ viewModel: UploadDocs, lock: false })
            .whenClosed(result => { this.theme.hide_title = false });
    }

    async update_doc_list() {
        console.log("update doc. this.api.ptp_connected: ", this.api.ptp_connected);
        let cnt = 0;
        while (!this.api.ptp_connected) {
            console.log("this.api.ptp_connected: ", this.api.ptp_connected);
            await sleep(100);
            cnt += 1;
            if (cnt > 50) {
                break;
            }
            console.log("cnt: ", cnt, " this.api.ptp_connected: ", this.api.ptp_connected)
        }
        this.no_results = false;
        console.time('update-doc-list');
        return this.api.call_server_post('members/get_doc_list', { params: this.params })
            .then(result => {
                //this.doc_list = result.doc_list;
                this.no_results = result.no_results;
                if (this.no_results) {
                    this.doc_list = [];
                }
                for (let doc of this.doc_list) {
                    doc.title = '<span dir="rtl">' + doc.title + '</span>';
                }
                this.scroll_top = 0;
            });
    }

    apply_topics_to_selected_docs() {
        this.api.call_server_post('members/apply_topics_to_selected_docs', { params: this.params})
            .then(() => {
                this.clear_selected_topics_now = true;
                this.uncheck_selected_docs();
            });
    }

    uncheck_selected_docs() {
        this.params.selected_docs = [];
        this.checked_docs = new Set();
        for (let doc of this.doc_list) {
            doc.checked = false;
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
                    uni = set_union(uni, new Set(element.option.doc_ids));
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
            let doc_list = Array.from(result);
            this.num_of_docs = doc_list.length;
            if (doc_list.length == 0) return;
            this.params.selected_docs = doc_list;
            this.update_doc_list();
        } else if (result) {
            this.num_of_docs = 0;
            this.no_results = true;
            this.doc_list = Array.from(result);
        } else {
            this.params.selected_docs = [];
            this.update_doc_list();
            this.num_of_docs = 0;
        }
        this.keywords = this.params.selected_words.map(item => item.option.name);
    }

    handle_topic_change(event) {
        this.params.selected_topics = event.detail.selected_options;
        this.update_doc_list();
    }

    handle_approval_state_change(event) {
        this.update_doc_list();
    }

    update_topic_list() {
        this.api.call_server_post('topics/get_topic_list', { params: this.params })
            .then(response => {
                this.topic_list = response.topic_list;
            });
    }

    toggle_doc_selection(doc, event) {
        let checked = event.detail.checked;
        if (checked) {
            this.checked_docs.add(doc.story_id)
        } else {
            this.checked_docs.delete(doc.story_id)
        }
        this.params.checked_doc_list = Array.from(this.checked_docs);
    }

    handle_age_change() {
        this.update_doc_list();
    }

    delete_checked_docs() {
        this.api.call_server_post('members/delete_checked_docs', { params: this.params })
            .then(response => {
                this.params.checked_doc_list = [];
                this.checked_docs = new Set();
                this.doc_list = [];
            });
    }

    toggle_deleted_docs() {
        this.params.deleted_docs = !this.params.deleted_docs;
        this.update_doc_list();
    }

    @computedFrom('user.editing', 'done_selecting', 'has_grouped_topics', 'params.selected_topics')
    get phase() {
        let result = "not-editing";
        if (this.user.editing) {
            if (this.checked_docs.size > 0) {
                if (this.done_selecting) {
                    result = "applying-to-docs"
                } else {
                    result = "selecting-docs";
                }
            } else {
                this.done_selecting = false;
                result = this.topics_action();
                /*if (this.has_grouped_topics) {
                    result = "can-modify-tags";
                } else {
                    result = "ready-to-edit"
                }*/
            }
        }
        this.options_settings.update({
            mergeable: result != "applying-to-docs" && result != "selecting-docs",
            name_editable: result == "ready-to-edit",
            can_set_sign: !this.has_grouped_topics,
            can_add: result == "ready-to-edit",
            can_delete: result == "ready-to-edit"
        });
        this.words_settings.update({
            mergeable: result != "applying-to-docs" && result != "selecting-docs",
            can_set_sign: result == "not-editing",
        });
        return result;
    }

    topics_action() {
        let n_groups = 0;
        let has_group_candidate = false;
        for (let topic_item of this.params.selected_topics) {
            if (topic_item.first && topic_item.last) {
                if (topic_item.option.usage) return 'ready-to-edit';
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

    save_topic_group(event: Event) {
        //todo: if event.ctrl create a super group rather than merge?
        this.api.call_server_post('topics/add_topic_group', this.params)
            .then(response => {
                this.has_grouped_topics = false;
                this.clear_selected_topics_now = true;
                this.update_topic_list();
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
            selected_docs: [],
            checked_doc_list: [],
            link_class: "basic",
            deleted_docs: false,
            days_since_update: 0,
            search_type: 'simple',
            approval_state: 0
        };

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

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
