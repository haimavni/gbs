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
    doc_story;
    doc_story_about;
    doc_date_str;
    doc_date_datespan;
    doc_date_valid = '';


    constructor(api: MemberGateway, i18n: I18N, user: User, theme: Theme) {
        this.api = api;
        this.i18n = i18n;
        this.user = user;
        this.theme = theme;
    }

    async activate(params, config) {
        let doc_id = params.id;
        this.keywords = params.keywords;
        this.doc_ids = params.doc_ids;
        this.advanced_search = params.search_type == 'advanced';
        ///this.what = params.what ? params.what : "";
        await this.update_topic_list();
        await this.get_doc_info(params.id);
    }

    get_doc_info(doc_id) {
        this.api.call_server_post('docs/get_doc_info', { doc_id: doc_id })
            .then(response => {
                this.doc = response.doc;
                console.log("doc: ", this.doc, "response: ", response);
                this.doc_story = response.doc_story;
                this.doc_story_about = response.doc_story_about;
                if (this.doc_story_about.story_id == 'new') {
                    //this.doc_story.name = this.i18n.tr('photos.new-story');
                    this.doc_story_about.story_text = this.i18n.tr('photos.new-story-content');
                }
                this.doc_date_str = response.doc_date_str;
                this.doc_date_datespan = response.doc_date_datespan;
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





}