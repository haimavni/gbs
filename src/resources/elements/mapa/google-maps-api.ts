import { DI } from "aurelia";
import { IConfigure } from "./configure";

export type IGoogleMapsAPI = GoogleMapsAPI;
export const IGoogleMapsAPI = DI.createInterface<IGoogleMapsAPI>(
    "IGoogleMapsAPI",
    (x) => x.singleton(GoogleMapsAPI)
);

export class GoogleMapsAPI {
    _scriptPromise = null;

    constructor(@IConfigure private readonly config: IConfigure) {}

    getMapsInstance() {
        if (this._scriptPromise !== null) {
            return this._scriptPromise;
        }

        if (
            (<any>window).google === undefined ||
            (<any>window).google.maps === undefined
        ) {
            // google has not been defined yet
            let script = document.createElement("script");

            let params = [
                this.config.get("apiKey")
                    ? `key=${this.config.get("apiKey")}&`
                    : "",
                this.config.get("clientId")
                    ? `clientId=${this.config.get("clientId")}`
                    : "",
                this.config.get("apiLibraries")
                    ? `libraries=${this.config.get("apiLibraries")}`
                    : "",
                this.config.get("language")
                    ? `language=${this.config.get("language")}`
                    : "",
                this.config.get("region")
                    ? `region=${this.config.get("region")}`
                    : "",
                "callback=aureliaGoogleMapsCallback",
            ];

            script.type = "text/javascript";
            script.async = true;
            script.defer = true;
            script.src = `${this.config.get("apiScript")}?${params.join("&")}`;
            document.body.appendChild(script);

            this._scriptPromise = new Promise<void>((resolve, reject) => {
                (<any>window).aureliaGoogleMapsCallback = () => {
                    resolve();
                };
                script.onerror = (error) => {
                    reject(error);
                };
            });

            return this._scriptPromise;
        }

        if ((<any>window).google && (<any>window).google.maps) {
            // google has been defined already, so return an immediately resolved Promise that has scope
            this._scriptPromise = new Promise<void>((resolve) => {
                resolve();
            });

            return this._scriptPromise;
        }

        return false;
    }
}
