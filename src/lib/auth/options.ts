import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateCredentials, canSwitchToOrg } from "@/lib/auth/credentials";
import { DEFAULT_ORG_ID } from "@/lib/orgs";
import { roleForOrg, findSeedUserByEmail } from "@/lib/db/seed-data";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identity = await authenticateCredentials(
          credentials?.email,
          credentials?.password ?? ""
        );
        if (!identity) return null;
        return {
          id: identity.userId,
          email: identity.email,
          name: identity.name,
          handle: identity.handle,
          orgId: identity.orgId,
          role: identity.role,
          isOps: identity.isOps,
          membershipOrgIds: identity.membershipOrgIds,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email ?? "";
        token.name = user.name ?? "";
        token.handle = user.handle;
        token.orgId = user.orgId;
        token.role = user.role;
        token.isOps = user.isOps;
        token.membershipOrgIds = user.membershipOrgIds;
      }

      // Client / API can update active org via session.update({ orgId })
      if (trigger === "update" && session?.orgId) {
        const nextOrgId = String(session.orgId);
        const identity = {
          userId: token.userId,
          email: token.email,
          name: token.name,
          handle: token.handle,
          isOps: token.isOps,
          orgId: token.orgId,
          role: token.role,
          membershipOrgIds: token.membershipOrgIds ?? [],
        };
        if (canSwitchToOrg(identity, nextOrgId)) {
          token.orgId = nextOrgId;
          const seed = findSeedUserByEmail(token.email);
          token.role = seed
            ? roleForOrg(seed, nextOrgId)
            : token.isOps
              ? "Admin"
              : token.role;
        }
      }

      if (!token.orgId) token.orgId = DEFAULT_ORG_ID;
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.userId,
        email: token.email,
        name: token.name,
        handle: token.handle,
        orgId: token.orgId,
        role: token.role,
        isOps: token.isOps,
        membershipOrgIds: token.membershipOrgIds ?? [],
      };
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.DEMO_PASSWORD || "stl-pilot-dev-secret",
};
