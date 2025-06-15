import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const users = [
          { id: "1", name: "Admin", email: "admin@example.com", password: "admin123", role: "admin" },
          { id: "2", name: "Uploader", email: "uploader@example.com", password: "upload123", role: "uploader" },
        ];
        
        const user = users.find(
          u => u.email === credentials?.email && u.password === credentials?.password
        );
        
        if (user) {
          // Only return the necessary user properties (don't include password)
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }
        
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  // For development - don't use in production
  debug: process.env.NODE_ENV === "development",
};