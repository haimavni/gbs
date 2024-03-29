import { inject, noView, singleton } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberGateway } from './gateway';
import { sort_array } from './sort_array';

@inject(EventAggregator, MemberGateway)
@noView()
@singleton()
export class ArticleList {

    eventAggregator;
    articles = { article_list: null };
    api;
    recent = [];

    constructor(eventAggregator, api) {
        this.eventAggregator = eventAggregator;
        this.api = api;
        this.eventAggregator.subscribe('ARTICLE_LISTS_CHANGED', payload => {
            let flds = ['id', 'name', 'has_profile'];
            let mi = payload.article_rec;
            if (payload.new_article) {
                let new_article = {};
                for (let k of flds) {
                    new_article[k] = mi[k];
                }
                new_article['facephotourl'] = mi.facephotourl;
                this.articles.article_list.splice(0, 0, new_article);
            } else {
                this.get_article_by_id(mi.id)
                    .then((article) => {
                        for (let k of flds) {
                            article[k] = mi[k];
                        }
                    });
            }
        });

        this.eventAggregator.subscribe('ARTICLE_PROFILE_CHANGED', payload => {
            this.set_profile_photo(payload.article_id, payload.face_photo_url);
        });
        this.eventAggregator.subscribe('ARTICLE_DELETED', payload => {
            let idx = this.articles.article_list.findIndex((article) => article.id==payload.article_id);
            if (idx >= 0) {
                this.articles.article_list.splice(idx, 1);
            }
        })
    }

    getArticleList(refresh: boolean = false) {
        if (this.articles.article_list && !refresh) {
            return new Promise(resolve => {
                resolve(this.articles)
            })
        } else {
            return this.api.call_server('articles/article_list')
                .then(articles => {
                    this.articles.article_list = sort_array(articles.article_list, '-has_profile_photo');
                    return this.articles;
                })
        }
    }

    public add_recent(article) {
        let idx = this.recent.findIndex(art => art.id == article.id);
        if (idx > 0) {
            this.recent.splice(idx, 1);
        }
        if (idx != 0) {
            this.recent.splice(0, 0, article);
        }
        if (this.recent.length > 20) {
            this.recent.splice(20, 1);
        }
    }

    sort_article_list(sortby) {
        this.articles.article_list = sort_array(this.articles.article_list, sortby);
        //this.articles.article_list.splice(0);
    }

    get_article_by_id(article_id) {
        if (!article_id) {
            return new Promise(resolve => resolve({ name: "" }))
        }
        return this.getArticleList()
            .then(articles => {
                let lst = articles.article_list.filter(article => article.id == article_id);
                if (lst && lst.length > 0) {
                    return lst[0];
                }
            });
    }

    set_profile_photo(article_id, face_photo_url) {
        this.get_article_by_id(article_id)
            .then(article => {
                if (face_photo_url) {
                    article.facephotourl = face_photo_url;
                }
            });
    }

    add_article(article_details) {
        this.articles.article_list.push(article_details);
    }

    remove_article(article_id) {
        return this.api.call_server('articles/remove_article', { article_id: article_id })
            .then(response => {
                if (response.deleted) {
                    let art_ids = this.articles.article_list.map(article => article.id)
                    let idx = art_ids.indexOf(article_id);
                    this.articles.article_list.splice(idx, 1);
                }
            })
    }

}
