import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: [
        /*
         * Protegemos apenas o dashboard e a API do dashboard.
         * Todas as outras rotas (/, /privacy, /terms, etc) ficam públicas para o Facebook.
         */
        "/dashboard/:path*",
        "/api/dashboard/:path*",
    ],
};


