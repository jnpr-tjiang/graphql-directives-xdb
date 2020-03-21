import { ITypedef, makeExecutableSchema } from 'graphql-tools';
import gql from 'graphql-tag';
import * as mustache from 'mustache';
import { GraphQLSchema } from 'graphql/type';
import { mysqlTemplate } from './sql/mysql.mustache';
import { getSchemaDirectives } from './getSchemaDirectives';
import { resolvers } from './resolvers';
import { IDbTable } from './sql/DbTable';

const baseSchema = gql`
  directive @xdbEntity on OBJECT
  directive @xdbParent on FIELD_DEFINITION
  directive @xdbChildren on FIELD_DEFINITION
  directive @xdbRefOneToMany on FIELD_DEFINITION
  directive @xdbRefManyToOne on FIELD_DEFINITION
  directive @xdbRefManyToMany on FIELD_DEFINITION

  type Metadata {
    uuid: String
    version: Int
    startSID: Int
    endSID: Int
    name: String
    type: String
  }

  interface Entity {
    metadata: Metadata!
  }

  type Query {
    getEntityById(type: String, uuid: String, dbSnapshot: Int = NULL): Entity
  }
`;

const dbSchemaTemplates = {
  mysql: mysqlTemplate,
  pgsql: ``,
  sqlite: ``,
};

export enum StoreType {
  MYSQL = 'mysql',
  PGSQL = 'postgres',
  SQLITE = 'sqlite',
}

export interface IXdbSchemaInput {
  schemas: ITypedef[];
  dbInfo: {
    dbType: StoreType;
    dbName: string;
    dbUser: string;
    dbPass: string;
  };
}

export class XdbSchema {
  private input: IXdbSchemaInput;
  private sql!: string;
  private executableSchema!: GraphQLSchema;
  private dbTables: {
    [name: string]: IDbTable;
  };

  public constructor(input: IXdbSchemaInput) {
    this.input = input;
    this.sql = '';
    this.dbTables = {};
  }

  public addTable(table: IDbTable) {
    this.dbTables[table.name] = table;
  }

  public getTable(name: string): IDbTable {
    return this.dbTables[name];
  }

  public getBaseGraphQLSchema(): string {
    return baseSchema.toString();
  }

  public toGraphQLTypeDefs(): ITypedef[] {
    return this.input.schemas.concat(baseSchema);
  }

  public toDbSchema(): string {
    if (this.sql === '') {
      this.executableSchema = makeExecutableSchema({
        typeDefs: this.toGraphQLTypeDefs(),
        resolvers,
        schemaDirectives: getSchemaDirectives(this),
        resolverValidationOptions: {
          requireResolversForResolveType: false,
        },
      });
      // console['debug'](this.generateTemplateInput());
      this.sql = mustache.render(dbSchemaTemplates[StoreType.MYSQL], this.generateTemplateInput());
    }
    return this.sql;
  }

  public toExecutableSchema(): GraphQLSchema {
    this.toDbSchema();
    return this.executableSchema;
  }

  private generateTemplateInput(): any {
    const tables = [];
    for (const key of Object.keys(this.dbTables)) {
      const table: IDbTable = this.dbTables[key];
      tables.push(table.toDataView(this.input.dbInfo.dbType));
    }
    const retval = {
      dbUser: this.input.dbInfo.dbUser,
      dbPass: this.input.dbInfo.dbPass,
      schemaName: this.input.dbInfo.dbName,
      tables,
    };
    return retval;
  }
}
