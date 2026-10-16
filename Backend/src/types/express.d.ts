export {};

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
        firebaseUid: string;
        role: 'admin' | 'user';
      };
    }
  }
}
