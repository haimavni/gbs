import { autoinject, noView, bindable, InlineViewStrategy } from 'aurelia-framework';

@noView
@autoinject
export class RenderStory {
    html;

    activate(html) {
        //apply modifications here
        //html = '<button click.trigger="test()">Test me</button>' + html + '</strong>';
        this.html = '<template>' + html + '</template>';
    }

    /*test() {
        alert('hihi')
    }*/

    getViewStrategy() {
        return new InlineViewStrategy(this.html);
    }

}