import {Aurelia} from 'aurelia-framework'
import environment from './environment';
import * as Backend from 'i18next-xhr-backend';
import {Router} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import "froala-editor/js/froala_editor.pkgd.min";
import "froala-editor/js/languages/he";

export function configure(aurelia: Aurelia) {
    try {
        console.log("location:", location);
        aurelia.use
            .standardConfiguration()
            .plugin('aurelia-froala-editor')
            .plugin('aurelia-i18n', (i18n) => {
                i18n.i18next.use(Backend);
                let locale_base = environment.baseURL == '' ? 'https://tol.life/gbs__master/static/aurelia/' : '.';
                return i18n.setup({
                    backend: {
                        loadPath: locale_base + '/locales/{{lng}}/{{ns}}' + environment.i18n_ver + '.json'
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
                    enabled: !environment.debug,
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
                    enabled: !environment.debug,
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
                    enabled: !environment.debug,
                }
            });
        });

        const google_maps_key = 'AIzaSyA5NfkmdFEz8VEbPhzErqoXpSxiV_zg8WQ';
        const tolife_google_api_key = 'AIzaSyBKvOyX3jtoW10M8Mu6fk6mQvY31lv-xQo';
        aurelia.use
            .plugin('aurelia-google-maps', config => {
                config.options({
                    apiKey: tolife_google_api_key, // use `false` to disable the key
                    clientId: "1234",   //experiment...
                    apiLibraries: 'drawing,geometry,places', //get optional libraries like drawing, geometry, ... - comma seperated list
                    options: {panControl: true, panControlOptions: {position: 9}}, //add google.maps.MapOptions on construct (https://developers.google.com/maps/documentation/javascript/3.exp/reference#MapOptions)
                    language: 'he' || 'en', // default: uses browser configuration (recommended). Set this parameter to set another language (https://developers.google.com/maps/documentation/javascript/localization)
                    region: 'IL' || 'US', // default: it applies a default bias for application behavior towards the United States. (https://developers.google.com/maps/documentation/javascript/localization)
                    markerCluster: {
                        enable: false,
                        src: 'https://cdn.rawgit.com/googlemaps/v3-utility-library/99a385c1/markerclusterer/src/markerclusterer.js', // self-hosting this file is highly recommended. (https://developers.google.com/maps/documentation/javascript/marker-clustering)
                        imagePath: 'https://cdn.rawgit.com/googlemaps/v3-utility-library/tree/master/markerclusterer/images/m', // the base URL where the images representing the clusters will be found. The full URL will be: `{imagePath}{[1-5]}`.`{imageExtension}` e.g. `foo/1.png`. Self-hosting these images is highly recommended. (https://developers.google.com/maps/documentation/javascript/marker-clustering)
                        imageExtension: 'png',
                    }
                });
            });
        /*aurelia.use
            .plugin('aurelia-google-places', config => {
                config.options({
                    apiScriptLoadedEvent: 'aurelia-plugins:google-maps:api-script-loaded', // if loadApiScript is false, the event that is subscribed to, to know when the Google Maps API is loaded by another plugin
                    key: tolife_google_api_key, // your Google API key retrieved from the Google Developer Console
                    //key: google_maps_key,
                    language: 'en' || 'he', // see https://developers.google.com/maps/documentation/javascript/localization
                    apiLibraries: 'places', // see https://developers.google.com/maps/documentation/javascript/libraries
                    loadApiScript: true, // whether or not the <script> tag of the Google Maps API should be loaded
                    options: {types: ['geocode']}, // see https://developers.google.com/maps/documentation/javascript/places-autocomplete#add_autocomplete
                    region: 'IL' || 'US' // see https://developers.google.com/maps/documentation/javascript/localization#Region
                });
            });*/
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
