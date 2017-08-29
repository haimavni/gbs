import { bindable, autoinject, singleton, bindingMode } from 'aurelia-framework';
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
    @bindable({ defaultBindingMode: bindingMode.twoWay }) params;
    story_info;
    story_text;
    dialog;
    eventAggregator;
    blue = 999;

    constructor(user: User, api: MemberGateway, dialog: DialogService, eventAggregator: EventAggregator) {
        this.user = user;
        this.api = api;
        this.dialog = dialog;
        this.eventAggregator = eventAggregator;
        this.eventAggregator.subscribe('EditModeChange', payload => this.refresh())
    }

    refresh() {
        let topic = this.topic;
        if (this.user.editing) {
            topic += '__edit';
        }
        this.api.call_server('help/get_help', { topic: topic })
            .then(response => {
                this.story_info = response.story_info;
                this.story_text = this.story_info.story_text;
                //this.story_info.story = text.replace(/\$\{.+\}/g, x => eval(x.substr(2,x.length-3)));
                if (!this.user.editing) {
                   this.story_text = this.story_text.replace(/\$\{.+\}/g, x => this.evaluate(x.substr(2, x.length - 3))).slice(0);
                }
                //this.story_info.story_text = text;
            })
    }

    evaluate(s) {
        if (!this.params) {
            return s;
        }
        return eval('this.params.' + s);
        //return s.toUpperCase();
    }

    attached() {
        this.refresh();
    }

    edit_help_message() {
        if (!this.user.privileges.HELP_AUTHOR) return;
        this.dialog.open({ viewModel: StoryWindow, model: { story: this.story_info, edit: true }, lock: true }).whenClosed(response => {
            this.story_text = this.story_info.story_text;
            this.story_text = this.story_text.replace(/\$\{.+\}/g, x => this.evaluate(x.substr(2, x.length - 3))).slice(0);
        });
    }
}