declare global {
  namespace Express {
    interface Request {
      auth: {
        userId: string | null;
        session: any; // Better Auth Session
        user?: any;    // Better Auth User
      };
    }
  }
}
