import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let brandId = searchParams.get("brandId");

  // Se o ID não veio no link, tentamos pegar da sessão do usuário logado
  if (!brandId) {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const brand = await prisma.brandProfile.findFirst({
        where: { id: (session.user as any).brandId || undefined }
      });

      if (!brand) {
          // Fallback final: pega a primeira marca do workspace do usuário
          const firstBrand = await prisma.brandProfile.findFirst();
          brandId = firstBrand?.id || null;
      } else {
          brandId = brand.id;
      }
    }
  }

  if (!brandId) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/brand?error=no_brand_id`);
  }

  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, ""); // Remove barra no final se houver
  const redirectUri = `${baseUrl}/api/instagram/callback`;
  const scope = "instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list,pages_read_engagement,public_profile";

  const fbLoginUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${brandId}&response_type=code`;


  return NextResponse.redirect(fbLoginUrl);
}

