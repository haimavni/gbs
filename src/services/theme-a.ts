import { DI } from 'aurelia';
import { ICookies } from './cookies';
import { supportsWebp } from './dom_utils';

export const IThemeA = DI.createInterface<IThemeA>('IThemeA', x => x.singleton(ThemeA));
export type IThemeA = ThemeA;

export class ThemeA {
    webpSupported: boolean;

    constructor(@ICookies readonly cookies: ICookies) {
        this.detectWebSupport();

    }

    detectWebSupport() {
        const webpSupported = this.cookies.get('WEBP-SUPPORTED');

        if (webpSupported != 'YES' && webpSupported != 'NO') {
            supportsWebp().then(result => {
                this.webpSupported  = result;
                const s = result ? 'YES' : 'NO';
                this.cookies.put('WEBP-SUPPORTED', s)
            })
        } else {
            this.webpSupported = webpSupported == 'YES';
        }
    }

}
