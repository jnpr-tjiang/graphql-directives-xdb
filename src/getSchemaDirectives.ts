import { SchemaDirectiveVisitor } from 'graphql-tools';
import { GraphQLSchema, GraphQLObjectType, GraphQLField, GraphQLDirective, DirectiveLocation } from 'graphql';
import { XdbSchema } from './XdbSchema';

export interface IGetSchemaDirectivesOutput {
  [directiveName: string]: typeof SchemaDirectiveVisitor;
}

export function getSchemaDirectives(xdbSchema: XdbSchema): IGetSchemaDirectivesOutput {
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
}
