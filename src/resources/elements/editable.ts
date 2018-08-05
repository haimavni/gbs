import { bindable, inject, DOM } from 'aurelia-framework';
import { StoryWindow } from '../../stories/story_window';
import { User } from '../../services/user';
import { Theme } from '../../services/theme';
import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';

@inject(DOM.Element, User, Theme, DialogService, I18N)
export class editableCustomElement {
    @bindable story;
    @bindable settings = {
        show_date: false,
        show_time: false, 
        show_author: true,
        class: 'story-panel', 
        divclass: null, 
        checkable: false, 
        deletable: false, 
        no_expand: false };
    element;
    user;
    theme;
    dialog;
    width;
    i18n;
    updated_by;

    constructor(element, user, theme,  dialog, i18n) {
        this.element = element;
        this.dialog = dialog;
        this.user = user;
        this.theme = theme;
        this.i18n = i18n;
        this.updated_by = this.i18n.tr('stories.updated-by')
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
        if (! this.settings.divclass) {
            this.settings.divclass = 'editable';
        }
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
