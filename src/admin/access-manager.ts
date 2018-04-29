import {autoinject, customElement} from "aurelia-framework";

import {GridOptions, RowNode} from "ag-grid";

import NameAndAgeRenderer from "./jsRenderers/NameAndAgeRenderer";

@autoinject()
@customElement('full-width-example')
export class AccessManager {

  private gridOptions: GridOptions;
  agGrid;

  constructor() {
    this.gridOptions = <GridOptions>{};
    this.gridOptions.rowData = this.createRowData();
    this.gridOptions.isFullWidthCell = (rowNode: RowNode)=> {
      return (rowNode.id === "0") || (parseInt(rowNode.id) % 2 === 0);
    };
    this.gridOptions.fullWidthCellRenderer = NameAndAgeRenderer
  }

  private createRowData() {
    return [
      {name: "Bob", age: 10},
      {name: "Harry", age: 3},
      {name: "Sally", age: 20},
      {name: "Mary", age: 5},
      {name: "John", age: 15},
      {name: "Bob", age: 10},
      {name: "Harry", age: 3},
      {name: "Sally", age: 20},
      {name: "Mary", age: 5},
      {name: "John", age: 15},
      {name: "Jack", age: 25},
      {name: "Sue", age: 43},
      {name: "Sean", age: 44},
      {name: "Niall", age: 2},
      {name: "Alberto", age: 32},
      {name: "Fred", age: 53},
      {name: "Jenny", age: 34},
      {name: "Larry", age: 13},
    ];
  }
}
