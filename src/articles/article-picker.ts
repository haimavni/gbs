import { autoinject, inject, computedFrom } from "aurelia-framework";
import { User } from "../services/user";
import { EventAggregator } from 'aurelia-event-aggregator';
import { ArticleList } from '../services/article_list';
import { DialogController } from 'aurelia-dialog';
import { Router } from 'aurelia-router';
import { MemberGateway } from '../services/gateway';
import { I18N } from 'aurelia-i18n';

@autoinject()
export class ArticlePicker {

    filter = "";
    face_identifier = false;
    face;
    slide;
    user;
    eventAggregator;
    articles = [];
    articleList;
    selectedId;
    dialogController;
    make_profile_photo = false;
    router;
    candidates = [];
    excluded = new Set();
    api;
    member_id;
    i18n;
    agent = { size: 9999 };

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

    created() {
        return this.articleList.getArticleList().then(articles => {
            this.articles = this.articles.filter(article => article.id == this.member_id || !this.excluded.has(article.id))
        })
    }

    activate(model) {
        this.face_identifier = model.face_identifier;
        this.face = model.current_face;
        this.slide = model.slide;
        this.candidates = model.candidates ? model.candidates : [];
        this.excluded = model.excluded ? model.excluded : new Set();
        this.filter = '';
        this.member_id = model.member_id;
        if (model.member_id) {
            this.articleList.get_article_by_id(model.member_id)
                .then(result => {
                    this.filter = result.name;
                })
        }
    }

    select(member) {
        this.dialogController.ok({ member_id: member.id, make_profile_photo: this.make_profile_photo });
    }

    async create_new_article() {
        let article_ids = [];
        await this.api.call_server('members/article_by_name', { name: this.filter })
            .then(response => { article_ids = response.article_ids });
        for (let article_id of article_ids) {
            if (this.excluded.has(article_id)) {
                let msg = this.filter + this.i18n.tr('articles.already-identified')
                alert(msg);
                return;
            }
        }
        let default_name = this.i18n.tr('articles.default-name');
        this.api.call_server('members/create_new_article',
            { photo_id: this.slide.photo_id, face_x: this.face.x, face_y: this.face.y, face_r: this.face.r, name: this.filter, default_name: default_name })
            .then(response => {
                this.dialogController.ok({
                    member_id: response.member_id, new_article: response.article
                });
            });
    }

    @computedFrom('user.editing')
    get place_holder() {
        let key = 'articles.filter';
        if (this.user.editing) key += '-can-add';
        return this.i18n.tr(key);
    }

}
