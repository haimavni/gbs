import { autoinject, computedFrom } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from '../services/user';
import { Theme } from '../services/theme';
import { Misc } from '../services/misc';
import { highlight } from '../services/dom_utils';
import { MemberList } from "../services/member_list";
import { ArticleList } from '../services/article_list';
import { Router } from 'aurelia-router';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogService } from 'aurelia-dialog';
import { FullSizePhoto } from '../photos/full-size-photo';
import { MultiSelectSettings } from '../resources/elements/multi-select/multi-select';
import { MemberPicker } from "../members/member-picker";
import { ArticlePicker } from "../articles/article-picker";
import { PhotoPicker } from "../photos/photo-picker";
import { runInThisContext } from 'vm';

@autoinject()
export class DocDetail {
    api: MemberGateway;
    i18n: I18N;
    user: User;
    theme: Theme;
    doc = {name: 'no-name'};
    story_about_doc;
    keywords;
    doc_ids = [];
    topic_list = [];
    topic_groups = [];
    no_topics_yet = false;
    advanced_search = false;
    doc_id;
    doc_src;
    doc_story;
    doc_story_about;
    doc_date_str;
    doc_date_datespan;
    doc_date_valid = '';
    doc_topics;
    options_settings: MultiSelectSettings;
    params = {
        selected_topics: [],
        //selected_photographers: [],
        doc_ids: []
    };
    doc_name: any;


    constructor(api: MemberGateway, i18n: I18N, user: User, theme: Theme) {
        this.api = api;
        this.i18n = i18n;
        this.user = user;
        this.theme = theme;
        this.options_settings = new MultiSelectSettings
            ({
                hide_higher_options: true,
                clear_filter_after_select: false,
                can_set_sign: false,
                can_add: true,
                can_group: false,
                empty_list_message: this.i18n.tr('photos.no-topics-yet'),
            });
    }

    async activate(params, config) {
        this.doc_id = params.id;
        this.keywords = params.keywords;
        this.doc_ids = params.doc_ids;
        this.advanced_search = params.search_type == 'advanced';
        ///this.what = params.what ? params.what : "";
        await this.update_topic_list();
        await this.get_doc_info(this.doc_id);
    }

    get_doc_info(doc_id) {
        this.api.call_server_post('docs/get_doc_info', { doc_id: doc_id })
            .then(response => {
                this.doc = response.doc;
                this.doc_src = response.doc_src;
                this.doc_name = response.doc_name;
                this.doc_topics = response.doc_topics;
                this.doc_story = response.doc_story;
                this.doc_story_about = response.doc_story_about;
                if (this.doc_story_about && this.doc_story_about.story_id == 'new') {
                    //this.doc_story.name = this.i18n.tr('photos.new-story');
                    this.doc_story_about.story_text = this.i18n.tr('photos.new-story-content');
                }
                this.doc_date_str = response.doc_date_str;
                this.doc_date_datespan = response.doc_date_datespan;
                this.init_selected_topics();
            });
    }

    update_topic_list() {
        let usage = this.user.editing ? {} : { usage: 'D' };
        this.api.call_server_post('topics/get_topic_list', usage)
            .then(result => {
                this.topic_list = result.topic_list;
                this.topic_groups = result.topic_groups;
                //this.photographer_list = result.photographer_list;
                this.no_topics_yet = this.topic_list.length == 0;
                //this.no_photographers_yet = this.photographer_list.length == 0;
            });
    }

    update_doc_date(customEvent) {
        customEvent.stopPropagation();
        if (this.doc_date_valid != 'valid') return;
        let event = customEvent.detail;
        let s = typeof event;
        /*this.undo_list.push({ what: 'photo-date', photo_date: { photo_date_str: this.curr_info.photo_date_str, photo_date_datespan: this.curr_info.photo_date_datespan } });
        this.curr_info.photo_date_str = this.photo_date_str.slice(0);
        this.curr_info.photo_date_datespan = this.photo_date_datespan;*/
        this.api.call_server_post('docs/update_doc_date', { doc_date_str: event.date_str, doc_date_datespan: event.date_span, doc_id: this.doc_id });
    }

    handle_topic_change(event) {
        if (!event.detail) return;
        this.params.selected_topics = event.detail.selected_options
        let topics = this.params.selected_topics.map(top => top.option);
        this.doc_topics = topics;
        //this.undo_list.push({ what: 'topics', photo_topics: this.curr_info.photo_topics });
        //this.curr_info.photo_topics = topics.slice(0);
        this.api.call_server_post('docs/apply_topics_to_doc', { doc_id: this.doc_id, topics: this.doc_topics });
    }

    init_selected_topics() {
        let selected_topics = [];
        let i = 0;
        for (let opt of this.doc_topics) {
            opt.sign = '';
            let itm = { option: opt, first: i == 0, last: i == this.doc_topics.length - 1, group_number: i + 1 }
            selected_topics.push(itm);
            i += 1;
        }
        this.params.selected_topics = selected_topics;
    }



    @computedFrom('user.editing')
    get user_editing() {
        this.update_topic_list();
        return this.user.editing;
    }

    @computedFrom('doc_topics')
    get topic_names() {
        if (!this.doc_topics) return "";
        let topic_name_list = this.doc_topics.map(itm => itm.name);
        return topic_name_list.join(';');
    }




}