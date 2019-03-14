import { bindable, inject, DOM, computedFrom } from 'aurelia-framework';
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
        no_expand: false,
        pushable: false
    };
    @bindable info_title = "";
    @bindable info_content = "";
    element;
    user;
    theme;
    dialog;
    width;
    i18n;
    updated_by;

    constructor(element, user, theme, dialog, i18n) {
        this.element = element;
        this.dialog = dialog;
        this.user = user;
        this.theme = theme;
        this.i18n = i18n;
        this.updated_by = this.i18n.tr('stories.updated-by')
    }

    zoom_out(story, what, event) {
        event.stopPropagation(); //todo: attempt to prevent the default selection
        event.preventDefault();
        this.theme.hide_title = true;
        this.dialog.open({ viewModel: StoryWindow, model: { story: story, edit: what == 'edit' }, lock: what == 'edit' }).whenClosed(response => {
            this.theme.hide_title = false;
        });
        return false;
    }

    delete_story(story) {
        this.story.deleted = true;
        this.dispatch_event('delete', 'change', {});
    }

    attached() {
        const elementRect = this.element.getBoundingClientRect();
        this.width = elementRect.width;
        if (!this.settings.divclass) {
            this.settings.divclass = 'editable';
        }
    }

    toggle_checked(event) {
        event.stopPropagation(); //todo: attempt to prevent the default selection
        event.preventDefault();
        this.story.checked = !this.story.checked;
        let keys = { altKey: event.altKey, ctrlKey: event.ctrlKey, shiftKey: event.shiftKey };
        this.dispatch_event('check', 'change', keys);
        return false;
    }

    push_story() {
        this.dispatch_event('pushup', 'pushup', {});
    }

    dispatch_event(action, what, keys) {
        let changeEvent = new CustomEvent(what, {
            detail: {
                checked: this.story.checked,
                action: action,
                keys: keys
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }

    @computedFrom('story.checked')
    get checked() {
        if (this.story) return this.story.checked;
        return false;
    }

}
