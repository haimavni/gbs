import { IEventAggregator } from "aurelia";
import { IRouteableComponent, IRoute, IRouter } from "@aurelia/router";
import { ITheme } from "./services/theme";
import { IMemberGateway } from "./services/gateway";
import { IUser } from "./services/user";
import { IMisc } from "./services/misc";
import { IWatchVersion } from "./services/watch_version";
import { IDialogService } from "@aurelia/runtime-html";
import { Promote } from "./user/promote";
import { Feedback } from "./user/feedback";
import { AddCustomer } from "./admin/add_customer";

export class MyApp implements IRouteableComponent {
    baseURL;
    //min_height;
    router_view_height;
    curr_version;
    keywords = "";
    search_button_pressed = false;
    clear_keywords_timeout = null;
    search_timeout = null;
    search_history = [];

    static routes: IRoute[] = [
        {
            path: ["home", ""],
            id: "home",
            component: () => import("./home/home"),
            data: {
                auth: true,
                nav: false,
            },
            title: "",
        },
        {
            path: "docs",
            id: "docs",
            component: () => import("./docs/docs"),
            data: {
                auth: true,
                nav: true,
            },
            title: "docs.docs",
        },
        {
            path: "terms",
            id: "terms",
            component: () => import("./terms/terms"),
            data: {
                auth: true,
                nav: true,
            },
            title: "terms.terms",
        },
        {
            path: "audios/*",
            id: "audios",
            component: () => import("./audios/audios"),
            data: {
                auth: true,
                nav: true,
            },
            title: "audios.audios",
        },
        {
            path: "videos",
            id: "videos",
            component: () => import("./videos/videos"),
            data: {
                auth: true,
                nav: true,
            },
            title: "videos.videos",
        },
        {
            path: "photos/*",
            id: "photos",
            component: () => import("./photos/photos"),
            data: {
                auth: true,
                nav: true,
            },
            title: "photos.photos",
        },
        {
            path: "stories",
            id: "stories",
            component: () => import("./stories/stories"),
            data: {
                auth: true,
                nav: true,
            },
            title: "stories.stories",
        },
        {
            path: "articles",
            id: "articles",
            component: () => import("./articles/articles"),
            data: {
                auth: true,
                nav: this.user.config.articles_in_menu,
            },
            title: "articles.articles",
        },
        {
            path: "members",
            id: "members",
            component: () => import("./members/members"),
            data: {
                auth: true,
                nav: true,
            },
            title: "members.members",
        },
        {
            path: "members/:caller_id/*",
            id: "associate-members",
            component: () => import("./members/members"),
            data: {
                auth: true,
                nav: false,
            },
            title: "members.update-story-members",
        },
        {
            path: "articles/:caller_id/*",
            id: "associate-articles",
            component: () => import("./articles/articles"),
            data: {
                nav: false,
            },
            title: "articles.update-story-articles",
        },
        {
            path: "photos-group/:caller_id/*",
            id: "associate-photos",
            component: () => import("./photos/photos"),
            data: {
                nav: false,
            },
            title: "photos.update-story-photos",
        },
        {
            path: "story-detail/:id/*",
            id: "story-detail",
            component: () => import("./stories/story-detail"),
            data: {
                auth: true,
            },
        },
        {
            path: "approve-story/:id/*",
            id: "approve-story",
            component: () => import("./stories/approve-story"),
        },
        {
            path: "term-detail/:id/*",
            id: "term-detail",
            component: () => import("./stories/story-detail"),
            data: {
                auth: true,
            },
        },
        {
            path: "help-detail/:id/*",
            id: "help-detail",
            component: () => import("./stories/story-detail"),
            data: {
                auth: true,
            },
        },
        {
            path: "member-details/:id/*",
            id: "member-details",
            component: () => import("./members/member-detail"),
            data: {
                auth: true,
            },
        },
        {
            path: "article-details/:id/*",
            id: "article-details",
            component: () => import("./articles/article-detail"),
            data: {
                auth: true,
            },
        },
        {
            path: "doc-detail/:id/*",
            id: "doc-detail",
            component: () => import("./docs/doc-detail"),
        },
        {
            path: "members/new",
            id: "member-creation",
            component: () => import("./members/member-edit"),
            title: "members.newMember",
        },
        {
            path: "members/:id/edit",
            id: "member-edit",
            component: () => import("./members/member-edit"),
            title: "members.editMember",
        },
        {
            path: "photos/:id/*",
            id: "photo-detail",
            component: () => import("./photos/photo-detail"),
            data: {
                auth: true,
            },
        },
        {
            path: "access-manager",
            id: "access-manager",
            component: () => import("./admin/access-manager"),
        },
        {
            path: "groups-manager",
            id: "groups-manager",
            component: () => import("./groups/groups-manager"),
        },
        {
            path: "upload-photo/:group/*",
            id: "upload-photo",
            component: () => import("./groups/upload-photo"),
        },
        {
            path: "hit-counts",
            id: "hit-counts",
            component: () => import("./admin/hit-counts"),
            data: {
                auth: true,
            },
        },
        {
            path: "feedbacks",
            id: "feedbacks",
            component: () => import("./admin/show-feedbacks"),
        },
        {
            path: "chats",
            id: "chats",
            component: () => import("./user/chats"),
            data: {
                auth: true,
            },
        },
        {
            path: "adhoc-scripts",
            id: "adhoc-scripts",
            component: () => import("./admin/adhoc-scripts"),
        },
        {
            path: "merge-help-messages",
            id: "merge-help-messages",
            component: () => import("./admin/merge-help-messages"),
        },
        {
            path: "show-logs",
            id: "show-logs",
            component: () => import("./admin/show-logs"),
        },
        {
            path: "customize",
            id: "customize",
            component: () => import("./admin/customize"),
        },
        {
            path: "experiment",
            id: "experiment",
            component: () => import("./experiments/experiment"),
        },
        {
            path: "black-sheep",
            id: "black-sheep",
            component: () => import("./games/black-sheep/black-sheep"),
            data: {
                auth: true,
            },
        },
        {
            path: "gbrenner/*",
            id: "gbrenner",
            component: () => import("./gbrenner/gbrenner"),
        },
        {
            path: "gallery",
            id: "gallery",
            component: () => import("./gallery/gallery"),
            data: {
                auth: true,
            },
        },
        {
            path: "annotate-video/:video_id/*",
            id: "annotate-video",
            component: () => import("./videos/annotate-video"),
            data: {
                auth: true,
            },
        },
        {
            path: "videos/:id/*",
            id: "video-detail",
            component: () => import("./videos/annotate-video"),
            data: {
                auth: true,
            },
        },
        {
            path: "registered-only",
            id: "registered-only",
            component: () => import("./user/registered-only"),
        },
        {
            path: "video-list",
            id: "video-list",
            component: () => import("./videos/videos-old"),
        },
    ];

    constructor(
        @IRouter readonly router: IRouter,
        @ITheme readonly theme: ITheme,
        @IUser readonly user: IUser,
        @IWatchVersion readonly watcher: IWatchVersion,
        @IMemberGateway readonly api: IMemberGateway,
        @IDialogService readonly dialog: IDialogService,
        @IMisc readonly misc: IMisc,
        @IEventAggregator readonly ea: IEventAggregator
    ) {}

    attached() {
        this.router_view_height = this.theme.height - 60 - 117;

        this.api.hit("APP");

        if (process.env.push_state) {
            console.log("app attached");
        }
    }

    feedback() {
        this.theme.hide_title = true;
        this.dialog
            .open({ component: Feedback, lock: true })
            .whenClosed((response) => {
                this.theme.hide_title = false;
                if (response.status == 'ok') {
                    //do something?
                } else {
                    //do something else?
                }
            });
    }

    contact_us() {
        this.theme.hide_title = true;
        this.dialog
            .open({ component: Promote, lock: true })
            .whenClosed((response) => {
                this.theme.hide_title = false;
                if (response.status == 'ok') {
                    //do something?
                } else {
                    //do something else?
                }
            });
    }

    go_search(event) {
        //if (ifempty && this.keywords) return; //not to duplicate on change. used only to display random list of stories
        if (this.clear_keywords_timeout) {
            clearTimeout(this.clear_keywords_timeout);
            this.clear_keywords_timeout = null;
        }
        if (event.keyCode == 13) {
            return this.invoke_search(true);
        }
        if (this.search_timeout) {
            clearTimeout(this.search_timeout);
        }
        //this.search_timeout = setTimeout(() => {this.invoke_search(false)}, this.theme.search_debounce);
        return true;
    }

    go_search_btn() {
        if (this.search_timeout) {
            clearTimeout(this.search_timeout);
            this.search_timeout = null;
        }
        this.invoke_search(true);
    }

    invoke_search(from_btn: boolean) {
        //this.theme.change_search_debounce(from_btn);
        this.keywords = this.keywords.trim();
        if (this.keywords == "") return;
        if (this.clear_keywords_timeout)
            clearTimeout(this.clear_keywords_timeout);
        this.clear_keywords_timeout = setTimeout(() => {
            this.clear_keywords();
        }, 10000);
        this.api.call_server("members/collect_search_stats", {
            search_pattern: this.keywords,
        });
        if (this.router.currentInstruction.config.name == "stories") {
            this.ea.publish("GO-SEARCH", { keywords: this.keywords });
        } else {
            this.router.load("/stories", { keywords: this.keywords });
        }
    }

    get search_input_width() {
        return this.user.isLoggedIn ? 160 : 240;
    }

    clear_keywords() {
        this.search_history = this.misc.update_history(
            this.search_history,
            this.keywords,
            12
        );
        this.keywords = "";
    }

    drag_menu_items(customEvent) {
        const event = customEvent.detail;
        const el = document.getElementById("nav-items");
        let mrs = el.style.marginRight || "0px";
        mrs = mrs.replace("px", "");
        let mr = parseInt(mrs) - event.dx;
        if (mr > 0) {
            mr = 0;
        }
        el.style.marginRight = `${mr}px`;
    }

    menu_items_shift(mrg) {
        const el1 = document.getElementById("main-search-box");
        const width = el1.offsetWidth;
        const m0 = mrg;
        if (mrg < 0) {
            mrg = width + mrg;
            if (mrg > 0) mrg = 0;
        }
        const el = document.getElementById("nav-items");
        el.style.marginRight = `${mrg}px`;
    }

    create_new_app() {
        this.dialog.open({ viewModel: AddCustomer, lock: true });
    }

    quick_upload_photo() {
        this.router.load("upload-photo/1");
    }

    show_gallery() {
        this.router.load("gallery", {});
    }

    show_menu_item(row) {
        if (row.title == "audios.audios" && !this.user.config.support_audio)
            return false;
        if (row.title == "terms.terms" && !this.user.config.terms_enabled)
            return false;
        return true;
    }
}
