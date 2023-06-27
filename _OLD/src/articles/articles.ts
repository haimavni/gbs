import { autoinject, singleton, computedFrom } from "aurelia-framework";
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { EventAggregator } from 'aurelia-event-aggregator';
import { ArticleList } from '../services/article_list';
import { I18N } from 'aurelia-i18n';
import { Router } from 'aurelia-router';
import { MemberGateway } from '../services/gateway';

@autoinject()
@singleton()
export class Articles {
    filter = "";
    user;
    api;
    i18n;
    router;
    eventAggregator;
    _articles = [];
    articleList;
    faces_per_line = 8;
    win_width;
    theme;
    max_articles_displayed = 1000;
    scroll_area;
    scroll_top = 0;
    selected_articles = new Set([]);
    article_group_list;
    caller_id;
    caller_type;

    constructor(user: User, api: MemberGateway, eventAggregator: EventAggregator, articleList: ArticleList, theme: Theme, i18n: I18N, router: Router) {
        this.user = user;
        this.api = api;
        this.theme = theme;
        this.i18n = i18n;
        this.router = router;
        this.eventAggregator = eventAggregator;
        this.articleList = articleList;
        this._articles = [];
        this.eventAggregator.subscribe('EditModeChange', payload => { this.user = payload });
        this.eventAggregator.subscribe('NewArticleAdded', article_details => {
            this.article_added(article_details);
        });
    }

    activate(params, routeConfig) {
        return this.articleList.getArticleList().then(articles => {
            this._articles = articles.article_list;
            for (let article of this._articles) {
                article.rand = Math.random() * 1000;
            }
            if (routeConfig.name == 'associate-articles') {
                this.caller_id = params.caller_id;
                this.caller_type = params.caller_type;
                let arr;
                if (params.associated_articles) {
                    arr = params.associated_articles.map(i => Number(i));
                } else {
                    arr = [];
                }
                this.selected_articles = new Set(arr);
                for (let article of this._articles) {
                    if (this.selected_articles.has(article.id)) {
                        article.selected = 1;
                    } else {
                        article.selected = 0;
                    }
                }
            }
            this.win_width = window.outerWidth;
            this.theme.display_header_background = true;
        });
    }

    attached() {
        this.theme.display_header_background = true;
        this.theme.page_title = (this.caller_type) ? 'articles.' + this.caller_type : "articles.articles";
        this.scroll_area.scrollTop = this.scroll_top;
    }

    detached() {
        this.theme.display_header_background = false;
        this.theme.page_title = "";
    }

    article_added(article_details) {
        //todo: experiments
        this._articles = this._articles.splice(0, 0, { name: article_details.name, gender: article_details.gender, id: article_details.id });
    }

    private build_article_index() {
        let result = {};
        for (let article of this._articles) {
            result[article.id] = article;
        }
        return result;
    }

    article_clicked(article, event) {
        event.stopPropagation();
        if (event.ctrlKey) {
            this.toggle_selection(article, event);
        } else {
            this.scroll_top = this.scroll_area.scrollTop;
            this.router.navigateToRoute('article-details', { id: article.id, keywords: "" });
        }
    }

    @computedFrom('_articles')
    get articles() {
        return this._articles;
    }

    get topic_articles() {
        if (this.caller_type == 'story' || this.caller_type == 'term') {
            return 'select-articles'
        } else {
            return 'articles'
        }
    }

    save_article_group(group_id) {
        let article_ids = Array.from(this.selected_articles);
        let caller_type = this.caller_type;
        this.caller_type = '';
        this.api.call_server_post('articles/save_group_articles',
            { user_id: this.user.id, caller_id: this.caller_id, caller_type: caller_type, article_ids: article_ids })
            .then(response => {
                this.clear_article_group();
                if (caller_type == 'story') {
                    this.router.navigateToRoute('story-detail', { id: this.caller_id, used_for: this.api.constants.story_type.STORY4EVENT });
                } if (caller_type == 'term') {
                    this.router.navigateToRoute('term-detail', { id: this.caller_id, used_for: this.api.constants.story_type.STORY4TERM });
                }
            });
    }

    clear_article_group() {
        for (let article of this._articles) {
            article.selected = 0;
        }
        this.selected_articles = new Set();
    }

    goto_members() {
        this.router.navigateToRoute('members');
    }

    toggle_selection(article, event) {
        if (article.selected) {
            article.selected = 0;
            this.selected_articles.delete(article.id)
        } else {
            this.selected_articles.add(article.id)
            article.selected = 1;
        }
    }

}
