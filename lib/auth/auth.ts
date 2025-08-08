import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/config/prisma";
import Resend from "next-auth/providers/resend";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // —————————————
  // ADAPTER
  // —————————————
  adapter: {
    ...PrismaAdapter(prisma),

    /**
     * Create user
     */
    async createUser(data) {
      // Create user and wallet in one transection
      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: data.email,
            emailVerified: data.emailVerified,
            name: data?.name,
            image: data?.image,
          },
        });

        await tx.wallet.create({
          data: { userId: user.id },
        });

        return user;
      });
    },
  },

  // —————————————
  // AUTH PROVIDER
  // —————————————
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY!,
      from: process.env.AUTH_RESEND_FROM!,
    }),
  ],

  // —————————————
  // SESSIONS
  // —————————————
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // —————————————
  // COOKIES
  // —————————————
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    }
  },

  // —————————————
  // CALLBACKS
  // —————————————
  callbacks: {
    async signIn({ user, account }) {

      if (process.env.NEXT_PUBLIC_DEBUG_MODE) {
        console.info("Sign-in callback triggered:", { user, account });
      }

      try {
        if (account?.provider === "resend" && user?.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {

            // await prisma.user.create({
            //   data: { email: user.email },
            // });


            // Create user and wallet in one transection
            await prisma.$transaction(async (tx) => {
              const newUser = await tx.user.create({
                data: {
                  email: user.email as string,
                  name:  user?.name,
                  image: user?.image,
                },
              });

              await tx.wallet.create({
                data: { userId: newUser.id },
              });
            });
          }
        }

        return true;

      } catch ( error ) {
        if ( process.env.NEXT_PUBLIC_DEBUG_MODE ) {
          console.error( "Sign-in callback error:", error );
        }
        return false;
      }
    },

    // Persist user.id into the token on first sign-in
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // Make token.id available on session.user.id
    async session({ session, token }) {
      if (process.env.NEXT_PUBLIC_DEBUG_MODE) {
        console.info("Session callback:", {
          sessionData: session,
          tokenData: token,
        });
      }

      if (session?.user && token?.sub) {
        // Make sure the session includes the user ID from the token
        session.user.id = token.sub;

        // Fetch user from database to get isAdmin status
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
        });

        // Update user id, name, eamil
        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.name = dbUser.name;
          session.user.email = dbUser.email;
        }

        // Add isAdmin flag tologger session with proper typing
        if (dbUser && "isAdmin" in dbUser) {
          (session.user as { isAdmin?: boolean }).isAdmin = dbUser.isAdmin;
        } else {
          (session.user as { isAdmin?: boolean }).isAdmin = false;
        }
      }

      return session;
    },

    // Redirect after authentication
    async redirect({ url, baseUrl }) {
      if (process.env.NEXT_PUBLIC_DEBUG_MODE) {
        console.info("Redirect callback:", { url, baseUrl });
      }

      // Always redirect to dashboard after authentication
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/dashboard`;
      }
      // For safety, if external URL, go to base URL
      return `${baseUrl}/dashboard`;
    },
  },

  // —————————————
  // DEBUG
  // —————————————
  debug: !!process.env.NEXT_PUBLIC_DEBUG_MODE,
  secret: process.env.AUTH_SECRET,
});
