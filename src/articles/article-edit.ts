import { IEventAggregator } from 'aurelia';
import { IDialogService } from '@aurelia/dialog';
import { IRouter } from '@aurelia/router';
import { I18N } from '@aurelia/i18n';
import { IMemberGateway } from '../services/gateway';
import { IUser } from '../services/user';
import { IMisc } from '../services/misc';

export class ArticleEdit {
    article;
    articleList;
    articles;
    article_info_orig;
    update_info = '';
    date_start_valid = '';
    date_end_valid = '';

    constructor(
        @IUser private user: IUser,
        @IEventAggregator readonly eventAggregator: IEventAggregator,
        @IMemberGateway readonly api: IMemberGateway,
        @IRouter readonly router: IRouter,
        @I18N readonly i18n: I18N,
        @IDialogService readonly dialog: IDialogService,
        @IMisc readonly misc: IMisc
    ) {
        this.eventAggregator.subscribe('EditModeChange', (payload: IUser) => {
            this.user = payload;
        });
    }

    loading(article) {
        this.article = article;
        const m = this.article.article_info;
        this.article_info_orig = this.misc.deepClone(m);
        if (this.user.privileges.DATA_AUDITOR && m.updater_id) {
            const s = ' ' + this.i18n.tr('articles.updated-on-date') + ' ';
            this.update_info = m.updater_name + s + m.update_time;
        } else {
            this.update_info = '';
        }
    }

    get dirty_info() {
        const dirty =
            JSON.stringify(this.article.article_info) !=
            JSON.stringify(this.article_info_orig);
        this.eventAggregator.publish('DirtyInfo', dirty);
        return dirty;
    }

    cancel_edit_mode() {
        this.article.article_info = this.misc.deepClone(this.article_info_orig);
    }

    save_edited_data() {
        const data = { user_id: this.user.id };
        if (this.dirty_info) {
            data['article_info'] = this.article.article_info;
        } else {
            data['article_id'] = this.article.article_info.id;
        }
        const id = this.article.article_info.id;
        this.api
            .call_server_post('articles/save_article_info', data)
            .then((response) => {
                this.article_info_orig = this.misc.deepClone(
                    this.article.article_info
                );
                this.article = this.misc.deepClone(this.article);
            });
    }

    get incomplete() {
        if (this.date_start_valid != 'valid' || this.date_end_valid != 'valid')
            return 'disabled';
        return '';
    }
}
