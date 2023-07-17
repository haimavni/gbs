import { IDialogService } from "@aurelia/dialog";
import environment from "./environment";
import { IMemberGateway } from "./services/gateway";
import { ITheme } from "./services/theme";
import { IUser } from "./services/user";
import { IWatchVersion } from "./services/watch_version";
import { IEventAggregator } from "aurelia";
import { IMisc } from "./services/misc";
import { ICookies } from "./services/cookies";
import { IRouter } from "@aurelia/router";

export class MyApp {
    baseURL: string;
    curr_version: string;

    constructor(
        @ITheme private readonly theme: ITheme,
        @IMemberGateway private readonly api: IMemberGateway,
        @IUser private readonly user: IUser,
        @IWatchVersion private readonly watcher: IWatchVersion,
        @IDialogService private readonly dialog: IDialogService,
        @IEventAggregator private readonly ea: IEventAggregator,
        @IMisc private readonly misc: IMisc,
        @ICookies private readonly cookies: ICookies,
        @IMemberGateway private readonly member_list: IMemberGateway,
        @IRouter private readonly router: IRouter
    ) {
        this.baseURL = environment.baseURL;
        this.curr_version = environment.version || "just now";
        this.ea.subscribe("GOTO-PHOTO-PAGE", (payload) => {
            this.router.load("photos", payload);
        });
    }
}
