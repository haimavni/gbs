/* eslint-disable @typescript-eslint/no-this-alias */
import { IMemberGateway } from '../services/gateway';
import { I18N } from '@aurelia/i18n';
import { ICookies } from './cookies';
import { IDialogService } from '@aurelia/dialog';
import { DI, IEventAggregator } from "aurelia";

const rtl_langs = new Set(['he', 'ar']);
let THEME;

export const ITheme = DI.createInterface<ITheme>('ITheme', x => x.singleton(Theme));
export type ITheme = Theme;


export class Theme {
    files;
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

    constructor(@IMemberGateway readonly api: IMemberGateway, @IEventAggregator readonly eventAggregator: IEventAggregator, @ICookies cookies: ICookies,@I18N readonly i18n: I18N, @IDialogService readonly dialog: IDialogService) {
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
        this.dialog = dialog;
        this.eventAggregator.subscribe('router:navigation:complete', response => {
            this.dialog.closeAll();
        })
    }

    async set_locale() {
        await this.get_locale_overrides();
        const locale = this.i18n.getLocale();

        if (this.locale != locale) {
            this.i18n.setLocale(this.locale)
        }

        this.rtltr = rtl_langs.has(this.locale) ? "rtl" : "ltr";
        this.same_dir = this.rtltr == "rtl" ? "right" : "left";
        this.other_dir = this.rtltr == "rtl" ? "left" : "right";

        try {
            const userLangs = navigator['languages'];
            //let userLangs = navigator.languages;
            const hasHebrew = userLangs && userLangs.find(lang => lang.startsWith('he'));
            this.askLanguage = !hasHebrew;
        } catch (e) {
            console.log('error occured in theme: ', e);
        }

    }

    language_dir(lang) {
        if (!lang) return this.rtltr;
        return rtl_langs.has(lang) ? "rtl" : "ltr";
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
        const w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        const result = (w != this.width || h != this.height);
        this.width = w;
        this.height = h;
        this.min_height = this.height - this.footer_height;
        return result;
    }

    handle_content_resize() {
        const changed = this.set_heights();
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
                const obj = response.locale_overrides;
                const langs = Object.keys(obj);
                for (const lang of langs) {
                    this.customize(lang, obj[lang]);
                    this.i18n.setLocale(this.locale);
                }
                document.title = this.i18n.tr('app-title');
                this.document_title = document.title;
            });
    }

    set_locale_override(key, value) {
        this.api.call_server_post('default/set_locale_override', { lang: this.i18n.getLocale(), key: key, value: value })
            .then(response => { this.get_locale_overrides() });
    }

    changeLocale(locale) {
        this._locale = locale;
        //todo: merge with locale picker
        this.cookies.put('locale', this._locale);
        this.rtltr = rtl_langs.has(this.locale) ? "rtl" : "ltr";
        return this.i18n.setLocale(locale);
    }

    get palette() {
        if (this._palette === null) {
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
        if (this._blue_logo === null) {
            this._blue_logo = this.cookies.get('blue-logo')
            if (this._blue_logo == null) {
                this._blue_logo = 'blue';
            }
        }
        return this._blue_logo == 'blue';
    }

    changeLogoColor() {
        this._blue_logo = this._blue_logo == 'blue' ? 'grey' : 'blue'
        this.cookies.put('blue-logo', this._blue_logo);
    }

    change_search_debounce(fromButton: boolean) {
        if (fromButton) {
            this.search_debounce = 15000
        } else {
            this.search_debounce = 1500;
        }
    }

    get is_desktop() {
        return this.width >= 1200;
    }

    get hide_menu() {
        return this._hide_menu;
    }

    set hide_menu(val) {
        this._hide_menu = val;
        const el = document.getElementById("router-view");
        if (!el) return;
        if (val) {
            el.classList.add('hide-footer')
        } else {
            el.classList.remove('hide-footer')
        }

    }

    froala_key() {
        const tol_key = "GF1B2C1A16A1B2pD1D1D1C4E1J4A16B3D8B4klvvI2ptxz==";
        const lifestone_key = "qA2F1G1I2A2D3lA6F6D5G4A1D3C10A3A5F6gptxzsummaG4oinf==";
        //let tolife_key = "WD7C5F4H5E3H3c1A6B5A4C3A3B2C2G3C5A4D-17B-13ffbjhA11A-16yew==";
        const host = window.location.hostname;
        if (host == "tol.life") return tol_key;
        if (host == "lifestone.info") return lifestone_key;
        //if (host == "tolife.site") return tolife_key;
        //key for tol.life version3/4:
        //GPD2tA17A1B3D4B2E2sdB-7I-7A2xA-16prdC3E3G3A6B6B5A4E4E3B1==
        //key for lifestone.info version3/4:
        //qc1H2pH2A2A1A5B6C5oxI-8prkmuuyC2wqfnD-13C3B2E2E2E3B1A2C7D2F3==
    }

}

