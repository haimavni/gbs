import { DialogService } from 'aurelia-dialog';
import { inject, DOM, noView, bindable, InlineViewStrategy, bindingMode } from 'aurelia-framework';
import { CustomDialog } from '../../services/custom-dialog';

@inject(DOM.Element, DialogService)
export class DlgStringCustomElement {
    @bindable title;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) str;
    @bindable placeholder;
    @bindable anchor;
    element;
    dialogService: DialogService;

    constructor(element, dialogService: DialogService) {
        this.element = element;
        this.dialogService = dialogService
    }

    inputString() {
        let model = {
            title: this.title,
            placeholder: this.placeholder,
            str: this.str,
            html: `<template>
                        <div style="background-color:beige;padding:20px;">
                        <h3 style="width:100%; margin-bottom:12px;text-align:center;">\${model.title}</h3>
                        <form class="form-inline" dir="rtl">
                            <input type="text" value.bind="model.str" placeholder.bind="model.placeholder" style="margin:15px;padding:6px;">
                            <button click.trigger="controller.ok(model.str)" style="margin:15px"><i class="fa fa-check"></i></button>
                        </form>
                        </div>
                </template>`
        }
        this.dialogService.open({ viewModel: CustomDialog, model: model, lock: false })
            .whenClosed(response => {
                if (!response.wasCancelled) {
                    this.str = model.str;
                    this.dispatch_event();
                } else {
                }

            });
    }

    dispatch_event() {
        let changeEvent = new CustomEvent('change', {
            detail: {
                string_value: this.str
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }


}
