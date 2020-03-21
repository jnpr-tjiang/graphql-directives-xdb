import { SchemaDirectiveVisitor } from 'graphql-tools';
import { GraphQLSchema, GraphQLObjectType, GraphQLField, GraphQLDirective, DirectiveLocation } from 'graphql';
import { XdbSchema } from './XdbSchema';
import { DbTable } from './sql/DbTable';

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
      const dbTable = new DbTable(object.name);
      for (const name of Object.keys(object.getFields())) {
        const field = object.getFields()[name];
        dbTable.addColumn(field);
      }
      xdbSchema.addTable(dbTable);
    }

    public visitFieldDefinition(field: GraphQLField<any, any>, details: any) {
      const table = xdbSchema.getTable(details.objectType.name);
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
