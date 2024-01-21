import environment from "./environment";
import { autoinject, computedFrom } from "aurelia-framework";
import { EventAggregator } from "aurelia-event-aggregator";
import { Theme } from "./services/theme";
import { MemberGateway } from "./services/gateway";
import { User } from "./services/user";
import { Cookies } from "./services/cookies";
import { Misc } from "./services/misc";
import { WatchVersion } from "./services/watch_version";
import { DialogService } from "aurelia-dialog";
import { Promote } from "./user/promote";
import { Feedback } from "./user/feedback";
import { AddCustomer } from "./admin/add_customer";
import { Redirect } from "aurelia-router";
import { MemberList } from "./services/member_list";
import { SelectSearch } from "./services/select-search";
import { NotifyLowScreen } from "./services/notify-low-screen";

@autoinject
export class App {
    baseURL;
    //min_height;
    theme;
    router_view_height;
    api;
    user;
    watcher;
    curr_version;
    dialog: DialogService;
    keywords = "";
    ea;
    search_button_pressed = false;
    clear_keywords_timeout = null;
    search_timeout = null;
    search_history = [];
    misc: Misc;
    cookies: Cookies;
    member_list: MemberList;

    constructor(
        theme: Theme,
        api: MemberGateway,
        user: User,
        watcher: WatchVersion,
        dialog: DialogService,
        ea: EventAggregator,
        misc: Misc,
        cookies: Cookies,
        member_list: MemberList
    ) {
        this.baseURL = environment.baseURL;
        this.curr_version = environment.version || "just now";
        this.theme = theme;
        this.api = api;
        this.user = user;
        this.watcher = watcher;
        this.dialog = dialog;
        this.ea = ea;
        this.misc = misc;
        this.cookies = cookies;
        this.member_list = member_list;
        this.ea.subscribe("GOTO-PHOTO-PAGE", (payload) => {
            this.router.navigateToRoute("photos", payload);
        });
    }

    attached() {
        this.router_view_height = this.theme.height - 60 - 117;
        this.api.hit("APP");
        if (environment.push_state) console.log("app attached");
        const screen_height = document.documentElement.clientHeight;
        if (this.cookies.get("NO-SCREEN-ALERT")) return;
        if (screen_height < 900 && this.theme.is_desktop) {
            this.dialog.open({ viewModel: NotifyLowScreen, lock: false });
        }
    }

    bind() {
        if (environment.push_state) console.log("app bind");
    }

    created(owningView, view) {
        if (environment.push_state)
            console.log("app created: ", owningView, view);
    }

    public router;

    async configureRouter(config, router) {
        router.title = "app-title";
        if (environment.push_state) {
            config.options.pushState = true;
            config.options.hasChange = false;
            config.options.root = "/";
        }
        for (let i = 0; i < 100; i += 1) {
            if (this.user.config_ready) break;
            await this.misc.sleep(100);
        }
        config.addAuthorizeStep(AuthorizeStep);
        config.map([
            {
                route: ["home", ""],
                name: "home",
                moduleId: "./home/home",
                nav: false,
                title: "",
                settings: { auth: true },
            },
            {
                route: "stories",
                name: "stories",
                moduleId: "./stories/stories",
                nav: true,
                title: "stories.all",
                settings: {
                    auth: true,
                    is_main: "is_main"
                },
            },
            {
                route: "articles",
                name: "articles",
                moduleId: "./articles/articles",
                nav: this.user.config.articles_in_menu,
                title: "articles.articles",
                settings: { auth: true },
            },
            {
                route: "articles/:caller_id/*",
                name: "associate-articles",
                moduleId: "./articles/articles",
                nav: false,
                title: "articles.update-story-articles",
            },
            {
                route: "docs",
                name: "docs",
                moduleId: "./docs/docs",
                nav: true,
                title: "docs.docs",
                settings: { auth: true },
            },
            {
                route: "terms",
                moduleId: "./terms/terms",
                nav: true,
                title: "terms.terms",
                settings: { auth: true },
            },
            {
                route: "audios/*",
                name: "audios",
                moduleId: "./audios/audios",
                nav: true,
                title: "audios.audios",
                settings: { auth: true },
            },
            {
                route: "videos",
                moduleId: "./videos/videos",
                nav: true,
                title: "videos.videos",
                settings: { auth: true },
            },
            {
                route: "photos/*",
                name: "photos",
                moduleId: "./photos/photos",
                nav: true,
                title: "photos.photos",
                settings: { auth: true },
            },
            {
                route: "stories/events/*",
                name: "events",
                moduleId: "./stories/stories",
                nav: true,
                title: "stories.stories",
                settings: {
                    auth: true
                },
            },
            {
                route: "members",
                name: "members",
                moduleId: "./members/members",
                nav: true,
                title: "members.members",
                settings: { auth: true },
            },
            {
                route: "memorial",
                name: "memorial",
                moduleId: "./members/memorial",
                nav: true,
                title: "members.memorial",
                settings: { auth: true },
            },
            {
                route: "members/:caller_id/*",
                name: "associate-members",
                moduleId: "./members/members",
                nav: false,
                title: "members.update-story-members",
                settings: { auth: true },
            },
            {
                route: "members/:filter/*",
                name: "filtered-members",
                moduleId: "./members/members",
                nav: false,
                title: "members.members",
                settings: { auth: true },
            },
            {
                route: "photos-group/:caller_id/*",
                name: "associate-photos",
                moduleId: "./photos/photos",
                nav: false,
                title: "photos.update-story-photos",
            },
            {
                route: "story-detail/:id/*",
                name: "story-detail",
                moduleId: "./stories/story-detail",
                settings: { auth: true },
            },
            {
                route: "approve-story/:id/*",
                name: "approve-story",
                moduleId: "./stories/approve-story",
            },
            {
                route: "term-detail/:id/*",
                name: "term-detail",
                moduleId: "./stories/story-detail",
                settings: { auth: true },
            },
            {
                route: "help-detail/:id/*",
                name: "help-detail",
                moduleId: "./stories/story-detail",
                settings: { auth: true },
            },
            {
                route: "member-details/:id/*",
                name: "member-details",
                moduleId: "./members/member-detail",
                settings: { auth: true },
            },
            {
                route: "article-details/:id/*",
                name: "article-details",
                moduleId: "./articles/article-detail",
                settings: { auth: true },
            },
            {
                route: "doc-detail/:id/*",
                name: "doc-detail",
                moduleId: "./docs/doc-detail",
            },
            {
                route: "members/new",
                name: "member-creation",
                moduleId: "./members/member-edit",
                title: "members.newMember",
            },
            {
                route: "members/:id/edit",
                name: "member-edit",
                moduleId: "./members/member-edit",
                title: "members.editMember",
            },
            {
                route: "photos/:id/*",
                name: "photo-detail",
                moduleId: "./photos/photo-detail",
                settings: { auth: true },
            },
            {
                route: "access-manager",
                name: "access-manager",
                moduleId: "./admin/access-manager",
            },
            {
                route: "groups-manager",
                name: "groups-manager",
                moduleId: "./groups/groups-manager",
            },
            {
                route: "upload-photo/:group/*",
                name: "upload-photo",
                moduleId: "./groups/upload-photo",
            },
            {
                route: "hit-counts",
                name: "hit-counts",
                moduleId: "./admin/hit-counts",
                settings: { auth: true },
            },
            {
                route: "feedbacks",
                name: "feedbacks",
                moduleId: "./admin/show-feedbacks",
            },
            {
                route: "chats",
                name: "chats",
                moduleId: "./user/chats",
                settings: { auth: true },
            },
            {
                route: "adhoc-scripts",
                name: "adhoc-scripts",
                moduleId: "./admin/adhoc-scripts",
            },
            {
                route: "merge-help-messages",
                name: "merge-help-messages",
                moduleId: "./admin/merge-help-messages",
            },
            {
                route: "show-logs",
                name: "show-logs",
                moduleId: "./admin/show-logs",
            },
            {
                route: "customize",
                name: "customize",
                moduleId: "./admin/customize",
            },
            {
                route: "experiment",
                name: "experiment",
                moduleId: "./experiments/experiment",
            },
            {
                route: "test-db-form",
                name: "test-db-form",
                moduleId: "./experiments/test-db-form",
            },
            {
                route: "black-sheep",
                name: "black-sheep",
                moduleId: "./games/black-sheep/black-sheep",
                settings: { auth: true },
            },
            {
                route: "gbrenner/*",
                name: "gbrenner",
                moduleId: "./gbrenner/gbrenner",
            },
            {
                route: "gallery",
                name: "gallery",
                moduleId: "./gallery/gallery",
                settings: { auth: true },
            },
            {
                route: "annotate-video/:video_id/*",
                name: "annotate-video",
                moduleId: "./videos/annotate-video",
                settings: { auth: true },
            },
            {
                route: "videos/:id/*",
                name: "video-detail",
                moduleId: "./videos/annotate-video",
                settings: { auth: true },
            },
            {
                route: "registered-only",
                name: "registered-only",
                moduleId: "./user/registered-only",
            },
            {
                route: "video-list",
                name: "video-list",
                moduleId: "./videos/videos-old",
            },
        ]);
        this.router = router;
        if (environment.push_state) {
            console.log("router: ", router);
            console.log("location: ", location);
        }
    }

    feedback() {
        this.theme.hide_title = true;
        this.dialog
            .open({ viewModel: Feedback, lock: true })
            .whenClosed((response) => {
                this.theme.hide_title = false;
                if (!response.wasCancelled) {
                    //do something?
                } else {
                    //do something else?
                }
            });
    }

    contact_us() {
        this.theme.hide_title = true;
        this.dialog
            .open({ viewModel: Promote, lock: true })
            .whenClosed((response) => {
                this.theme.hide_title = false;
                if (!response.wasCancelled) {
                    //do something?
                } else {
                    //do something else?
                }
            });
    }

    go_search(event) {
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

    async invoke_search(from_btn: boolean) {
        //this.theme.change_search_debounce(from_btn);
        this.keywords = this.keywords.trim();
        if (this.keywords == "") return;
        let maybe_promise = this.member_list.maybe_a_member(this.keywords);
        let maybe;
        await maybe_promise.then((response) => {
            maybe = response;
        });
        if (maybe) {
            await this.dialog
                .open({ viewModel: SelectSearch, lock: false })
                .whenClosed((response) => {
                    if (response.wasCancelled) {
                        maybe = false;
                    }
                });
            if (maybe) {
                this.router.navigateToRoute("members", {
                    filter: this.keywords,
                });
                return;
            }
        }
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
            this.router.navigateToRoute("stories", { keywords: this.keywords });
        }
    }

    @computedFrom("user.isLoggedIn")
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
        let event = customEvent.detail;
        let el = document.getElementById("nav-items");
        let mrs = el.style.marginRight || "0px";
        mrs = mrs.replace("px", "");
        let mr = parseInt(mrs) - event.dx;
        if (mr > 0) {
            mr = 0;
        }
        el.style.marginRight = `${mr}px`;
    }

    menu_items_shift(mrg) {
        let el1 = document.getElementById("main-search-box");
        let width = el1.offsetWidth;
        let m0 = mrg;
        if (mrg < 0) {
            mrg = width + mrg;
            if (mrg > 0) mrg = 0;
        }
        let el = document.getElementById("nav-items");
        el.style.marginRight = `${mrg}px`;
    }

    create_new_app() {
        this.dialog.open({ viewModel: AddCustomer, lock: true });
    }

    quick_upload_photo() {
        this.router.navigateToRoute("upload-photo", { group: 1 });
    }

    show_gallery() {
        this.router.navigateToRoute("gallery", {});
    }

    show_menu_item(row) {
        if (row.title == "audios.audios" && !this.user.config.support_audio)
            return false;
        if (row.title == "terms.terms" && !this.user.config.terms_enabled)
            return false;
        return true;
    }
}

@autoinject
class AuthorizeStep {
    user: User;

    constructor(user: User) {
        this.user = user;
    }

    run(navigationInstruction, next) {
        if (
            navigationInstruction
                .getAllInstructions()
                .some((i) => i.config.settings.auth)
        ) {
            if (
                this.user &&
                this.user.config.exclusive &&
                !this.user.isLoggedIn
            ) {
                return next.cancel(new Redirect("registered-only"));
            }
        }

        return next();
    }
}
