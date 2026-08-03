import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      handle: string;
      orgId: string;
      role: string;
      isOps: boolean;
      membershipOrgIds: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    handle: string;
    orgId: string;
    role: string;
    isOps: boolean;
    membershipOrgIds: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    email: string;
    name: string;
    handle: string;
    orgId: string;
    role: string;
    isOps: boolean;
    membershipOrgIds: string[];
  }
}

export {};
