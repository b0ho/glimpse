import '@clerk/clerk-sdk-node';

declare module '@clerk/clerk-sdk-node' {
  export interface ClerkClient {
    verifyToken(token: string): Promise<any>;
  }
}