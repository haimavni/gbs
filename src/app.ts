import environment from './environment';
import { autoinject, computedFrom } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Theme } from './services/theme';
import { MemberGateway } from './services/gateway';
import { User } from './services/user';
import { WatchVersion } from './services/watch_version';
import { DialogService } from 'aurelia-dialog';
import { Promote } from './user/promote';
import { Feedback } from './user/feedback';
import { NONAME } from 'dns';
import { AddCustomer } from './admin/add_customer';

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

    constructor(theme: Theme, api: MemberGateway, user: User, watcher: WatchVersion, dialog: DialogService, ea: EventAggregator) {
        this.baseURL = environment.baseURL;
        this.curr_version = environment.version || "just now";
        this.theme = theme;
        this.api = api;
        this.user = user;
        this.watcher = watcher;
        this.dialog = dialog;
        this.ea = ea;
        this.ea.subscribe('GOTO-PHOTO-PAGE', payload => {
            this.router.navigateToRoute('photos', payload);
        });
    }

    attached() {
        this.router_view_height = this.theme.height - 60 - 117;
        this.api.hit('APP');
    }

    public router;
    configureRouter(config, router) {
        router.title = 'app-title';
        config.map([
            { route: '', redirect: 'home' },
            { route: 'home', moduleId: './home/home', nav: false, title: '' },
            { route: 'docs', moduleId: './docs/docs', nav: true, title: 'docs.docs' },
            { route: 'terms', moduleId: './terms/terms', nav: true, title: 'terms.terms' },
            { route: 'audios/*', name: 'audios', moduleId: './audios/audios', nav: true, title: 'audios.audios' },
            { route: 'videos', moduleId: './videos/videos', nav: true, title: 'videos.videos' },
            { route: 'photos/*', name: 'photos', moduleId: './photos/photos', nav: true, title: 'photos.photos' },
            { route: 'stories', name: 'stories', moduleId: './stories/stories', nav: true, title: 'stories.stories' },
            //{ route: 'stories-tool/*', name: 'stories', moduleId: './stories/stories', nav: false, title: 'stories.stories' },
            { route: 'members', name: 'members', moduleId: './members/members', nav: true, title: 'members.members' },
            { route: 'members/:caller_id/*', name: 'associate-members', moduleId: './members/members', nav: false, title: 'members.update-story-members' },
            { route: 'photos-group/:caller_id/*', name: 'associate-photos', moduleId: './photos/photos', nav: false, title: 'photos.update-story-photos' },
            { route: 'story-detail/:id/*', name: 'story-detail', moduleId: './stories/story-detail' },
            { route: 'term-detail/:id/*', name: 'term-detail', moduleId: './stories/story-detail' },
            { route: 'help-detail/:id/*', name: 'help-detail', moduleId: './stories/story-detail' },
            { route: 'member-details/:id/*', name: 'member-details', moduleId: './members/member-detail' },
            { route: 'memmbers/new', name: 'member-creation', moduleId: './members/member-edit', title: 'members.newMember' },
            { route: 'members/:id/edit', name: 'member-edit', moduleId: './members/member-edit', title: 'members.editMember' },
            { route: 'photos/:id/*', name: 'photo-detail', moduleId: './photos/photo-detail' },
            { route: 'access-manager', name: 'access-manager', moduleId: './admin/access-manager' },
            { route: 'groups-manager', name: 'groups-manager', moduleId: './admin/groups-manager' },
            { route: 'hit-counts', name: 'hit-counts', moduleId: './admin/hit-counts' },
            { route: 'feedbacks', name: 'feedbacks', moduleId: './admin/show-feedbacks' },
            { route: 'chats', name: 'chats', moduleId: './user/chats' },
            { route: 'adhoc-scripts', name: 'adhoc-scripts', moduleId: './admin/adhoc-scripts' },
            { route: 'show-logs', name: 'show-logs', moduleId: './admin/show-logs' },
            { route: 'customize', name: 'customize', moduleId: './admin/customize' },
            { route: 'experiments', name: 'experiments', moduleId: './experiments/experiment' },
            { route: 'black-sheep', name: 'black-sheep', moduleId: './games/black-sheep/black-sheep' },
            { route: 'gbrenner/*', name: 'gbrenner', moduleId: './gbrenner/gbrenner'},
            { route: 'gallery', name: 'gallery', moduleId: './gallery/gallery'}
        ]);
        this.router = router;
    }

    feedback() {
        this.theme.hide_title = true;
        this.dialog.open({ viewModel: Feedback, lock: true }).whenClosed(response => {
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
        this.dialog.open({ viewModel: Promote, lock: true }).whenClosed(response => {
            this.theme.hide_title = false;
            if (!response.wasCancelled) {
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
        if (event.keyCode == 13) return this.invoke_search(true);
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
        if (this.clear_keywords_timeout) clearTimeout(this.clear_keywords_timeout);
        this.clear_keywords_timeout = setTimeout(() => {this.clear_keywords()}, 60000);
        if (this.router.currentInstruction.config.name == 'stories') {
            this.ea.publish("GO-SEARCH", { keywords: this.keywords });
        } else {
            this.router.navigateToRoute('stories', { keywords: this.keywords });
        }
    }

    @computedFrom("user.isLoggedIn")
    get search_input_width() {
        return this.user.isLoggedIn ? 160 : 240;
    }

    clear_keywords() {
        this.keywords = "";
    }

    drag_menu_items(customEvent) {
        let event = customEvent.detail;
        let el = document.getElementById("nav-items");
        let mrs = el.style.marginRight || "0px";
        mrs = mrs.replace('px', '');
        let mr = parseInt(mrs) - event.dx;
        if (mr > 0) {mr = 0;}
        el.style.marginRight = `${mr}px`;
    }

    create_new_app() {
        this.dialog.open({ viewModel: AddCustomer, lock: true})
    }

}
