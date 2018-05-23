import environment from './environment';
import { autoinject, computedFrom } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Theme } from './services/theme';
import { MemberGateway } from './services/gateway';
import { User } from './services/user';
import { WatchVersion } from './services/watch_version';
import { DialogService } from 'aurelia-dialog';
import { Promote } from './user/promote';


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

    constructor(theme: Theme, api: MemberGateway, user: User, watcher: WatchVersion, dialog: DialogService, ea: EventAggregator) {
        this.baseURL = environment.baseURL;
        this.curr_version = environment.version || "just now";
        this.theme = theme;
        this.api = api;
        this.user = user;
        this.watcher = watcher;
        this.dialog = dialog;
        this.ea = ea;
    }

    attached() {
        let h = window.innerHeight;
        let ci = window.clientInformation;
        let el1 = document.getElementById("router-view");
        let el2 = document.getElementById("footer");
        this.router_view_height = this.theme.height - 60 - 117;
        this.api.hit('APP');
    }

    public router;
    configureRouter(config, router) {
        router.title = 'gbstories';
        config.map([
            { route: '', redirect: 'home' },
            { route: 'home', moduleId: './home/home', nav: false, title: '' },
            { route: 'terms', moduleId: './terms/terms', nav: true, title: 'terms.terms' },
            { route: 'videos', moduleId: './videos/videos', nav: false && environment.debug, title: 'videos.videos' },
            { route: 'photos', moduleId: './photos/photos', nav: true, title: 'photos.photos' },
            { route: 'stories/*', name: 'stories', moduleId: './stories/stories', nav: false, title: 'stories.stories' },
            { route: 'members', name: 'members', moduleId: './members/members', nav: true, title: 'members.members' },
            { route: 'members/:caller_id/*', name: 'associate-members', moduleId: './members/members', nav: false, title: 'members.update-story-members' },
            { route: 'photos-group/:caller_id/*', name: 'associate-photos', moduleId: './photos/photos', nav: false, title: 'photos.update-story-photos' },
            { route: 'story-detail/:id/*', name: 'story-detail', moduleId: './stories/story-detail' },
            { route: 'term-detail/:id/*', name: 'term-detail', moduleId: './stories/story-detail' },
            { route: 'member-details/:id/*', name: 'member-details', moduleId: './members/member-detail' },
            { route: 'memmbers/new', name: 'member-creation', moduleId: './members/member-edit', title: 'members.newMember' },
            { route: 'members/:id/edit', name: 'member-edit', moduleId: './members/member-edit', title: 'members.editMember' },
            { route: 'photos/:id/*', name: 'photo-detail', moduleId: './photos/photo-detail' },
            { route: 'access-manager', name: 'access-manager', moduleId: './admin/access-manager' },
            { route: 'hit-counts', name: 'hit-counts', moduleId: './admin/hit-counts' },
            { route: 'chats', name: 'chats', moduleId: './user/chats' },
            { route: 'adhoc-scripts', name: 'adhoc-scripts', moduleId: './admin/adhoc-scripts' },
            { route: 'show-logs', name: 'show-logs', moduleId: './admin/show-logs' },
            { route: 'experiments', name: 'experiments', moduleId: './experiments/experiment'}
        ]);
        this.router = router;
    }

    contact_us() {
        this.theme.hide_title = true;
        this.dialog.open({ viewModel: Promote, lock: false }).whenClosed(response => {
            this.theme.hide_title = false;
            if (!response.wasCancelled) {
                //do something?
            } else {
                //do something else?
            }
        });
    }

    go_search(ifempty: boolean) {
        if (ifempty && this.keywords) return; //not to duplicate on change
        let keywords = this.keywords;
        //this.keywords = '';
        if (this.router.currentInstruction.config.name == 'stories') {
            this.ea.publish("GO-SEARCH", { keywords: keywords });
        } else {
            this.router.navigateToRoute('stories', { keywords: keywords });
        }
    }

    @computedFrom("user.isLoggedIn")
    get search_input_width() {
        return this.user.isLoggedIn ? 160 : 240;
    }

    clear_keywords() {
        this.keywords = "";
    }

}
