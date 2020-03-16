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

  it('getEntityById', async () => {
    const query = gql`
      {
        getEntityById(type: "Device", uuid: "abcd") {
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
    console['debug'](result.data);
    expect(result.data).toEqual({
      getEntityById: {
        metadata: {
          type: 'Device',
          uuid: 'abcd',
        },
        os: 'junos',
      },
    });
  });
});
