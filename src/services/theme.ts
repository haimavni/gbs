import { autoinject, singleton, noView, computedFrom } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { MemberGateway } from '../services/gateway';
import { I18N } from 'aurelia-i18n';
import { Cookies } from './cookies';

const rtl_langs = new Set(['he', 'ar']);
let THEME;

@autoinject()
@singleton()
@noView()
export class Theme {
    api;
    eventAggregator: EventAggregator;
    files: {};
    width = 0;
    height = 0;
    display_header_background = false;
    min_height = 0;
    footer_height = 63;
    cookies;
    _font_size;// = "font-size-110";
    _locale;
    askLanguage = false;
    public rtltr;
    i18n;
    touchScreen = null;
    interact_setting = { interactable: { preventDefault: 'never' } };
    page_title = "";
    hide_title = false;
    _hide_menu = false;
    same_dir;
    other_dir;
    _palette = null;
    palettes = ['palette-default', 'palette-oldie', 'palette-sky', 'palette-earth'];
    _blue_logo = null;
    router_view;
    footer;
    search_debounce = 15000;
    document_title = "";

    constructor(api: MemberGateway, eventAggregator: EventAggregator, cookies: Cookies, i18n: I18N) {
        this.api = api;
        this.cookies = cookies;
        this.eventAggregator = eventAggregator;
        this.api.call_server('photos/get_theme_data')
            .then(response => {
                this.files = response.files;
            });
        window.addEventListener('resize', () => {
            this.handle_content_resize();
        }, true);
        this.i18n = i18n;
        this.set_locale();
        //force locale from cookies if exists
        THEME = this;
        this.detectTouchScreen();
        this.set_heights();
    }

    async set_locale() {
        await this.get_locale_overrides();
        let locale = this.i18n.getLocale();
        if (this.locale != locale) {
            this.i18n.setLocale(this.locale)
        }
        this.rtltr = rtl_langs.has(this.locale) ? "rtl" : "ltr";
        this.same_dir = this.rtltr == "rtl" ? "right" : "left";
        this.other_dir = this.rtltr == "rtl" ? "left" : "right";
        try {
            let userLangs = navigator['languages'];
            //let userLangs = navigator.languages;
            let hasHebrew = userLangs && userLangs.find(lang => lang.startsWith('he'));
            this.askLanguage = !hasHebrew;
        } catch (e) {
            console.log('error occured in theme: ', e);
        }

    }

    language_dir(lang) {
       return  rtl_langs.has(lang) ? "rtl" : "ltr";
    }

    detectTouchScreen() {
        this.touchScreen = this.cookies.get('TOUCH-SCREEN');
        if (this.touchScreen == 'TOUCH-SCREEN') {
            this.interact_setting = { interactable: { preventDefault: 'never' } };
            return;
        }
        if (this.touchScreen == null) {
            window.addEventListener('touchstart', function onFirstTouch() {
                THEME.touchScreen = true;
                THEME.interact_setting = { interactable: { preventDefault: 'never' } };
                window.removeEventListener('touchstart', onFirstTouch, false);
                THEME.cookies.put('TOUCH-SCREEN', 'TOUCH-SCREEN');
            }, false);
        }
    }

    set_heights() {
        let w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        let h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        let result = (w != this.width || h != this.height);
        this.width = w;
        this.height = h;
        this.min_height = this.height - this.footer_height;
        return result;
    }

    handle_content_resize() {
        let changed = this.set_heights();
        if (changed) {
            this.eventAggregator.publish('WINDOW-RESIZED', { width: this.width, height: this.height });
        }
    }

    get font_size() {
        if (!this._font_size) {
            this._font_size = this.cookies.get('FONT-SIZE')
            if (!this._font_size) {
                this._font_size = 'font-size-120';
                this.cookies.put('FONT-SIZE', this._font_size);
            }
        }
        return this._font_size;
    }

    set font_size(size) {
        this._font_size = size;
        this.cookies.put('FONT-SIZE', this._font_size);
    }

    get locale() {
        if (!this._locale) {
            this._locale = this.cookies.get('locale')
            if (!this._locale) {
                this._locale = this.i18n.getLocale();
            }
        }
        return this._locale;
    }

    customize(lang, overrides) {
        this.i18n.i18next.addResourceBundle(lang, 'translation', overrides, true, true);
    }

    get_locale_overrides() {
        this.api.call_server('default/get_locale_overrides')
        .then(response => {
            let obj = response.locale_overrides;
            let langs = Object.keys(obj);
            for (let lang of langs) {
                this.customize(lang, obj[lang]);
                this.i18n.setLocale(this.locale);
            } 
            document.title = this.i18n.tr('app-title');
            this.document_title = document.title;
        });
    }

    set_locale_override(key, value) {
        this.api.call_server_post('default/set_locale_override', {lang: this.i18n.getLocale(), key: key, value: value})
        .then (response => {this.get_locale_overrides()});
    }

    changeLocale(locale) {
        this._locale = locale;
        //todo: merge with locale picker
        this.cookies.put('locale', this._locale);
        this.rtltr = rtl_langs.has(this.locale) ? "rtl" : "ltr";
        return this.i18n.setLocale(locale);
    }

    get palette() {
        if (this._palette===null) {
            this._palette = this.cookies.get('palette')
            if (!this._palette) {
                this._palette = "palette-oldie";
            }
        }
        return this._palette;
    }

    changePalette(palette) {
        this._palette = palette;
        this.cookies.put('palette', this._palette);
    }

    get blue_logo() {
        if (this._blue_logo===null) {
            this._blue_logo = this.cookies.get('blue-logo')
            if (this._blue_logo == null) {
                this._blue_logo = 'blue';
            }
        }
        return this._blue_logo == 'blue';
    }

    changeLogoColor() {
        this._blue_logo =  this._blue_logo == 'blue' ? 'grey' : 'blue'
        this.cookies.put('blue-logo', this._blue_logo);
    }

    change_search_debounce(fromButton: boolean) {
        if (fromButton) {
            this.search_debounce = 15000
        } else {
            this.search_debounce = 1500;
        }
    }

    @computedFrom('width')
    get is_desktop() {
        return this.width >= 1200;
    }

    get hide_menu() {
        return this._hide_menu;
    }

    set hide_menu(val) {
        this._hide_menu = val;
        let el = document.getElementById("router-view");
        if (!el) return;
        if (val) {
            el.classList.add('hide-footer')
        } else {
            el.classList.remove('hide-footer')
        }

    }

}

