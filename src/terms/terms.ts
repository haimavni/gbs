import { IMemberGateway } from '../services/gateway';
import { IUser } from '../services/user';
import { ITheme } from '../services/theme';
import { I18N } from '@aurelia/i18n';
import { IRouter } from '@aurelia/router';
import { MultiSelectSettings } from '../resources/elements/multi-select/multi-select';

export class Terms {
    filter = '';
    term_list = [];
    scroll_area;
    scroll_top = 0;
    video_list = [];

    params = {
        selected_topics: [],
        selected_terms: [],
        checked_term_list: [],
    };

    topic_list = [];
    topic_groups = [];

    options_settings = new MultiSelectSettings({
        clear_filter_after_select: false,
        can_set_sign: true,
    });

    checked_terms = new Set();
    has_grouped_topics: false;
    clear_selected_topics_now = false;
    anchor = -1; //for multiple selections
    editing_filters = false;
    empty = false;
    highlight_unselectors = '';

    constructor(
        @IMemberGateway readonly api: IMemberGateway,
        @IUser readonly user: IUser,
        @I18N readonly i18n: I18N,
        @ITheme readonly theme: ITheme,
        @IRouter readonly router: IRouter
    ) {}

    loading(params) {
        this.update_term_list(false);
    }

    update_term_list(refresh) {
        if (this.term_list.length > 0 && !refresh) return;
        this.api
            .call_server_post('terms/get_term_list', {
                params: this.params,
                usage: this.user.editing ? null : 'T',
            })
            .then((result) => {
                this.term_list = result.term_list;
                this.empty = this.term_list.length == 0;
                this.highlight_unselectors = this.empty ? 'warning' : '';
                this.editing_filters = false;
                //this.scroll_top = 0;
            });
    }

    created() {
        this.update_topic_list();
    }

    attached() {
        this.theme.display_header_background = true;
        this.theme.page_title = 'terms.terms-lexicon';
        this.scroll_area.scrollTop = this.scroll_top;
        /*setTimeout(()=>{
            this.scroll_area.scrollTop = this.scroll_top;
        }, 1000)*/
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = '';
    }

    jump_to_the_full_story(event, term) {
        this.scroll_top = this.scroll_area.scrollTop;
        if (event.target.classList.contains('is-link')) return true;

        this.router.load(`/term-detail`, {
            parameters: {
                id: term.story_id,
                what: 'term',
            },
        });
    }

    get phase() {
        let result = 'not-editing';
        if (this.user.editing) {
            if (this.checked_terms.size > 0) {
                result = 'applying-to-terms';
            } else {
                result = this.topics_action();
            }
        }

        this.options_settings.update({
            mergeable:
                result != 'applying-to-terms' && result != 'selecting-terms',
            name_editable: result == 'ready-to-edit',
            can_set_sign: !this.has_grouped_topics,
            can_add: result == 'ready-to-edit',
            can_delete: result == 'ready-to-edit',
            hide_higher_options:
                this.checked_terms.size > 0 && this.user.editing,
            empty_list_message: this.i18n.tr('photos.no-topics-yet'),
            help_topic: 'topics-help',
        });

        return result;
    }

    topics_action() {
        let n_groups = 0;
        let has_group_candidate = false;

        for (const topic_item of this.params.selected_topics) {
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

    update_topic_list() {
        this.api
            .call_server_post('topics/get_topic_list', {
                params: this.params,
                usage: this.user.editing ? null : 'T',
            })
            .then((response) => {
                this.topic_list = response.topic_list;
                this.topic_groups = response.topic_groups;
            });
    }

    add_topic(event) {
        const new_topic_name = event.detail.new_name;
        this.api
            .call_server_post('topics/add_topic', {
                topic_name: new_topic_name,
            })
            .then(() => this.update_topic_list());
    }

    remove_topic(event) {
        const topic_id = event.detail.option.id;
        this.api
            .call_server_post('topics/remove_topic', { topic_id: topic_id })
            .then(() => this.update_topic_list());
    }

    topic_name_changed(event) {
        const t = event.detail.option;
        this.api.call_server_post('topics/rename_topic', t);
    }

    get user_editing() {
        if (this.user.editing_mode_changed) this.update_topic_list();
        return this.user.editing;
    }

    toggle_selection(term, event, index) {
        if (this.anchor < 0) this.anchor = index;
        event = event.detail;
        if (event.keys.altKey) {
            this.checked_terms = new Set();
            if (term.story.checked) this.checked_terms.add(term.story_id);
            for (const d of this.term_list) {
                if (d.story_id != term.story_id) d.story.checked = false;
            }
        } else if (event.keys.shiftKey) {
            const checked = term.story.checked;
            let i0, i1;
            if (this.anchor < index) {
                i0 = this.anchor;
                i1 = index;
            } else {
                i0 = index;
                i1 = this.anchor;
            }
            for (let i = i0; i < i1; i++) {
                const d = this.term_list[i];
                if (d) {
                    d.story.checked = checked;
                    if (checked) {
                        this.checked_terms.add(d.story_id);
                    } else {
                        this.checked_terms.delete(d.story_id);
                    }
                } else {
                    console.log('no itm. i is: ', i);
                }
            }
        } else if (term.story.checked) {
            this.checked_terms.add(term.story_id);
        } else {
            this.checked_terms.delete(term.story_id);
        }
        this.params.checked_term_list = Array.from(this.checked_terms);
    }

    apply_topics_to_checked_terms() {
        this.api
            .call_server_post('terms/apply_to_checked_terms', {
                params: this.params,
            })
            .then((response) => {
                this.clear_selected_topics_now = true;
                this.uncheck_checked_terms();
                if (response.new_topic_was_added) {
                    this.update_topic_list();
                }
            });
    }

    uncheck_checked_terms() {
        this.params.selected_terms = [];
        this.checked_terms = new Set();
        for (const term of this.term_list) {
            term.checked = false;
        }
        this.params.checked_term_list = [];
    }

    handle_topic_change(event) {
        this.params.selected_topics = event.detail.selected_options;
        this.update_term_list(true);
    }

    delete_checked_terms() {
        this.api
            .call_server_post('terms/delete_checked_terms', {
                params: this.params,
            })
            .then((response) => {
                this.params.checked_term_list = [];
                this.checked_terms = new Set();
                this.update_term_list(true);
            });
    }

    save_topic_group(event: Event) {
        //todo: if event.ctrl create a super group rather than merge?
        this.api
            .call_server_post('topics/add_topic_group', this.params)
            .then((response) => {
                this.has_grouped_topics = false;
                this.clear_selected_topics_now = true;
                this.update_topic_list();
            });
    }

    show_filters_only() {
        this.editing_filters = true;
    }
}
