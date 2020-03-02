import gql from 'graphql-tag';
import { makeExecutableSchema, SchemaDirectiveVisitor, ITypedef } from 'graphql-tools';
import { GraphQLSchema, GraphQLObjectType, GraphQLField, GraphQLDirective, DirectiveLocation } from 'graphql';

export const xdbSchema = gql`
  directive @xdbEntity on OBJECT
  directive @xdbParent on FIELD_DEFINITION
  directive @xdbChildren on FIELD_DEFINITION
  directive @xdbRefOneToMany on FIELD_DEFINITION
  directive @xdbRefManyToOne on FIELD_DEFINITION
  directive @xdbRefManyToMany on FIELD_DEFINITION

  interface Entity {
      uuid: String!
      version: Int!
      startSID: Int!
      endSID: Int!
      name: String!
  }

  type Query {
      getEntityById(
          type: String, 
          uuid: String, 
          dbSnapshot: Int = NULL
      ): Entity
  }
`;

interface IGetSchemaDirectivesOutput {
  [directiveName: string]: typeof SchemaDirectiveVisitor;
}

export function getSchemaDirectives(): IGetSchemaDirectivesOutput {
  class XdbDirective extends SchemaDirectiveVisitor {
    public static getDirectiveDeclaration(name: string, schema: GraphQLSchema): GraphQLDirective {
      const location = name === 'xdbEntity' ? DirectiveLocation.OBJECT : DirectiveLocation.FIELD_DEFINITION;
      return new GraphQLDirective({
        name,
        locations: [location],
      });
    }
    public visitObject(object: GraphQLObjectType) {
      const msgType = 'debug';
      console[msgType]('Visited object: ' + object.name);
    }
    public visitFieldDefinition(field: GraphQLField<any, any>, details: any) {
      const msgType = 'debug';
      console[msgType]('Visited field: ' + field.name);
    }
  }
  return {
    xdbEntity: XdbDirective,
    xdbParent: XdbDirective,
    xdbChildren: XdbDirective,
    xdbRefOneToMany: XdbDirective,
    xdbRefManyToOne: XdbDirective,
    xdbRefManyToMany: XdbDirective,
  };
};

export enum StoreType {
  MYSQL = 'mysql',
  PGSQL = 'postgres',
  SQLITE = 'sqlite'
};

export interface IGenerateXdbSchemaInput {
  schemas: ITypedef[],
  type: StoreType,
  dbName: string
};

export function generateXdbSchema(options: IGenerateXdbSchemaInput): string {
  makeExecutableSchema({
    typeDefs: options.schemas.concat(xdbSchema),
    schemaDirectives: getSchemaDirectives(),
    resolverValidationOptions: {
      requireResolversForResolveType: false
    }
  });
  return options.dbName;
}