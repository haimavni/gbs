import { bindable, IDialogService, INode } from 'aurelia';
import { StoryWindow } from '../../stories/story_window';
import { IUser } from '../../services/user';
import { ITheme } from '../../services/theme';
import { I18N } from '@aurelia/i18n';

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
        pushable: false,
        pinnable: false,
        confirmable: false,
        has_details: false,
    };

    @bindable info_title = '';
    @bindable info_content = '';
    @bindable pinned = false;
    width;
    updated_by;

    constructor(
        @INode readonly element: HTMLElement,
        @IUser readonly user: IUser,
        @ITheme readonly theme: ITheme,
        @IDialogService readonly dialog: IDialogService,
        @I18N readonly i18n: I18N
    ) {
        this.element = element;
        this.dialog = dialog;
        this.user = user;
        this.theme = theme;
        this.i18n = i18n;
        this.updated_by = this.i18n.tr('stories.updated-by');
    }

    zoom_out(story, what, event) {
        event.stopPropagation(); //todo: attempt to prevent the default selection
        event.preventDefault();
        this.theme.hide_title = true;
        this.dialog
            .open({
                component: () => StoryWindow,
                model: { story: story, edit: what == 'edit' },
                lock: what == 'edit',
            })
            .whenClosed((response) => {
                this.theme.hide_title = false;
                this.dispatch_event('saved', 'saved', {});
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

        const keys = {
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
        };

        this.dispatch_event('check', 'change', keys);

        return false;
    }

    push_story() {
        this.dispatch_event('pushup', 'pushup', {});
    }

    approve_story() {
        this.dispatch_event('confirm', 'confirm', {});
    }

    pin_story() {
        this.dispatch_event('pin', 'pin', {});
    }

    view_details(story) {
        this.dispatch_event('view_details', 'view_details', {});
    }

    dispatch_event(action, what, keys) {
        const changeEvent = new CustomEvent(what, {
            detail: {
                checked: this.story.checked,
                action: action,
                keys: keys,
            },
            bubbles: true,
        });
        this.element.dispatchEvent(changeEvent);
    }

    get checked() {
        if (this.story) return this.story.checked;
        return false;
    }

    get story_name() {
        if (this.story) return this.story.name;
        return this.i18n.tr('stories.new-story');
    }
}
