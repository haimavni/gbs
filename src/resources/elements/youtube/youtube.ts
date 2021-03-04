import { bindable, inject, DOM, bindingMode, BindingEngine, computedFrom } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Theme } from '../../../services/theme';

@inject(DOM.Element, EventAggregator, BindingEngine, Theme)
export class YoutubeCustomElement {

}
