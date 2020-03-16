import { ITypedef, makeExecutableSchema } from 'graphql-tools';
import gql from 'graphql-tag';
import * as mustache from 'mustache';
import { getSchemaDirectives } from '.';
import { GraphQLSchema } from 'graphql/type';

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
  mysql: `
    CREATE USER '{{dbUser}}'@'%' IDENTIFIED WITH mysql_native_password by {{dbPass}};

    drop database if exists {{schemaName}};
    create database {{schemaName}}
      character set utf8
      collate utf8_unicode_ci;

    GRANT ALL PRIVILEGES ON {{schemaName}}.* TO '{{dbUser}}'@'%';
    FLUSH PRIVILEGES;

    use {{schemaName}};
    SET GLOBAL group_concat_max_len=100000;

    -- custom functions
    DELIMITER $$
    CREATE FUNCTION currentSID() RETURNS int(10)
      DETERMINISTIC
    BEGIN
      declare retval int(10);
      select sid into retval from dm_snapshot order by sid desc limit 1;
      if (retval is NULL) then
        return 0;
      else
        return retval;
      end if;
    END$$
    DELIMITER ;
    
    DELIMITER $$
    CREATE FUNCTION orderedBinUUIDToText(u binary(16)) RETURNS varchar(36)
      DETERMINISTIC
    BEGIN
      return (insert(insert(insert(insert(hex(concat(substr(u, 5, 4), substr(u, 3, 2), substr(u, 1, 2), substr(u, 9, 8))), 9, 0, '-'), 14, 0, '-'), 19, 0, '-'), 24, 0, '-'));
    END$$
    DELIMITER ;

    DELIMITER $$
    CREATE FUNCTION orderedBinUUID() RETURNS binary(16)
      DETERMINISTIC
    BEGIN
      RETURN toOrderedBinUUID(uuid());
    END$$
    DELIMITER ;

    DELIMITER $$
    CREATE FUNCTION toOrderedBinUUID(uuidText varchar(36)) RETURNS binary(16)
      DETERMINISTIC
    BEGIN
      declare u binary(16);
      set u = unhex(replace(uuidText, '-', ''));
      RETURN (concat(substr(u, 7, 2), substr(u, 5, 2), substr(u, 1, 4), substr(u, 9, 8)));
    END$$
    DELIMITER ;

    -- table definitions
    CREATE TABLE dm_snapshot (
      sid int(10) unsigned NOT NULL AUTO_INCREMENT,
      description varchar(255) DEFAULT NULL,
      timestamp datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (sid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

    {{#tables}}
    CREATE TABLE {{name}} (
      uuid_bin binary(16),
      uuid_text varchar(36) NOT NULL,
      version int unsigned NOT NULL DEFAULT 0,
      start_sid int unsigned NOT NULL,
      end_sid int unsigned NOT NULL DEFAULT 4294967295,
      name varchar(255) NOT NULL,
      {{#columns}}
      {{/columns}}
      PRIMARY KEY (uuid_bin, version),
      UNIQUE (name, version),
      INDEX (start_sid, end_sid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    {{/tables}}
    `,
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
