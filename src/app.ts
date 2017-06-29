import environment from './environment';

export class App {
  baseURL;

  constructor() {
    this.baseURL = environment.baseURL;
  }

  public router;
  configureRouter(config, router) {
    router.title = 'gbstories';
    config.map([
      { route: '', redirect: 'home' },
      { route: 'home',                                          moduleId: './home/home',       nav: false,  title: '' },
      { route: 'terms',                                         moduleId: './terms/terms',      nav: true,   title: 'terms.terms' },
      { route: 'photos',                                        moduleId: './photos/photos',     nav: true,   title: 'photos.photos' },
      { route: 'stories',                                       moduleId: './stories/stories',    nav: true,   title: 'stories.stories' },
      { route: 'members',             name: 'members',          moduleId: './members/members',    nav: true,   title: 'members.members' },
      { route: 'member-details/:id',  name: 'member-details',   moduleId: './members/member-detail'},
      { route: 'memmbers/new',        name: 'member-creation',  moduleId: './members/member-edit',             title: 'members.newMember' },
      { route: 'members/:id/edit',    name: 'member-edit',      moduleId: './members/member-edit',             title: 'members.editMember' }
    ]);
    this.router = router;
  }
}
/*
      { route: 'contacts/:id/photo', name: 'contact-photo', moduleId: 'contact-photo' },
*/