import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID!,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    scope: 'instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list,pages_read_engagement,public_profile,email',
                },
            },
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("E-mail e senha são obrigatórios");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email.toLowerCase() }
                });

                if (!user || !user.password) {
                    throw new Error("Usuário não encontrado ou sem senha cadastrada");
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                if (!isPasswordValid) {
                    throw new Error("Senha incorreta");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: (user as any).role,
                    workspaceId: user.workspaceId,
                    brandId: user.brandId
                } as any;
            }
        })
    ],
    debug: process.env.NODE_ENV === 'development',
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.uid = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.uid;
            }
            return session;
        }
    }
};
