import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import axios from "axios";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const brandId = searchParams.get("state"); // Recuperamos o brandId daqui

  if (!code || !brandId) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/brand?error=missing_params`);
  }

  try {
    // 1. Trocar o código pelo Access Token de Curta Duração
    const tokenResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
      params: {
        client_id: process.env.FACEBOOK_CLIENT_ID,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/instagram/callback`,
        code,
      },
    });

    const shortLivedToken = tokenResponse.data.access_token;

    // 2. Trocar pelo Token de Longa Duração (60 dias)
    const longLivedResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
      params: {
        grant_type: "fb_exchange_token",
        client_id: process.env.FACEBOOK_CLIENT_ID,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET,
        fb_exchange_token: shortLivedToken,
      },
    });

    const accessToken = longLivedResponse.data.access_token;

    // 3. Salvar no Banco de Dados (SocialProfile)
    await prisma.socialProfile.upsert({
      where: {
        brandProfileId_platform: {
          brandProfileId: brandId,
          platform: "instagram",
        },
      },
      update: {
        accessToken: accessToken,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        brandProfileId: brandId,
        platform: "instagram",
        accessToken: accessToken,
        isActive: true,
      },
    });


    // 4. Redirecionar de volta para o Dashboard com sucesso
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/brand?social=connected`);
  } catch (error: any) {
    console.error("Erro no callback do Instagram:", error.response?.data || error.message);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/brand?error=auth_failed`);
  }
}
