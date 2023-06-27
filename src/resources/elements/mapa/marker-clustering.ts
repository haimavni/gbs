import { DI } from 'aurelia';
import { IConfigure } from './configure';

export type IMarkerClustering = MarkerClustering;
export const IMarkerClustering = DI.createInterface<IMarkerClustering>(
    "IMarkerClustering",
    (x) => x.singleton(MarkerClustering)
);

export class MarkerClustering {
    private markerClusterer: any;

    constructor(@IConfigure private readonly config: IConfigure) {

    }

    isEnabled() {
        return this.config.get('markerCluster') && this.config.get('markerCluster').enable;
    }

    clearMarkers(){
        if (this.markerClusterer){
            this.markerClusterer.clearMarkers();
        }
    }

    loadScript() {
        if (!this.isEnabled()) {
            return;
        }

        let script = document.createElement('script');

        script.type = 'text/javascript';
        script.src = this.config.get('markerCluster').src;
        document.body.appendChild(script);
    }

    renderClusters(map, markers) {
        if (!this.isEnabled()) {
            return;
        }

        this.markerClusterer = new (<any>window).MarkerClusterer(map, markers, this.config.get('markerCluster'));
    }
}
