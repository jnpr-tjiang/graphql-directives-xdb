import { GraphQLField, GraphQLScalarType } from 'graphql';
import { StoreType } from '../XdbSchema';

export interface IDbTable {
  name: string;
  columns: { [name: string]: IDbColumn };
  indices: { [name: string]: IDbIndex };
  toDataView(storeType: StoreType): object;
}

export enum ColumnType {
  CHAR,
  VARCHAR,
  BLOB,
  NUM,
  FLOAT,
  BOOLEAN,
  UUID,
  TIMESTAMP,
  DATE,
}

export interface IDbColumn {
  name: string;
  type: ColumnType;
  size: number;
}

export interface IDbIndex {
  name: string;
  columns: [IDbColumn];
}

export class DbTable implements IDbTable {
  name: string;
  columns: { [name: string]: IDbColumn };
  indices: { [name: string]: IDbIndex };

  public constructor(name: string) {
    this.name = name;
    this.columns = {};
    this.indices = {};
  }

  public addColumn(gqlField: GraphQLField<any, any, any>) {
    if (gqlField.name !== 'metadata' && gqlField.type instanceof GraphQLScalarType) {
      const columnType = this.getColumnType(gqlField.type);
      const defaultSize = this.getDefaultSize(columnType);
      this.columns[gqlField.name] = {
        name: gqlField.name,
        type: columnType,
        size: defaultSize,
      };
    }
  }

  public toDataView(storeType: StoreType): object {
    const columns = [];
    for (const key of Object.keys(this.columns)) {
      const col = this.columns[key];
      columns.push({
        columnDef: this.toColumnDef(storeType, col),
      });
    }
    return {
      name: this.name,
      columns,
    };
  }

  private toColumnDef(storeType: StoreType, col: IDbColumn) {
    switch (col.type) {
      case ColumnType.VARCHAR:
        return `${col.name} varchar(${col.size}) NOT NULL`;
      default:
        return 'unknown';
    }
  }

  private getColumnType(gqlFieldType: GraphQLScalarType): ColumnType {
    let retval: ColumnType;
    switch (gqlFieldType.name) {
      case 'String':
        retval = ColumnType.VARCHAR;
        break;
      case 'Int':
        retval = ColumnType.NUM;
        break;
      case 'Boolean':
        retval = ColumnType.BOOLEAN;
        break;
      case 'Float':
        retval = ColumnType.FLOAT;
        break;
      case 'ID':
        retval = ColumnType.UUID;
        break;
      default:
        throw new TypeError('Unsupported type: ' + gqlFieldType.name);
    }
    return retval;
  }

  private getDefaultSize(type: ColumnType): number {
    let retval: number;
    switch (type) {
      case ColumnType.CHAR:
        retval = 20;
        break;
      case ColumnType.VARCHAR:
        retval = 256;
        break;
      default:
        retval = 0;
    }
    return retval;
  }
}
