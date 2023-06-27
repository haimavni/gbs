import { IContainer, IRegistry, noop } from '@aurelia/kernel';
import { ConfigInterface, IConfigure } from './configure';
import { GoogleMaps } from './google-maps';

export { GoogleMaps } from './google-maps';
export { IConfigure } from './configure';
export { IMarkerClustering } from './marker-clustering';

const DefaultComponents: IRegistry[] = [
    GoogleMaps as unknown as IRegistry,
];

function createGoogleMapsConfiguration(options: Partial<ConfigInterface>) {
    return {
        register(container: IContainer) {
            const configClass = container.get(IConfigure);

            configClass.options(options);

            return container.register(...DefaultComponents)
        },
        configure(options: ConfigInterface) {
            return createGoogleMapsConfiguration(options);
        }
    };
}

export const GoogleMapsConfiguration = createGoogleMapsConfiguration({});
