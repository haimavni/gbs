import environment from './environment';
import { autoinject } from 'aurelia-framework';
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

    constructor(theme: Theme, api: MemberGateway, user: User, watcher: WatchVersion, dialog: DialogService) {
        this.baseURL = environment.baseURL;
        this.curr_version = environment.version || "just now";
        this.theme = theme;
        this.api = api;
        this.user = user;
        this.watcher = watcher;
        this.dialog = dialog;
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
            { route: 'videos', moduleId: './videos/videos', nav: environment.debug, title: 'videos.videos' },
            { route: 'photos', moduleId: './photos/photos', nav: true, title: 'photos.photos' },
            { route: 'stories', name: 'stories', moduleId: './stories/stories', nav: true, title: 'stories.stories' },
            { route: 'members', name: 'members', moduleId: './members/members', nav: true, title: 'members.members' },
            { route: 'members/:caller_id/*', name: 'associate-members', moduleId: './members/members', nav: false, title: 'members.update-story-members' },
            { route: 'photos-group/:caller_id/*', name: 'associate-photos', moduleId: './photos/photos', nav: false, title: 'photos.update-story-photos' },
            { route: 'story-detail/:id/*', name: 'story-detail', moduleId: './stories/story-detail' },
            { route: 'term-detail/:id/*', name: 'term-detail', moduleId: './stories/story-detail' },
            { route: 'member-details/:id/*', name: 'member-details', moduleId: './members/member-detail' },
            { route: 'memmbers/new', name: 'member-creation', moduleId: './members/member-edit', title: 'members.newMember' },
            { route: 'members/:id/edit', name: 'member-edit', moduleId: './members/member-edit', title: 'members.editMember' },
            { route: 'photos/:id/*', name: 'photo-detail', moduleId: './photos/photo-detail' },
            { route: 'access-manager', name: 'access-manager', moduleId: './user/access-manager'},
            { route: 'hit-counts', name: 'hit-counts', moduleId: './user/hit-counts'},
            { route: 'chats', name: 'chats', moduleId: './user/chats'},
            { route: 'adhoc-scripts', name: 'adhoc-scripts', moduleId: './admin/adhoc-scripts'}
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

}
