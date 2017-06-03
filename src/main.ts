import { Aurelia } from 'aurelia-framework'
import environment from './environment';
import * as Backend from 'i18next-xhr-backend';
import { Router } from 'aurelia-router';
import { EventAggregator } from 'aurelia-event-aggregator';

export function configure(aurelia: Aurelia) {
  aurelia.use
    .standardConfiguration()
    .plugin('aurelia-froala-editor')
    .plugin('aurelia-i18n', (i18n) => {
      i18n.i18next.use(Backend);

      return i18n.setup({
        backend: {
          loadPath: './locales/{{lng}}/{{ns}}.json',
        },
        lng: 'he',
        fallbackLng: 'he',
        debug: environment.debug
      }).then(() => {
        const router = aurelia.container.get(Router);
        const events = aurelia.container.get(EventAggregator);

        router.transformTitle = title => i18n.tr(title);
        events.subscribe('i18n:locale:changed', () => { router.updateTitle(); });
      });
    })
    .plugin('aurelia-dialog')
    .feature('resources');

  aurelia.use.globalResources('./services/user');
  aurelia.use.globalResources('./services/member_list');
  aurelia.use.globalResources('./user/user-mode');

  if (environment.debug) {
    aurelia.use.developmentLogging();
  }

  if (environment.testing) {
    aurelia.use.plugin('aurelia-testing');
  }

  aurelia.start().then(() => aurelia.setRoot());
}
