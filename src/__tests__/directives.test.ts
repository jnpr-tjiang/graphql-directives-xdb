import gql from 'graphql-tag';
import { StoreType, XdbSchema } from '../index';

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

const sql = xdbSchema.toDbSchema();
// console['debug'](sql);
test('Test db schema generation', () => {
  expect(sql).toContain("CREATE USER 'tong'@'%' IDENTIFIED WITH mysql_native_password by 1234");
  expect(sql).toContain('drop database if exists xdb');
  expect(sql).toContain('create database xdb');
  expect(sql).toContain('CREATE TABLE Device');
  expect(sql).toContain('CREATE TABLE PhysicalInterface');
});
