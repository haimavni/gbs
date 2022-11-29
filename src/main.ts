import Aurelia from "aurelia";
import { RouterConfiguration } from "@aurelia/router";
import { DialogDefaultConfiguration } from "@aurelia/runtime-html";
import { I18nConfiguration } from "@aurelia/i18n";
import Fetch from "i18next-fetch-backend";

import { MyApp } from "./my-app";
import { GoogleMapsConfiguration } from "aurelia2-google-maps";

const lst = location.href.split("/");
const app = lst[3];
const google_maps_key = "AIzaSyA5NfkmdFEz8VEbPhzErqoXpSxiV_zg8WQ";
const tolife_google_api_key = "AIzaSyBKvOyX3jtoW10M8Mu6fk6mQvY31lv-xQo";

Aurelia.register(
    RouterConfiguration.customize({
        useUrlFragmentHash: false,
        useHref: false,
        useDirectRouting: false,
    }),
    DialogDefaultConfiguration.customize((settings) => {
        settings.lock = true;
        settings.startingZIndex = 5;
    }),
    I18nConfiguration.customize((options) => {
        options.initOptions = {
            plugins: [Fetch],
            backend: {
                loadPath: "/locales/{{lng}}/{{ns}}.json",
            },
        };
    }),
    GoogleMapsConfiguration.configure({
        apiKey: tolife_google_api_key, // use `false` to disable the key
        apiLibraries: "drawing,geometry,places", //get optional libraries like drawing, geometry, ... - comma seperated list
        options: { panControl: true, panControlOptions: { position: 9 } }, //add google.maps.MapOptions on construct (https://developers.google.com/maps/documentation/javascript/3.exp/reference#MapOptions)
        language: "he" || "en", // default: uses browser configuration (recommended). Set this parameter to set another language (https://developers.google.com/maps/documentation/javascript/localization)
        region: "IL" || "US", // default: it applies a default bias for application behavior towards the United States. (https://developers.google.com/maps/documentation/javascript/localization)
        markerCluster: {
            enable: false,
            src: "https://cdn.rawgit.com/googlemaps/v3-utility-library/99a385c1/markerclusterer/src/markerclusterer.js", // self-hosting this file is highly recommended. (https://developers.google.com/maps/documentation/javascript/marker-clustering)
            imagePath:
                "https://cdn.rawgit.com/googlemaps/v3-utility-library/tree/master/markerclusterer/images/m", // the base URL where the images representing the clusters will be found. The full URL will be: `{imagePath}{[1-5]}`.`{imageExtension}` e.g. `foo/1.png`. Self-hosting these images is highly recommended. (https://developers.google.com/maps/documentation/javascript/marker-clustering)
            imageExtension: "png",
        },
    })
)
    .app(MyApp)
    .start();
