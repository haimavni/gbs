import {
    bindable,
    IDialogService,
    IEventAggregator,
    BindingMode,
} from 'aurelia';
import { IUser } from '../../services/user';
import { IMemberGateway } from '../../services/gateway';
import { ITheme } from '../../services/theme';
import { StoryWindow } from '../../stories/story_window';
import { IMisc } from '../../services/misc';

export class HelpCustomElement {
    @bindable topic;
    @bindable position = 'top';
    @bindable({ mode: BindingMode.twoWay }) params;
    @bindable icon = 'question';
    story_info;
    story_text;
    blue = 999;
    editing = false;

    constructor(
        @IUser readonly user: IUser,
        @IMemberGateway readonly api: IMemberGateway,
        @IDialogService readonly dialog: IDialogService,
        @IEventAggregator readonly eventAggregator: IEventAggregator,
        @ITheme readonly theme: ITheme,
        @IMisc readonly misc: IMisc
    ) {
        this.eventAggregator.subscribe('EditModeChange', (payload) =>
            this.refresh()
        );
    }

    refresh() {
        const topic = this.topic;

        this.api
            .call_server('help/get_help', { topic: topic })
            .then((response) => {
                this.story_info = response.story_info;
                this.story_text = this.story_info.story_text;
                if (!this.editing) {
                    this.story_text = this.misc.extrapolate(
                        this.story_text,
                        this.params
                    );
                }
            });
    }

    attached() {
        this.refresh();
    }

    edit_help_message(event) {
        event.stopPropagation();
        this.editing = true;
        if (!this.theme.is_desktop) return;
        const edit = this.user.privileges.HELP_AUTHOR && event.ctrlKey;
        this.theme.hide_title = true;
        this.dialog
            .open({
                component: () => StoryWindow,
                model: { story: this.story_info, edit: edit },
                lock: edit,
            })
            .whenClosed((response) => {
                this.theme.hide_title = false;
                this.story_text = this.story_info.story_text;
                this.story_text = this.misc.extrapolate(
                    this.story_text,
                    this.params
                );
                this.editing = false;
            });
    }
}
