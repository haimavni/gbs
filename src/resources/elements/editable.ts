import { bindable, inject, DOM } from 'aurelia-framework';
import { StoryWindow } from '../../stories/story_window';
import { User } from '../../services/user';
import { Theme } from '../../services/theme';
import { DialogService } from 'aurelia-dialog';

@inject(DOM.Element, User, Theme, DialogService)
export class editableCustomElement {
    @bindable story;
    @bindable settings = { show_date: false, class: 'story-panel', checkable: false, deletable: false, no_expand: false };
    element;
    user;
    theme;
    dialog;
    width;

    constructor(element, user, theme,  dialog) {
        this.element = element;
        this.dialog = dialog;
        this.user = user;
        this.theme = theme;
    }

    zoom_out(story, what) {
        this.theme.hide_title = true;
        this.dialog.open({ viewModel: StoryWindow, model: { story: story, edit: what == 'edit' }, lock: what == 'edit' }).whenClosed(response => {
            this.theme.hide_title = false;
        });

    }

    delete_story(story) {
        this.story.deleted = true;
        this.dispatch_event('delete');
    }

    attached() {
        const elementRect = this.element.getBoundingClientRect();
        this.width = elementRect.width;
    }

    toggle_checked() {
        this.story.checked = !this.story.checked;
        this.dispatch_event('check');
    }

    dispatch_event(action) {
        let changeEvent = new CustomEvent('change', {
            detail: {
                checked: this.story.checked,
                action: action
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }

}
