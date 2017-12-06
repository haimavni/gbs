export function configure(config) {
  config.globalResources([
    './value-converters/filter',
    './value-converters/filter-by-set',
    './value-converters/take',
    './value-converters/filter-visibility',
    './value-converters/filter-gender',
    './elements/multi-select',
    './elements/selector',
    './elements/photo-strip',
    './elements/editable',
    './elements/roller',
    './elements/partial-date',
    './elements/help',
    './elements/copy-to-clipboard',
    './elements/timeline'
  ]);
}
