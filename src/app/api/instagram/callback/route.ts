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

    // 3. Buscar detalhes do perfil do Instagram automaticamente
    let handle = "";
    let externalId = "";
    let metadata = {};

    try {
      const { InstagramService } = require("@/services/instagram");
      const accounts = await InstagramService.getConnectedProfiles(accessToken);
      
      if (accounts && accounts.length > 0) {
        const primary = accounts[0]; // Pegamos a primeira conta vinculada
        handle = primary.username;
        externalId = primary.instagramId;
        metadata = {
          profilePicture: primary.profilePicture,
          igName: primary.igName,
          pageId: primary.pageId,
          pageName: primary.pageName
        };
      }
    } catch (e) {
      console.error("Erro ao enriquecer perfil:", e);
    }

    // 4. Salvar no Banco de Dados (SocialProfile)
    await prisma.socialProfile.upsert({
      where: {
        brandProfileId_platform: {
          brandProfileId: brandId,
          platform: "instagram",
        },
      },
      update: {
        accessToken: accessToken,
        handle: handle || undefined,
        externalId: externalId || undefined,
        metadata: metadata,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        brandProfileId: brandId,
        platform: "instagram",
        accessToken: accessToken,
        handle: handle,
        externalId: externalId,
        metadata: metadata,
        isActive: true,
      },
    });


    // 5. Redirecionar de volta para o Dashboard com sucesso
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/brand?social=connected`);
  } catch (error: any) {
    console.error("Erro no callback do Instagram:", error.response?.data || error.message);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/brand?error=auth_failed`);
  }
}
