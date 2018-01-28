import { autoinject, noView, bindable, InlineViewStrategy } from 'aurelia-framework';
import { Popup } from '../services/popups';

@noView
@autoinject
export class RenderStory {
    html;
    popup;

    constructor(popup: Popup) {
        this.popup = popup;
    }

    activate(html) {
        let pat_str = '(<a .*?)href="(.*?)"(.*?)>(.*?)</a>';
        let pat = new RegExp(pat_str, 'gi');
        html = html.replace(/\n/g, '');
        html = html.replace(pat, function(m, m1, m2, m3, m4){
            console.log("m4=[" + m4 + "]")
            if (m4 == "המשך") return m;
            return m1 + " click.trigger=\"popup_window('POPUP', '"  + m2 + "')\""  + m3 + '>' + m4 + "</a>"
        });
        //apply modifications here
        console.log("html after ", html);
        this.html = '<template>' + html + '</template>';
    }

    popup_window(name, url) {
        this.popup.popup(name, url, "height=800,width=1100,left=100,top=100");
    }

    getViewStrategy() {
        return new InlineViewStrategy(this.html);
    }

}