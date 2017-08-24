import { bindable, autoinject, singleton } from 'aurelia-framework';
import { User } from '../../services/user';
import { MemberGateway } from '../../services/gateway';
import { StoryWindow } from '../../stories/story_window';
import { DialogService } from 'aurelia-dialog';
import { EventAggregator } from 'aurelia-event-aggregator';

@autoinject()
@singleton()
export class HelpCustomElement {
    @bindable topic;
    user;
    api;
    @bindable position = 'top';
    story_info;
    dialog;
    eventAggregator;

    constructor(user: User, api: MemberGateway, dialog: DialogService, eventAggregator: EventAggregator) {
        this.user = user;
        this.api = api;
        this.dialog = dialog;
        this.eventAggregator = eventAggregator;
        this.eventAggregator.subscribe('EditModeChange', payload => this.refresh())
    }

    refresh() {
        let topic = this.topic;
        if (this.user.editing ) {
            topic += '__edit';
        }
        this.api.call_server('help/get_help', { topic: topic })
            .then(response => {
                this.story_info = response.story_info;
            })
    }

    attached() {
        this.refresh();
    }

    edit_help_message() {
        if (!this.user.privileges.HELP_AUTHOR) return;
        this.dialog.open({ viewModel: StoryWindow, model: { story: this.story_info, edit: true }, lock: true }).whenClosed(response => {
            //console.log("response after edit dialog: ", response.output);
        });
    }
}