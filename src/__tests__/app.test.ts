import { createTestClient } from 'apollo-server-testing';
import { StoreType, XdbSchema } from '../index';
import { gql, ApolloServerBase } from 'apollo-server-core';

describe('testXdbSchema', () => {
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
  const server = new ApolloServerBase({ schema: xdbSchema.toExecutableSchema() });

  debugger;
  it('getEntityById', async () => {
    const query = gql`
      {
        getEntityByIdxxx(type: "Device", uuid: "abc") {
          metadata {
            type
            uuid
          }
          ... on Device {
            os
          }
        }
      }
    `;
    const client = createTestClient(server);
    const result = await client.query({ query });
    expect(result.data).toEqual({
      data: {
        getEntityById: {
          metadata: {
            type: 'Device',
            uuid: 'abcd',
          },
          os: 'junos',
        },
      },
    });
  });
});
