export function configure(config) {
  config.globalResources([
    './value-converters/filter',
    './value-converters/filter-by-set',
    './value-converters/take',
    './elements/multi-select',
    './elements/selector',
    './elements/photo-strip',
    './elements/editable',
    './elements/roller',
    './elements/partial-date',
    './elements/help'
  ]);
}
