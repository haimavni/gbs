import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { autoinject, singleton, computedFrom } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';
import { DialogService } from 'aurelia-dialog';
import { UploadAudios } from './upload-audios';
import { EventAggregator } from 'aurelia-event-aggregator';
import { MultiSelectSettings } from '../resources/elements/multi-select/multi-select';
import { format_date } from '../services/my-date';

@autoinject
class Audio {
    artist_name = "";
    artist_name_label = "";
    audio_date_label = "";
    keywords_label = "";
    name = "";
    src = "";
    id = 0;
    keywords = "";
    audio_date_datestr = "";
    audio_date_datespan = 0;
    selected: boolean = false;

    constructor(artist_name, artist_name_label, audio_date_label, keywords_label) {
        this.artist_name = artist_name;
        this.artist_name_label = artist_name_label;
        this.audio_date_label = audio_date_label;
        this.keywords_label = keywords_label;
    }

    get audio_info_content() {
        let date_range = format_date(this.audio_date_datestr, this.audio_date_datespan);
        let content = `
        <ul>
            <li>${this.artist_name_label}:&nbsp;${this.artist_name}</li>
            <li>${this.audio_date_label}:&nbsp;${date_range}</li>
            <li>${this.keywords_label}:&nbsp;${this.keywords}</li>
        </ul>
        `
        return content;
    }

}

@autoinject
@singleton()
export class Audios {
    filter = "";
    audio_list: Audio[] = [];
    api;
    user;
    theme;
    i18n;
    router;
    scroll_area;
    scroll_top = 0;
    dialog;
    ea;
    first_index = 0;
    audios_per_page = 9;
    artist_list = [];
    topic_list = [];
    topic_groups = [];
    selected_audios = new Set();
    has_grouped_artists = false;
    has_grouped_topics = false;
    params = {
        kind: "V",
        selected_topics: [],
        selected_artists: [],
        selected_days_since_upload: 0,
        selected_uploader: "anyone",
        selected_dates_option: "dated-or-not",
        audios_date_datestr: "",
        audios_date_span_size: 3,
        selected_audio_list: [],
        user_id: null,
    };
    options_settings = new MultiSelectSettings({
        clear_filter_after_select: false,
        can_group: true
    });
    artists_settings = new MultiSelectSettings({
        clear_filter_after_select: true,
        can_set_sign: false
    });
    length_keeper = {
        len: 0
    }
    clear_selected_phototgraphers_now = false;
    clear_selected_topics_now = false;
    anchor = -1; //for multiple selections
    empty = false;
    editing_filters = false;

    constructor(api: MemberGateway, user: User, i18n: I18N, theme: Theme, router: Router, dialog: DialogService, ea: EventAggregator) {
        this.api = api;
        this.user = user;
        this.i18n = i18n;
        this.theme = theme;
        this.dialog = dialog;
        this.ea = ea;
    }

    audio_data(audio_rec) {
        switch (audio_rec.audio_type) {
            case 'youtube':
                audio_rec.src = "//www.youtube.com/embed/" + audio_rec.src + "?wmode=opaque";
                break;
            case 'vimeo':
                //use the sample below 
                // <iframe src="https://player.vimeo.com/audio/38324835" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
                // <p><a href="https://vimeo.com/38324835">צבעונים ונוריות בשמורת הבונים</a> from <a href="https://vimeo.com/user2289719">Haim Avni</a> on <a href="https://vimeo.com">Vimeo</a>.</p>            
                audio_rec.src = 'https://vimeo.com/' + audio_rec.src;
                break;
        }
        //audio_rec.selected = false;
        let artist = this.artist_list.find(p => p.id == audio_rec.artist_id);
        let artist_name = artist ? artist.name : this.i18n.tr('audios.unknown-artist');
        let vr = new Audio(
            artist_name,
            this.i18n.tr('audios.artist-name'),
            this.i18n.tr('audios.audio-date-range'),
            this.i18n.tr('audios.keywords'));
        for (let key of Object.keys(vr)) {
            if (audio_rec[key])
                vr[key] = audio_rec[key];
        }
        return vr;
    }

    set_audio_list(audio_list) {
        this.audio_list = audio_list.map(v => this.audio_data(v));
        this.empty = this.audio_list.length == 0;
        this.length_keeper.len = this.audio_list.length;
        this.editing_filters = false;
    }

    update_audio_list() {
        this.api.call_server_post('photos/get_audio_list', this.params)
            .then(response => this.set_audio_list(response.audio_list));
    }

    attached() {
        this.theme.display_header_background = true;
        this.theme.page_title = "audios.audios";
    }

    async created(params, config) {
        await this.update_topic_list();
        this.update_audio_list();
        this.ea.subscribe('NEW-AUDIO', msg => {
            this.add_audio(msg.new_audio_rec)
        });
        this.ea.subscribe('AUDIO-INFO-CHANGED', msg => {
            this.refresh_audio(msg.changes)
        });
        this.ea.subscribe('TAGS_MERGED', () => { this.update_topic_list() });
        this.ea.subscribe('PHOTOGRAPHER_ADDED', () => { this.update_topic_list() });  //for now topics and photogaphers are handled together...
        this.ea.subscribe('AUDIO-TAGS-CHANGED', response => {
            this.apply_changes(response.changes)
        });
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
    }

    update_topic_list() {
        let usage = this.user.editing ? {} : { usage: 'V' };
        this.api.call_server('topics/get_topic_list', usage)
            .then(result => {
                this.topic_list = result.topic_list;
                this.topic_groups = result.topic_groups;
                this.artist_list = result.artist_list;
            });
    }

    apply_changes(changes) {
        for (let change of changes) {
            let audio = this.audio_list.find(v => v.id == change.audio_id);
            if (change.artist_name) {
                audio.artist_name = change.artist_name;
            }
            audio.keywords = change.keywords;
        }
    }

    new_audio() {
        this.theme.hide_title = true;
        this.dialog.open({ viewModel: UploadAudios, model: { params: {} }, lock: true }).whenClosed(response => {
            this.theme.hide_title = false;
        });
    }

    add_audio(new_audio_rec) {
        new_audio_rec = this.audio_data(new_audio_rec);
        this.audio_list.push(new_audio_rec);
        let n = this.audio_list.length;
        let r = n % this.audios_per_page
        this.first_index = n - r;
    }

    refresh_audio(changes) {
        let audio = this.audio_list.find(vid => vid.id == changes.id);
        for (let p of ['name', 'keywords', 'artist_id', 'audio_date_datestr', 'audio_date_datespan']) {
            if (changes[p]) audio[p] = changes[p]
        }
    }

    page(step, event) {
        let idx = this.new_first_index(step);
        if (idx >= 0) {
            this.first_index = idx;
        }
        event.target.parentElement.blur();
    }

    new_first_index(step) {
        let idx = this.first_index + step * this.audios_per_page;
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
        let idx = this.new_first_index(side);
        return (idx < 0);
    }

    @computedFrom('length_keeper.len', 'first_index')
    get next_disabled() {
        return this._disabled(+1);
    }

    @computedFrom('length_keeper.len', 'first_index')
    get prev_disabled() {
        return this._disabled(-1);
    }

    @computedFrom('user.editing')
    get user_editing() {
        this.update_topic_list();
        return this.user.editing;
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

    toggle_selection(audio, event, index) {
        if (this.anchor < 0) this.anchor = index;
        if (event.altKey) {
            this.selected_audios = new Set();
            if (audio.selected)
                this.selected_audios.add(audio.id);
            for (let vid of this.audio_list) {
                if (vid.id != audio.id)
                    vid.selected = false;
            }
        } else if (event.shiftKey) {
            this.toggle_audio_selection(audio);
            let checked = audio.selected;
            let i0, i1;
            if (this.anchor < index) {
                i0 = this.anchor;
                i1 = index;
            } else {
                i0 = index;
                i1 = this.anchor;
            }
            for (let i = i0; i < i1; i++) {
                let audio = this.audio_list[i];
                if (audio) {
                    audio.selected = checked;
                    if (checked) {
                        this.selected_audios.add(audio.id)
                    } else {
                        this.selected_audios.delete(audio.id)
                    }
                } else {
                    console.log("no itm. i is: ", i);
                }
            }
        } else if (audio.selected) {
            audio.selected = false;
            this.selected_audios.delete(audio.id);
        } else {
            audio.selected = true;
            this.selected_audios.add(audio.id);
        }
        this.params.selected_audio_list = Array.from(this.selected_audios);
    }

    toggle_audio_selection(audio) {
        if (this.selected_audios.has(audio.id)) {
            this.selected_audios.delete(audio.id);
            audio.selected = false;
        } else {
            this.selected_audios.add(audio.id);
            audio.selected = true;
        }
        this.params.selected_audio_list = Array.from(this.selected_audios);
    }

    delete_audio(audio) {
        this.api.call_server('photos/delete_audio', { audio_id: audio.id })
            .then(() => {
                let idx = this.audio_list.findIndex(v => v.id == audio.id);
                this.audio_list.splice(idx, 1);
            });
    }

    edit_audio_info(audio) {
        this.theme.hide_title = true;
        this.dialog.open({ viewModel: UploadAudios, model: { params: audio }, lock: true }).whenClosed(response => {
            this.theme.hide_title = false;
        });
    }

    @computedFrom('user.editing', 'params.selected_audio_list', 'params.selected_topics', 'params.selected_artists', 'params.audios_date_datestr', 'params.audios_date_datespan', 'selected_audios',
        'has_grouped_artists', 'has_grouped_topics')
    get phase() {
        let result = "photos-not-editing";
        if (this.user.editing) {
            if (this.selected_audios.size > 0) {
                result = "audios-were-selected";
            } else {
                result = this.topics_action();
            }
        }
        this.options_settings.update({
            mergeable: result != "audios-were-selected",
            name_editable: result == "photos-ready-to-edit",
            can_set_sign: true, //result == "photos-ready-to-edit",
            can_add: result == "photos-ready-to-edit",
            can_delete: result == "photos-ready-to-edit",
            empty_list_message: this.i18n.tr('photos.no-topics-yet'),
            hide_higher_options: this.selected_audios.size > 0 && this.user.editing,
            help_topic: 'topics-help'
        });
        this.artists_settings.update({
            mergeable: result == "can-modify-tags" || result == "ready-to-edit",
            name_editable: result == "photos-ready-to-edit",
            can_add: result == "photos-ready-to-edit",
            can_delete: result == "photos-ready-to-edit",
            can_group: this.user.editing,
            empty_list_message: this.i18n.tr('photos.no-artists-yet'),
            help_topic: 'artists-help'
        });
        return result;
    }

    topics_action() {
        let n_groups = 0;
        let has_group_candidate = false;
        for (let topic_item of this.params.selected_topics) {
            if (topic_item.first && topic_item.last) {
                if (topic_item.option.topic_kind == 2) return 'photos-ready-to-edit';
                has_group_candidate = true;
            }
            if (topic_item.last && !topic_item.first) {
                n_groups += 1;
            }
        }
        if (has_group_candidate && n_groups == 1) return 'can-create-group';
        if (n_groups == 1) return 'can-merge-topics';
        if (n_groups == 0 && this.has_grouped_artists) return 'can-merge-topics'
        return 'photos-ready-to-edit';
    }

    save_merges(event: Event) {
        //todo: if event.ctrl create a super group rather than merge?
        this.api.call_server_post('topics/save_tag_merges', this.params)
            .then(response => {
                this.has_grouped_topics = false;
                this.clear_selected_phototgraphers_now = true;
                this.clear_selected_topics_now = true;
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

    apply_to_selected() {
        this.api.call_server_post('photos/apply_to_selected_audios', this.params)
            .then(response => {
                this.clear_selected_audios();
                if (response.new_topic_was_added) {
                    this.update_topic_list();
                }
                this.clear_selected_topics_now = true;
            });
    }

    clear_selected_audios() {
        for (let audio of this.audio_list) {
            audio.selected = false;
        }
        this.selected_audios = new Set();
        this.params.selected_audio_list = [];
    }

    add_artist(event) {
        let new_artist_name = event.detail.new_name;
        this.api.call_server_post('topics/add_artist', { artist_name: new_artist_name, kind: 'V' });
    }

    remove_artist(event) {
        let artist = event.detail.option;
        this.api.call_server_post('topics/remove_artist', { artist: artist })
        .then(() => {
            this.update_topic_list();
        });
    }

    handle_artist_change(event) {
        this.params.selected_artists = event.detail.selected_options;
        this.update_audio_list();
    }

    handle_topic_change(event) {
        if (!event.detail) return;
        this.params.selected_topics = event.detail.selected_options;
        this.update_audio_list();
    }

    promote_audios() {
        this.api.call_server_post('photos/promote_audios', { params: this.params })
            .then(response => {
                this.clear_selected_audios();
            });
    }

    audio_info_title(audio) {
        let title = `<h3>${audio.name}</h3>`
        return title;
    }

    audio_info_content(audio) {
        let pn = this.i18n.tr('audios.artist-name');
        let vdr = this.i18n.tr('audios.audio-date-range');
        let date_range = format_date(audio.audio_date_datestr, audio.audio_date_datespan);
        let keywords = audio.keywords ? audio.keywords : "";
        let kw_label = this.i18n.tr('audios.keywords')
        let content = `
        <ul>
            <li>${pn}:&nbsp;${audio.artist_name}</li>
            <li>${vdr}:&nbsp;${date_range}</li>
            <li>${kw_label}:&nbsp;${keywords}</li>
        </ul>
        `
        return content;
    }

    show_filters_only() {
        this.editing_filters = true;
    }

}
