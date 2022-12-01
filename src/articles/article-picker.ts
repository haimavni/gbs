import { autoinject, inject, computedFrom } from "aurelia-framework";
import { User } from "../services/user";
import { EventAggregator } from 'aurelia-event-aggregator';
import { ArticleList } from '../services/article_list';
import { DialogController } from 'aurelia-dialog';
import { IRouter } from '@aurelia/router';
import { MemberGateway } from '../services/gateway';
import { I18N } from '@aurelia/i18n';

@autoinject()
export class ArticlePicker {

    filter = "";
    face_identifier = false;
    face;
    slide;
    user;
    eventAggregator;
    articles = [];
    articleList: ArticleList;
    selectedId;
    dialogController;
    make_profile_photo = false;
    router;
    candidates = [];
    excluded = new Set();
    api;
    i18n;
    agent = { size: 9999 };
    article_id;
    back_to_text;
    help_topic;
    multi = false;
    selected_article_ids = new Set();

    constructor(user: User, eventAggregator: EventAggregator, articleList: ArticleList, dialogController: DialogController, router: Router, api: MemberGateway, i18n: I18N) {
        this.user = user;
        this.eventAggregator = eventAggregator;
        this.articleList = articleList;
        this.articles = [];
        this.dialogController = dialogController;
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.router = router;
        this.api = api;
        this.i18n = i18n;
    }

    prepare_lists() {
        return this.articleList.getArticleList().then(articles => {
            let aList = articles.article_list.slice();
            this.articles = aList;
            this.articles = this.articles.filter(article => article.id == this.article_id || !this.excluded.has(article.id))
        })
    }

    async loading(model) {
        this.face_identifier = model.face_identifier;
        this.face = model.current_face;
        this.slide = model.slide;
        this.candidates = model.candidates ? model.candidates : [];
        this.excluded = model.excluded ? model.excluded : new Set();
        this.multi = model.multi;
        this.back_to_text = model.back_to_text || 'members.back-to-photos';
        this.article_id = model.article_id;
        await this.prepare_lists();
        this.filter = '';
        if (model.preselected) {
            for (let article_id of model.preselected) {
                this.selected_article_ids.add(article_id)
                let article = this.articles.find(art => art.id == article_id);
                article.selected = 'selected';
            }
            this.articles.sort((a, b) => a.selected ? -1 : b.selected ? +1 : 0);
        }
        if (model.article_id > 0) {
            this.articleList.get_article_by_id(model.article_id)
                .then(result => {
                    this.filter = result.name;
                })
        }
    }

    select(article) {
        if (this.multi) {
            if (this.selected_article_ids.has(article.id)) {
                this.selected_article_ids.delete(article.id);
                article.selected = ''
            } else {
                this.selected_article_ids.add(article.id)
                article.selected = 'selected'
            }
        } else {
            this.articleList.add_recent(article);
            this.dialogController.ok({ article_id: article.id, make_profile_photo: this.make_profile_photo });
        }
    }


    async create_new_article() {
        let article_ids = [];
        await this.api.call_server('articles/article_by_name', { name: this.filter })
            .then(response => { article_ids = response.article_ids });
        for (let article_id of article_ids) {
            if (this.excluded.has(article_id)) {
                let msg = this.filter + this.i18n.tr('articles.already-identified')
                alert(msg);
                return;
            }
        }
        let default_name = this.i18n.tr('articles.default-name');
        this.api.call_server('articles/create_new_article',
            { photo_id: this.slide.photo_id, face_x: this.face.x, face_y: this.face.y, face_r: this.face.r, name: this.filter, default_name: default_name })
            .then(response => {
                this.dialogController.ok({
                    article_id: response.article_id, new_article: response.article
                });
            });
    }

    save() {
        let article_ids = Array.from(this.selected_article_ids);
        this.selected_article_ids = new Set();
        for (let article of this.articles) {
            article.selected = '';
        }
        this.dialogController.ok({ article_ids: article_ids });
    }

    @computedFrom('user.editing')
    get place_holder() {
        let key = 'articles.filter';
        if (this.user.editing) key += '-can-add';
        return this.i18n.tr(key);
    }

}
