import axios from 'axios';

export class InstagramService {
  private static baseUrl = 'https://graph.facebook.com/v18.0';

  /**
   * Busca as páginas do Facebook vinculadas ao token e suas contas do Instagram.
   */
  static async getConnectedProfiles(accessToken: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/me/accounts`, {
        params: {
          fields: 'name,access_token,instagram_business_account{id,username,profile_picture_url,name}',
          access_token: accessToken,
        },
      });

      const pages = response.data.data;
      const connectedAccounts = pages
        .filter((page: any) => page.instagram_business_account)
        .map((page: any) => ({
          pageId: page.id,
          pageName: page.name,
          instagramId: page.instagram_business_account.id,
          username: page.instagram_business_account.username,
          profilePicture: page.instagram_business_account.profile_picture_url,
          igName: page.instagram_business_account.name,
        }));

      return connectedAccounts;
    } catch (error: any) {
      console.error('Erro ao buscar perfis do Instagram:', error.response?.data || error.message);
      throw error;
    }
  }
}
