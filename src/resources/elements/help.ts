import { bindable, autoinject, singleton, bindingMode } from 'aurelia-framework';
import { User } from '../../services/user';
import { MemberGateway } from '../../services/gateway';
import { Theme } from '../../services/theme';
import { StoryWindow } from '../../stories/story_window';
import { DialogService } from 'aurelia-dialog';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Misc } from '../../services/misc';

@autoinject()
@singleton()
export class HelpCustomElement {
    @bindable topic;
    user;
    api;
    theme;
    misc;
    @bindable position = 'top';
    @bindable({ defaultBindingMode: bindingMode.twoWay }) params;
    @bindable icon = 'question';
    story_info;
    story_text;
    dialog;
    eventAggregator;
    blue = 999;
    editing = false;

    constructor(user: User, api: MemberGateway, dialog: DialogService, eventAggregator: EventAggregator, theme: Theme, misc: Misc) {
        this.user = user;
        this.api = api;
        this.theme = theme;
        this.misc = misc;
        this.dialog = dialog;
        this.eventAggregator = eventAggregator;
        this.eventAggregator.subscribe('EditModeChange', payload => this.refresh())
    }

    refresh() {
        let topic = this.topic;
        this.api.call_server('help/get_help', { topic: topic })
            .then(response => {
                this.story_info = response.story_info;
                this.story_text = this.story_info.story_text;
                if (!this.editing) {
                    this.story_text = this.misc.extrapolate(this.story_text, this.params);
                }
            })
    }

    attached() {
        this.refresh();
    }

    edit_help_message(event) {
        event.stopPropagation();
        this.editing = true;
        if (! this.theme.is_desktop) return;
        let edit = this.user.privileges.HELP_AUTHOR && event.ctrlKey;
        this.theme.hide_title = true;
        this.dialog.open({ viewModel: StoryWindow, model: { story: this.story_info, edit: edit }, lock: edit }).whenClosed(response => {
            this.theme.hide_title = false;
            this.story_text = this.story_info.story_text;
            this.story_text = this.misc.extrapolate(this.story_text, this.params);
            this.editing = false;
        });
    }

}
