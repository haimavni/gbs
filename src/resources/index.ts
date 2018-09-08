export function configure(config) {
  config.globalResources([
    './attributes/tapandhold',
    './value-converters/filter',
    './value-converters/filter-by-set',
    './value-converters/take',
    './value-converters/filter-visibility',
    './value-converters/filter-gender',
    './value-converters/sort',
    './value-converters/keeplen',
    './value-converters/format-date',
    './elements/multi-select/multi-select',
    './elements/selector',
    './elements/photo-strip',
    './elements/editable',
    './elements/roller',
    './elements/partial-date',
    './elements/date-range',
    './elements/help',
    './elements/info',
    './elements/timeline',
    './elements/search-input',
    './elements/dlg-string',
    './elements/locale-picker',
    './elements/chats/chatroom-group',
    './elements/chats/chatroom'
  ]);
}
