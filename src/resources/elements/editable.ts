import { bindable, inject, DOM } from 'aurelia-framework';
import { StoryWindow } from '../../stories/story_window';
import { User } from '../../services/user';
import { DialogService } from 'aurelia-dialog';

@inject(DOM.Element, User, DialogService)
export class editableCustomElement {
    @bindable story;
    @bindable settings = { show_date: false, class: 'story-panel', checkable: false };
    element;
    user;
    dialog;
    width;

    constructor(element, user, dialog) {
        this.element = element;
        this.dialog = dialog;
        this.user = user;
    }

    zoom_out(story, what) {
        this.dialog.open({ viewModel: StoryWindow, model: { story: story, edit: what == 'edit' }, lock: what == 'edit' }).whenClosed(response => {
            //console.log("response after edit dialog: ", response.output);
        });

    }

    attached() {
        const elementRect = this.element.getBoundingClientRect();
        this.width = elementRect.width;
    }

    toggle_checked() {
        this.story.checked = !this.story.checked;
        this.dispatch_event();
    }

    dispatch_event() {
        let changeEvent = new CustomEvent('change', {
            detail: {
                checked: this.story.checked,
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }

}
