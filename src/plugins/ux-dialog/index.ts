import { IContainer, IRegistry, noop } from '@aurelia/kernel';
import { UxDialogBody } from './ux-dialog-body';
import { UxDialogFooter } from './ux-dialog-footer';
import { UxDialogHeader } from './ux-dialog-header';
import { UxDialog } from './ux-dialog';

import './ux-styles.scss';

const DefaultComponents: IRegistry[] = [
    UxDialogBody as unknown as IRegistry,
    UxDialogFooter as unknown as IRegistry,
    UxDialogHeader as unknown as IRegistry,
    UxDialog as unknown as IRegistry,
];

export const UxDialogConfiguration = {
    register(container: IContainer) {
        return container.register(...DefaultComponents);
    }
};
