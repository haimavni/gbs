import environment from './environment';

export class App {
  baseURL;
  min_height;

  constructor() {
    this.baseURL = environment.baseURL;
  }

  attached() {
    let h = window.innerHeight;
    let ci = window.clientInformation;
    console.log("height ", h, " clinet info: ", ci);
    let el1 = document.getElementById("router-view");
    let el2 = document.getElementById("footer");
    console.log("router-view offsets: ", el1.offsetHeight, el1.offsetTop, el1.offsetParent);
    console.log("footer: ", el2.offsetHeight, el2.offsetTop, el2.offsetParent);
    this.min_height = h - el2.offsetHeight;
  }

  public router;
  configureRouter(config, router) {
    router.title = 'gbstories';
    config.map([
      { route: '', redirect: 'home' },
      { route: 'home',                                          moduleId: './home/home',          nav: false,  title: '' },
      { route: 'terms',                                         moduleId: './terms/terms',        nav: true,   title: 'terms.terms' },
      { route: 'photos',                                        moduleId: './photos/photos',      nav: true,   title: 'photos.photos' },
      { route: 'stories',                                       moduleId: './stories/stories',    nav: true,   title: 'stories.stories' },
      { route: 'members',             name: 'members',          moduleId: './members/members',    nav: true,   title: 'members.members' },
      { route: 'member-details/:id',  name: 'member-details',   moduleId: './members/member-detail'},
      { route: 'memmbers/new',        name: 'member-creation',  moduleId: './members/member-edit',             title: 'members.newMember' },
      { route: 'members/:id/edit',    name: 'member-edit',      moduleId: './members/member-edit',             title: 'members.editMember' }
    ]);
    this.router = router;
  }
}
