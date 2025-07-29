declare namespace Express {
  export interface Request {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      // photo: {
      //   image: string;
      //   name: string;
      // };
      permissions: string[];
    };
  }
}
