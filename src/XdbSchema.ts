import { ITypedef, makeExecutableSchema } from 'graphql-tools';
import gql from 'graphql-tag';
import * as mustache from 'mustache';
import { GraphQLSchema } from 'graphql/type';
import { mysqlTemplate } from './sql/mysql.mustache';
import { getSchemaDirectives } from './getSchemaDirectives';

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

const resolvers = {
  Entity: {
    __resolveType(obj: any, context: any, info: any): any {
      if (obj.metadata && obj.metadata.type) {
        return obj.metadata.type;
      }
      return null;
    },
  },
  Query: {
    getEntityById: (obj: any, args: any, context: any, info: any) => {
      return {
        metadata: {
          uuid: 'abcd',
          type: 'Device',
        },
        os: 'junos',
        family: 'srx',
      };
    },
  },
};

export class XdbSchema {
  private input: IXdbSchemaInput;
  private sql!: string;
  private executableSchema!: GraphQLSchema;

  public constructor(input: IXdbSchemaInput) {
    this.input = input;
    this.sql = '';
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
      this.sql = mustache.render(dbSchemaTemplates[StoreType.MYSQL], this.generateTemplateInput());
    }
    return this.sql;
  }

  public toExecutableSchema(): GraphQLSchema {
    this.toDbSchema();
    return this.executableSchema;
  }

  private generateTemplateInput(): any {
    return {
      dbUser: this.input.dbInfo.dbUser,
      dbPass: this.input.dbInfo.dbPass,
      schemaName: this.input.dbInfo.dbName,
      tables: [
        {
          name: 'Device',
          columns: [],
        },
        {
          name: 'PhysicalInterface',
          columns: [],
        },
      ],
    };
  }
}
