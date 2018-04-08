export function configure(config) {
  config.globalResources([
    './value-converters/filter',
    './value-converters/filter-by-set',
    './value-converters/take',
    './value-converters/filter-visibility',
    './value-converters/filter-gender',
    './value-converters/sort',
    './elements/multi-select',
    './elements/selector',
    './elements/photo-strip',
    './elements/editable',
    './elements/roller',
    './elements/partial-date',
    './elements/date-range',
    './elements/help',
    './elements/timeline',
    './elements/search-input',
    './elements/dlg-string',
    './elements/locale-picker'
  ]);
}
