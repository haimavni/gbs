import { ICookies } from './cookies';
import { supportsWebp} from './dom_utils';
import { DI } from "aurelia";

export type IThemeA = ThemeA;
export const IThemeA = DI.createInterface<IThemeA>(
    "IThemeA",
    (x) => x.singleton(ThemeA)
);

export class ThemeA {
    webpSupported: boolean;

    constructor(@ICookies private readonly cookies: ICookies) {
        this.cookies = cookies;
        this.detectWebSupport();

    }

    detectWebSupport() {
        let webpSupported = this.cookies.get('WEBP-SUPPORTED');
        if (webpSupported != 'YES' && webpSupported != 'NO') {
            supportsWebp().then(result => {
                this.webpSupported  = result;
                let s = result ? 'YES' : 'NO';
                this.cookies.put('WEBP-SUPPORTED', s)
            })
        } else {
            this.webpSupported = webpSupported == 'YES';
        }
    }

}
