export const resolvers = {
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
