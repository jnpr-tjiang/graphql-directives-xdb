import { StoreType, XdbSchema, getSchemaDirectives } from '.';
import { gql, ApolloServer, makeExecutableSchema } from 'apollo-server';
const INFO_LEVEL = 'info';

const deviceSchema = gql`
  type Device implements Entity @xdbEntity {
    metadata: Metadata!
    os: String
    family: String
    physicalInterfaces: [PhysicalInterface] @xdbChildren
  }

  type PhysicalInterface implements Entity @xdbEntity {
    metadata: Metadata!
    mac: String
  }
`;

const xdbSchema = new XdbSchema({
  schemas: [deviceSchema],
  dbInfo: {
    dbType: StoreType.MYSQL,
    dbName: 'xdb',
    dbUser: 'tong',
    dbPass: '1234',
  },
});
const schema = xdbSchema.toExecutableSchema();
const server = new ApolloServer({ schema });
server.listen().then(({ url }) => {
  console[INFO_LEVEL](`Server ready at ${url}`);
});
