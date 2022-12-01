import { IRouteableComponent } from '@aurelia/router';
export class ArticleFaces implements IRouteableComponent {
    articles = [];

    loading(articles) {
        this.articles = articles;
    }
}
