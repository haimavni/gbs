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
export class LetterCustomElement {
    @bindable topic;
    user;
    api;
    theme;
    @bindable position = 'top';
    @bindable params = {};
    @bindable button_text = 'groups.edit-letter';
    story_info;
    dialog;
    eventAggregator;
    misc;

    constructor(user: User, api: MemberGateway, dialog: DialogService, eventAggregator: EventAggregator, theme: Theme, misc: Misc) {
        this.user = user;
        this.api = api;
        this.theme = theme;
        this.dialog = dialog;
        this.eventAggregator = eventAggregator;
        this.eventAggregator.subscribe('EditModeChange', payload => this.refresh())
        this.misc = misc;
    }

    refresh() {
        let topic = this.topic;
        return this.api.call_server('letters/get_letter', { topic: topic })
            .then(response => {
                this.story_info = response.story_info;
                if (this.misc.empty_object(this.params)) return;
                let story_text = this.story_info.story_text;
                story_text = story_text.replace(/\$\{.+?\}\$/g, x => this.params[x.substr(2, x.length - 4)]).slice(0);
                this.story_info.story_text = story_text;
            })
    }

    evaluate(s) {
        return this.params[s];
    }

    attached() {
        this.refresh();
    }

    edit_letter(event) {
        event.stopPropagation();
        this.refresh().then(response => {
            if (!this.theme.is_desktop) return;
            let edit = event.ctrlKey || this.misc.empty_object(this.params);
            this.theme.hide_title = true;
            let no_params = this.misc.empty_object(this.params);
            this.dialog.open({ viewModel: StoryWindow, model: { story: this.story_info, edit: edit, dont_save: !no_params, raw: true }, lock: edit }).whenClosed(response => {
                this.theme.hide_title = false;
            });
        });
    }

}

