import { Aurelia } from 'aurelia-framework'
import environment from './environment';
import * as Backend from 'i18next-xhr-backend';
import { Router } from 'aurelia-router';
import { EventAggregator } from 'aurelia-event-aggregator';
import "froala-editor/js/froala_editor.pkgd.min";
import "froala-editor/js/languages/he";

export function configure(aurelia: Aurelia) {
    try {
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
            .plugin('aurelia-table')
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
            .feature('resources');

        aurelia.use.globalResources('./services/user');
        aurelia.use.globalResources('./services/cache');
        aurelia.use.globalResources('./services/member_list');
        aurelia.use.globalResources('./services/theme');
        aurelia.use.globalResources('./user/user-mode');

        aurelia.use.plugin('aurelia-google-analytics', config => {
            config.init('UA-141128055-1');
            config.attach({
                logging: {
                    // Set to `true` to have some log messages appear in the browser console.
                    enabled: true
                },
                pageTracking: {
                    // Set to `false` to disable in non-production environments.
                    enabled: ! environment.debug,
                    // Optional. By default it gets the title from payload.instruction.config.title.
                    getTitle: (payload) => {
                        // For example, if you want to retrieve the tile from the document instead override with the following.
                        return document.title;
                    },
                    // Optional. By default it gets the URL fragment from payload.instruction.fragment.
                    getUrl: (payload) => {
                        // For example, if you want to get full URL each time override with the following.
                        return window.location.href;
                    }
                },
                clickTracking: {
                    // Set to `false` to disable in non-production environments.
                    enabled: ! environment.debug,
                    // Optional. By default it tracks clicks on anchors and buttons.
                    filter: (element) => {
                        // For example, if you want to also track clicks on span elements override with the following.
                        return element instanceof HTMLElement &&
                            (element.nodeName.toLowerCase() === 'a' ||
                                element.nodeName.toLowerCase() === 'button' ||
                                element.nodeName.toLowerCase() === 'span');
                    }
                },
                exceptionTracking: {
                    // Set to `false` to disable in non-production environments.
                    enabled: ! environment.debug,
                }
            });
        });        

        if (environment.debug) {
            aurelia.use.developmentLogging();
        }

        if (environment.testing) {
            aurelia.use.plugin('aurelia-testing');
        }
    } catch (ex) {
        console.log(ex);
    }

    aurelia.start().then(() => aurelia.setRoot()).catch(ex => console.log(ex));
}
