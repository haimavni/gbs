import { IMemberGateway } from '../services/gateway';
import { IUser } from '../services/user';
import { ITheme } from '../services/theme';
import { IEventAggregator } from 'aurelia';
import { IDialogService } from '@aurelia/dialog';
import { I18N } from '@aurelia/i18n';
import { IRouter, IRouteableComponent } from '@aurelia/router';
import { set_intersection, set_union, set_diff } from '../services/set_utils';
import { UploadAudios } from './upload-audios';
import { MultiSelectSettings } from '../resources/elements/multi-select/multi-select';
import { format_date } from '../services/my-date';
import { IWordIndex } from '../services/word_index';

export class Audios implements IRouteableComponent {
    filter = '';
    audio_list = [];
    win_width;
    win_height;
    scroll_area;
    scroll_top = 0;
    audios_index;
    search_words = [];
    keywords = [];
    working = false;
    first_index = 0;
    audios_per_page = 9;
    recorder_list = [];
    topic_list = [];
    topic_groups = [];
    checked_audios = new Set();
    has_grouped_recorders = false;
    has_grouped_topics = false;
    num_of_audios = 0;
    params = {
        keywords_str: '',
        editing: false,
        selected_topics: [],
        selected_words: [],
        selected_uploader: '',
        selected_recorders: [],
        from_date: '',
        to_date: '',
        selected_audios: [],
        //selected_days_since_upload: 0,
        //selected_dates_option: "dated-or-not",
        //audios_date_datestr: "",
        //audios_date_span_size: 3,
        checked_audio_list: [],
        link_class: 'basic',
        deleted_audios: false,
        days_since_upload: 0,
        search_type: 'simple',
        user_id: null,
    };
    prev_keywords;
    options_settings = new MultiSelectSettings({
        clear_filter_after_select: false,
        can_group: true,
    });
    recorders_settings = new MultiSelectSettings({
        clear_filter_after_select: true,
        can_set_sign: false,
        can_group: false,
    });
    length_keeper = {
        len: 0,
    };
    words_settings = new MultiSelectSettings({
        clear_filter_after_select: false,
        name_editable: false,
        can_add: false,
        can_delete: false,
        can_group: true,
        show_only_if_filter: true,
    });
    clear_selected_phototgraphers_now = false;
    clear_selected_topics_now = false;
    anchor = -1; //for multiple selections
    no_results = false;
    highlight_unselectors = '';
    editing_filters = false;
    days_since_upload_options;

    constructor(
        @IMemberGateway readonly api: IMemberGateway,
        @IUser private user: IUser,
        @I18N readonly i18n: I18N,
        @IWordIndex readonly word_index: IWordIndex,
        @ITheme readonly theme: ITheme,
        @IRouter readonly router: IRouter,
        @IDialogService readonly dialog: IDialogService,
        @IEventAggregator readonly ea: IEventAggregator
    ) {
        this.days_since_upload_options = [
            { value: 0, name: this.i18n.tr('audios.uploaded-any-time') },
            { value: 1, name: this.i18n.tr('audios.uploaded-today') },
            { value: 7, name: this.i18n.tr('audios.uploaded-this-week') },
            { value: 30, name: this.i18n.tr('audios.uploaded-this-month') },
            { value: 91, name: this.i18n.tr('audios.uploaded-this-quarter') },
            { value: 365, name: this.i18n.tr('audios.uploaded-this-year') },
        ];
    }

    set_audio_list(audio_list) {
        this.no_results = audio_list.length == 0;
        this.highlight_unselectors = this.no_results ? 'warning' : '';
        this.audio_list = audio_list; //.map(v => this.audio_data(v));
        this.length_keeper.len = this.audio_list.length;
        this.editing_filters = false;
    }

    update_audio_list() {
        this.params.editing = this.user.editing;
        this.api
            .call_server_post('audios/get_audio_list', { params: this.params })
            .then((response) => {
                if (!response) {
                    response = { error: 'Got no response' };
                }
                if (response.error) {
                    console.log('error occured: ', response.error);
                    return;
                }
                if (!response.audio_list) {
                    console.log('No audio list');
                    return;
                }
                this.set_audio_list(response.audio_list);
            });
    }

    attached() {
        this.theme.display_header_background = true;
        this.theme.page_title = 'audios.audios';
        this.win_height = window.outerHeight;
        this.win_width = window.outerWidth;
        this.theme.display_header_background = true;
        this.scroll_area.scrollTop = this.scroll_top;
    }

    async loading(params) {
        if (this.router.isRestrictedNavigation) {
            return;
        }

        if (this.audio_list && this.audio_list.length > 0 && !params.keywords) {
            return;
        }

        if (
            params.keywords == this.params.keywords_str &&
            this.audio_list &&
            this.audio_list.length > 0
        ) {
            return;
        }

        if (params.keywords && params.keywords == this.prev_keywords) {
            return;
        }

        this.prev_keywords = params.keywords;
        this.init_params();
        this.params.keywords_str = params.keywords;
        this.search_words = params.keywords ? params.keywords.split(/\s+/) : [];
        this.keywords = this.search_words;
        this.update_audio_list();

        await this.update_topic_list();

        this.update_recorder_list();

        this.word_index.get_word_index().then((response) => {
            this.audios_index = response;
            this.params.selected_words = [];
            let g = 0;
            for (const wrd of this.search_words) {
                const iw = this.audios_index.find((w) => w.name == wrd);
                if (iw) {
                    g += 1;
                    iw.sign = 'plus';
                    const item = {
                        group_number: g,
                        first: true,
                        last: true,
                        option: iw,
                    };
                    this.params.selected_words.push(item);
                } else {
                    //no such word in the vocabulary.
                    const idx = this.search_words.findIndex(
                        (itm) => itm == wrd
                    );
                    this.search_words = this.search_words.splice(idx, 1);
                    this.keywords = this.search_words;
                }
            }
        });
        this.ea.subscribe('RECORDER_ADDED', () => {
            this.update_topic_list();
        }); //for now they are linked...
        this.ea.subscribe('NEW-AUDIO', (msg: any) => {
            this.add_audio(msg.new_audio_rec);
        });
        this.ea.subscribe('AUDIO-INFO-CHANGED', (msg: any) => {
            this.refresh_audio(msg.changes);
        });
        this.ea.subscribe('TAGS_MERGED', () => {
            this.update_topic_list();
        });
        this.ea.subscribe('RECORDER_ADDED', () => {
            this.update_topic_list();
        }); //for now topics and photogaphers are handled together...
        this.ea.subscribe('AUDIO-TAGS-CHANGED', (response: any) => {
            this.apply_changes(response.changes);
        });
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = '';
    }

    update_topic_list() {
        const usage = this.user.editing ? {} : { usage: 'A' };
        this.api.call_server('topics/get_topic_list', usage).then((result) => {
            this.topic_list = result.topic_list;
            this.topic_groups = result.topic_groups;
        });
    }

    update_recorder_list() {
        this.api.call_server('audios/get_recorder_list').then((result) => {
            this.recorder_list = result.recorder_list;
        });
    }

    init_params() {
        this.params.keywords_str = '';
        this.params.selected_topics = [];
        this.params.selected_words = [];
        this.params.selected_uploader = '';
        this.params.from_date = '';
        this.params.to_date = '';
        this.params.selected_audios = [];
        this.params.checked_audio_list = [];
        this.params.link_class = 'basic';
        this.params.deleted_audios = false;
        this.params.days_since_upload = 0;
        this.params.search_type = 'simple';
    }

    apply_changes(changes) {
        for (const change of changes) {
            const audio = this.audio_list.find((v) => v.id == change.audio_id);
            if (change.recorder_name) {
                audio.recorder_name = change.recorder_name;
            }
            audio.keywords = change.keywords;
        }
    }

    new_audio() {
        this.theme.hide_title = true;
        this.dialog
            .open({
                component: () => UploadAudios,
                model: { params: {} },
                lock: true,
            })
            .whenClosed((response) => {
                this.theme.hide_title = false;
            });
    }

    add_audio(new_audio_rec) {
        this.audio_list.push(new_audio_rec);
        const n = this.audio_list.length;
        const r = n % this.audios_per_page;
        this.first_index = n - r;
    }

    refresh_audio(changes) {
        const audio = this.audio_list.find((vid) => vid.id == changes.id);
        for (const p of [
            'name',
            'keywords',
            'recorder_id',
            'audio_date_datestr',
            'audio_date_datespan',
        ]) {
            if (changes[p]) audio[p] = changes[p];
        }
    }

    page(step, event) {
        const idx = this.new_first_index(step);
        if (idx >= 0) {
            this.first_index = idx;
        }
        event.target.parentElement.blur();
    }

    new_first_index(step) {
        const idx = this.first_index + step * this.audios_per_page;
        if (idx >= 0 && idx < this.length_keeper.len) {
            return idx;
        }
        return -1;
    }

    _disabled(side) {
        if (this.length_keeper.len == 0) return true;
        if (this.first_index >= this.length_keeper.len) {
            this.first_index = 0;
        }
        const idx = this.new_first_index(side);
        return idx < 0;
    }

    get next_disabled() {
        return this._disabled(+1);
    }

    get prev_disabled() {
        return this._disabled(-1);
    }

    get user_editing() {
        if (this.user.editing_mode_changed) {
            this.update_topic_list();
            this.update_recorder_list();
        }
        return this.user.editing;
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

    toggle_selection(audio, event, index) {
        if (this.anchor < 0) this.anchor = index;
        if (event.altKey) {
            this.checked_audios = new Set();
            if (audio.selected) this.checked_audios.add(audio.story_id);
            for (const aid of this.audio_list) {
                if (aid.story_id != audio.story_id) aid.selected = false;
            }
        } else if (event.shiftKey) {
            this.toggle_audio_selection(audio);
            const checked = audio.selected;
            let i0, i1;
            if (this.anchor < index) {
                i0 = this.anchor;
                i1 = index;
            } else {
                i0 = index;
                i1 = this.anchor;
            }
            for (let i = i0; i < i1; i++) {
                const audio = this.audio_list[i];
                if (audio) {
                    audio.selected = checked;
                    if (checked) {
                        this.checked_audios.add(audio.story_id);
                    } else {
                        this.checked_audios.delete(audio.story_id);
                    }
                } else {
                    console.log('no itm. i is: ', i);
                }
            }
        } else if (audio.selected) {
            audio.selected = false;
            this.checked_audios.delete(audio.story_id);
        } else {
            audio.selected = true;
            this.checked_audios.add(audio.story_id);
        }
        this.params.checked_audio_list = Array.from(this.checked_audios);
    }

    toggle_audio_selection(audio) {
        if (this.checked_audios.has(audio.story_id)) {
            this.checked_audios.delete(audio.story_id);
            audio.selected = false;
        } else {
            this.checked_audios.add(audio.story_id);
            audio.selected = true;
        }
        this.params.checked_audio_list = Array.from(this.checked_audios);
    }

    delete_audio(audio) {
        this.api
            .call_server('audios/delete_audio', { audio_id: audio.id })
            .then(() => {
                const idx = this.audio_list.findIndex((v) => v.id == audio.id);
                this.audio_list.splice(idx, 1);
            });
    }

    edit_audio_info(audio) {
        this.theme.hide_title = true;
        this.dialog
            .open({
                component: () => UploadAudios,
                model: { params: audio },
                lock: true,
            })
            .whenClosed((response) => {
                this.theme.hide_title = false;
            });
    }

    get phase() {
        let result = 'not-editing';
        if (this.user.editing) {
            if (this.checked_audios.size > 0) {
                result = 'audios-were-selected';
            } else {
                result = this.topics_action();
            }
        }
        this.options_settings.update({
            mergeable: result != 'audios-were-selected',
            name_editable: result == 'audios-ready-to-edit',
            can_set_sign: true, //result == "audios-ready-to-edit",
            can_add: result == 'audios-ready-to-edit',
            can_delete: result == 'audios-ready-to-edit',
            empty_list_message: this.i18n.tr('photos.no-topics-yet'),
            hide_higher_options:
                this.checked_audios.size > 0 && this.user.editing,
            help_topic: 'topics-help',
        });
        this.words_settings.update({
            mergeable:
                result != 'applying-to-audios' && result != 'selecting-audios',
            can_set_sign: result == 'not-editing',
            empty_list_message: this.i18n.tr('photos.no-words-yet'),
        });
        this.recorders_settings.update({
            mergeable:
                result == 'can-modify-tags' || result == 'audios-ready-to-edit',
            name_editable: result == 'audios-ready-to-edit',
            can_add: result == 'audios-ready-to-edit',
            can_delete: result == 'audios-ready-to-edit',
            can_group: this.user.editing,
            empty_list_message: this.i18n.tr('audios.no-recorders-yet'),
            help_topic: 'recorders-help',
        });
        return result;
    }

    topics_action() {
        let n_groups = 0;
        let has_group_candidate = false;
        for (const topic_item of this.params.selected_topics) {
            if (topic_item.first && topic_item.last) {
                if (topic_item.option.topic_kind == 2)
                    return 'audios-ready-to-edit';
                has_group_candidate = true;
            }
            if (topic_item.last && !topic_item.first) {
                n_groups += 1;
            }
        }
        if (has_group_candidate && n_groups == 1) return 'can-create-group';
        if (n_groups == 1) return 'can-merge-topics';
        if (n_groups == 0 && this.has_grouped_recorders)
            return 'can-merge-topics';
        return 'audios-ready-to-edit';
    }

    save_merges(event: Event) {
        //todo: if event.ctrl create a super group rather than merge?
        this.api
            .call_server_post('topics/save_tag_merges', this.params)
            .then((response) => {
                this.has_grouped_topics = false;
                this.clear_selected_phototgraphers_now = true;
                this.clear_selected_topics_now = true;
            });
    }

    save_topic_group(event: Event) {
        this.api
            .call_server_post('topics/add_topic_group', this.params)
            .then((response) => {
                this.has_grouped_topics = false;
                this.clear_selected_topics_now = true;
                this.update_topic_list();
            });
    }

    apply_to_selected() {
        this.api
            .call_server_post('audios/apply_to_selected_audios', this.params)
            .then((response) => {
                this.clear_selected_audios();
                if (response.new_topic_was_added) {
                    this.update_topic_list();
                }
                this.clear_selected_topics_now = true;
            });
    }

    clear_selected_audios() {
        for (const audio of this.audio_list) {
            audio.selected = false;
        }
        this.checked_audios = new Set();
        this.params.checked_audio_list = [];
    }

    add_recorder(event) {
        const new_recorder_name = event.detail.new_name;
        this.api
            .call_server_post('audios/add_recorder', {
                recorder_name: new_recorder_name,
            })
            .then((result) => {
                this.update_recorder_list();
            });
    }

    remove_recorder(event) {
        const recorder = event.detail.option;
        this.api
            .call_server_post('topics/remove_recorder', { recorder: recorder })
            .then(() => {
                this.update_topic_list();
            });
    }

    handle_recorder_change(event) {
        this.params.selected_recorders = event.detail.selected_options;
        this.update_audio_list();
    }

    handle_words_change(event) {
        let result = null;
        if (!event.detail) {
            return;
        }
        this.params.keywords_str = '';
        this.params.selected_words = event.detail.selected_options;
        let uni = new Set<number>();
        let group_sign;
        for (const sign of ['plus', 'minus']) {
            this.params.selected_words.forEach((element) => {
                if (element.first) {
                    group_sign = element.option.sign;
                    uni = new Set<number>();
                }
                if (group_sign == sign) {
                    uni = set_union(uni, new Set(element.option.story_ids));
                    if (element.last) {
                        if (result) {
                            if (sign == 'plus') {
                                result = set_intersection(result, uni);
                            } else {
                                result = set_diff(result, uni);
                            }
                        } else {
                            result = uni;
                        }
                    }
                }
            });
        }
        if (result && result.size > 0) {
            const audio_list = Array.from(result);
            this.num_of_audios = audio_list.length;
            if (audio_list.length == 0) return;
            this.params.selected_audios = audio_list;
            this.update_audio_list();
        } else if (result) {
            this.num_of_audios = 0;
            this.no_results = true;
            this.audio_list = Array.from(result);
        } else {
            this.params.selected_audios = [];
            this.update_audio_list();
            this.num_of_audios = 0;
        }
        this.keywords = this.params.selected_words.map(
            (item) => item.option.name
        );
    }

    handle_topic_change(event) {
        if (!event.detail) return;
        this.params.selected_topics = event.detail.selected_options;
        this.update_audio_list();
    }

    audio_info_title(audio) {
        const title = `<h3>${audio.name}</h3>`;
        return title;
    }

    audio_info_content(audio) {
        const pn = this.i18n.tr('audios.recorder-name');
        const vdr = this.i18n.tr('audios.audio-date-range');
        const date_range = format_date(
            audio.audio_date_datestr,
            audio.audio_date_datespan
        );
        const keywords = audio.keywords ? audio.keywords : '';
        const kw_label = this.i18n.tr('audios.keywords');
        const content = `
        <ul>
            <li>${pn}:&nbsp;${audio.recorder_name}</li>
            <li>${vdr}:&nbsp;${date_range}</li>
            <li>${kw_label}:&nbsp;${keywords}</li>
        </ul>
        `;
        return content;
    }

    show_filters_only() {
        this.editing_filters = true;
    }

    upload_files() {
        this.theme.hide_title = true;
        this.dialog
            .open({ component: UploadAudios, lock: true })
            .whenClosed((result) => {
                //this.get_uploaded_info({ duplicates: result.output.duplicates, uploaded: result.output.uploaded });
                this.theme.hide_title = false;
            });
    }

    apply_topics_to_checked_audios() {
        this.api
            .call_server_post('audios/apply_to_checked_audios', {
                params: this.params,
            })
            .then((response) => {
                this.clear_selected_topics_now = true;
                this.uncheck_checked_audios();
                if (response.new_topic_was_added) {
                    this.update_topic_list();
                }
            });
    }

    uncheck_checked_audios() {
        this.params.checked_audio_list = [];
        this.checked_audios = new Set();
        for (const audio of this.audio_list) {
            audio.checked = false;
        }
    }

    handle_age_change() {
        this.update_audio_list();
    }
}
