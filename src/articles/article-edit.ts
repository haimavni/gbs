import { autoinject } from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Misc } from '../services/misc';
import { EventAggregator } from 'aurelia-event-aggregator';
import { DialogService } from 'aurelia-dialog';
import { computedFrom } from 'aurelia-framework';

@autoinject()
export class ArticleEdit {
    user;
    eventAggregator;
    api;
    router;
    i18n;
    article;
    articleList;
    articles;
    article_info_orig;
    dialog;
    update_info = '';
    misc;

    constructor(user: User, eventAggregator: EventAggregator, api: MemberGateway, 
        router: Router, i18n: I18N, dialog: DialogService,  misc: Misc) {
        this.user = user;
        this.eventAggregator = eventAggregator;
        this.api = api;
        this.router = router;
        this.i18n = i18n;
        this.misc = misc;
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.dialog = dialog;
    }

    activate(article) {
        this.article = article;
        let m = this.article.article_info
        this.article_info_orig = this.misc.deepClone(m);
        if (this.user.privileges.DATA_AUDITOR && m.updater_id) {
            let s = ' ' + this.i18n.tr('articles.updated-on-date') + ' ';
            this.update_info = m.updater_name + s + m.update_time;
        } else {
            this.update_info = "";
        }
    }

    @computedFrom('article.article_info.name', 
        'article.article_info.date_start.date', 'article.article_info.date_end.date')
    get dirty_info() {
        let dirty = JSON.stringify(this.article.article_info) != JSON.stringify(this.article_info_orig);
        this.eventAggregator.publish('DirtyInfo', dirty);
        return dirty;
    }

    cancel_edit_mode() {
        this.article.article_info = this.misc.deepClone(this.article_info_orig);
    }

    save_edited_data() {
        let data = { user_id: this.user.id };
        if (this.dirty_info) {
            data['article_info'] = this.article.article_info;
        } else {
            data['article_id'] = this.article.article_info.id;
        }
        let id = this.article.article_info.id;
        this.api.call_server_post('articles/save_article_info', data)
            .then(response => {
                this.article_info_orig = this.misc.deepClone(this.article.article_info);
                this.article = this.misc.deepClone(this.article);
            });
    }

}

