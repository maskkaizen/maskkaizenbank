import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// This is a simplified authentication setup for demo purposes
const demoUsers = [
  {
    id: "1",
    email: "qafinal@maskpolymer.com",
    password: "admin123",
    name: "Admin User",
    role: "admin",
  },
  {
    id: "2",
    email: "admin2@example.com",
    password: "admin2004",
    name: "Admin User",
    role: "admin",
  },
  {
    id: "3",
    email: "admin3@example.com",
    password: "admin2005",
    name: "Admin User",
    role: "admin",
  },
  {
    id: "4",
    email: "qa@maskpolymer.com",
    password: "upload123",
    name: "Uploader User",
    role: "uploader",
  },
];

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        // Find user by email
        const user = demoUsers.find(
          (user) => user.email === credentials.email
        );

        // Check if user exists and password matches
        if (user && user.password === credentials.password) {
          // Remove password from returned user object
          const { password: _, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/", // Custom sign-in page
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "your-fallback-secret-key",
});

export { handler as GET, handler as POST };
