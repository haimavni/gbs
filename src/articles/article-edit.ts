import { IRouter } from "@aurelia/router";
import { I18N } from "@aurelia/i18n";
import { IMemberGateway } from "../services/gateway";
import { IUser } from "../services/user";
import { IMisc } from "../services/misc";
import { IDialogService } from "@aurelia/dialog";
import { IEventAggregator } from "aurelia";

export class ArticleEdit {
    article;
    articleList;
    articles;
    article_info_orig;
    update_info = "";
    date_start_valid = "";
    date_end_valid = "";

    constructor(
        @IUser private user: IUser,
        @IEventAggregator private readonly eventAggregator: IEventAggregator,
        @IMemberGateway private readonly api: IMemberGateway,
        @IRouter private readonly router: IRouter,
        @I18N private readonly i18n: I18N,
        @IDialogService private readonly dialog: IDialogService,
        @IMisc private readonly misc: IMisc
    ) {
        this.eventAggregator.subscribe("EditModeChange", (payload: any) => {
            this.user = payload;
        });
    }

    activate(article) {
        this.article = article;
        let m = this.article.article_info;
        this.article_info_orig = this.misc.deepClone(m);
        if (this.user.privileges.DATA_AUDITOR && m.updater_id) {
            let s = " " + this.i18n.tr("articles.updated-on-date") + " ";
            this.update_info = m.updater_name + s + m.update_time;
        } else {
            this.update_info = "";
        }
    }

    get dirty_info() {
        let dirty =
            JSON.stringify(this.article.article_info) !=
            JSON.stringify(this.article_info_orig);
        this.eventAggregator.publish("DirtyInfo", dirty);
        return dirty;
    }

    cancel_edit_mode() {
        this.article.article_info = this.misc.deepClone(this.article_info_orig);
    }

    save_edited_data() {
        let data = { user_id: this.user.id };
        if (this.dirty_info) {
            data["article_info"] = this.article.article_info;
        } else {
            data["article_id"] = this.article.article_info.id;
        }
        let id = this.article.article_info.id;
        this.api
            .call_server_post("articles/save_article_info", data)
            .then((response) => {
                this.article_info_orig = this.misc.deepClone(
                    this.article.article_info
                );
                this.article = this.misc.deepClone(this.article);
            });
    }

    get incomplete() {
        if (this.date_start_valid != "valid" || this.date_end_valid != "valid")
            return "disabled";
        return "";
    }
}
