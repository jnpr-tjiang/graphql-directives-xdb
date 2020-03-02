import gql from 'graphql-tag';
import { StoreType, generateXdbSchema } from '../index';

const deviceSchema = gql`
  type Device implements Entity @xdbEntity{
    os: String
    family: String
    physicalInterfaces: [PhysicalInterface] @xdbChildren
  }

  type PhysicalInterface implements Entity @xdbEntity {
    mac: String
  }
`;

const dbSchema = generateXdbSchema({
  schemas: [deviceSchema],
  type: StoreType.MYSQL,
  dbName: 'test',
});

test('Test db schema generation', () => {
  expect(dbSchema).toBe('test');
});