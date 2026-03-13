import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (NextAuth)
         * - privacy, terms, data-deletion (Compliance)
         * - login (Sign in)
         * - _next/static, _next/image, favicon.ico (Static)
         */
        "/dashboard/:path*",
        "/api/dashboard/:path*",
    ],
};

