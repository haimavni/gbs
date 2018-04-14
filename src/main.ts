import { Aurelia } from 'aurelia-framework'
import environment from './environment';
import * as Backend from 'i18next-xhr-backend';
import { Router } from 'aurelia-router';
import { EventAggregator } from 'aurelia-event-aggregator';
import "froala-editor/js/froala_editor.pkgd.min";
import "froala-editor/js/languages/he";

export function configure(aurelia: Aurelia) {
    aurelia.use
        .standardConfiguration()
        .plugin('aurelia-froala-editor')
        .plugin('aurelia-i18n', (i18n) => {
            i18n.i18next.use(Backend);

            return i18n.setup({
                backend: {
                    loadPath: './locales/{{lng}}/{{ns}}' + environment.i18n_ver + '.json',
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
        }).plugin('aurelia-dialog', config => {
            config.useDefaults();
            config.settings.lock = true;
            config.settings.centerHorizontalOnly = true;
            config.settings.startingZIndex = 5;
        })
        .plugin('aurelia-interactjs')
        .plugin('aurelia-bootstrap', config => {
            config.options.accordionCloseOthers = true;
            config.options.accordionGroupPanelClass = 'panel-default';
            config.options.btnLoadingText = 'Loading...';
            config.options.dropdownAutoClose = 'always';
            config.options.paginationBoundaryLinks = false;
            config.options.paginationDirectionLinks = true;
            config.options.paginationFirstText = 'First';
            config.options.paginationHideSinglePage = true;
            config.options.paginationLastText = 'Last';
            config.options.paginationNextText = '>';
            config.options.paginationPreviousText = '<';
            config.options.popoverPosition = 'right';
            config.options.popoverTrigger = 'mouseover';
            config.options.tabsetType = 'tabs';
            config.options.tabsetVertical = false;
            config.options.tooltipClass = 'tooltip';
            config.options.tooltipPosition = 'top';
            config.options.tooltipTrigger = 'mouseover';
            config.options.videoDefaultDisplay = 'inline';
            config.options.videoDefaultWidth = 160;
            config.options.imageDefaultAlign = 'right';
            config.options.imageDefaultDisplay = 'inline';
            config.options.imageDefaultWidth = 100;
            config.options.linkAlwaysBlank = true;
        })
        .feature('polyfills')
        //.plugin('aurelia-slickgrid')
        .feature('resources');

    aurelia.use.globalResources('./services/user');
    aurelia.use.globalResources('./services/cache');
    aurelia.use.globalResources('./services/member_list');
    aurelia.use.globalResources('./services/theme');
    aurelia.use.globalResources('./user/user-mode');

    if (environment.debug) {
        aurelia.use.developmentLogging();
    }

    if (environment.testing) {
        aurelia.use.plugin('aurelia-testing');
    }

    aurelia.start().then(() => aurelia.setRoot());
}
