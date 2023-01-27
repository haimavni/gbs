import { bindable, BindingMode, ICustomElementViewModel } from 'aurelia';
import { IPopup } from '../../services/popups';

export class RenderStoryCustomElement implements ICustomElementViewModel {
    @bindable({ mode: BindingMode.toView }) html = '<h1>BoomBoom</h1>';

    constructor(@IPopup readonly popup: IPopup) {}

    attached() {
        let html = this.html;
        const pat_str = '(<a .*?)href="(.*?)"(.*?)>(.*?)</a>';
        const pat = new RegExp(pat_str, 'gi');
        html = html.replace(/\n/g, '');
        html = html.replace(pat, function (m, m1, m2, m3, m4) {
            return `<a href=${m2} target="_blank">${m4}</a>`;
        });
        //apply modifications here
        this.html = html;
    }

    popup_window(name, url) {
        console.log('enter poppup');
        const w = window.outerWidth - 200;
        const h = window.outerHeight - 200;
        const params = 'height=' + h + ',width=' + w + ',left=100,top=100';
        this.popup.popup(name, url, params);
    }
}
