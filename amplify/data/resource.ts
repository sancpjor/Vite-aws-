export interface Schema {
  Todo: {
    type: {
      id: string;
      content?: string;
    };
  };
}

// Mock data function for now
export const data = {
  schema: {} as Schema
};
