import { autoinject, computedFrom, bindable, bindingMode } from 'aurelia-framework';

@autoinject
export class EditSideBySide {
    @bindable fixed_str;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) edited_str;
    
    
}
