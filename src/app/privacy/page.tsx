export const metadata = {
  title: 'Política de Privacidade | Tobias Content Engine',
  description: 'Privacidade e segurança dos seus dados.',
};

// Usamos um layout nulo para estas páginas para evitar conflitos com o dashboard
export default function PrivacyPage() {
  return (
    <html>
      <body style={{ margin: 0, padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#111827' }}>Política de Privacidade</h1>
          <p>Este aplicativo respeita a sua privacidade.</p>
          <h2 style={{ fontSize: '18px', marginTop: '24px' }}>1. Dados</h2>
          <p>Coletamos apenas o necessário para integração via API oficial.</p>
          <h2 style={{ fontSize: '18px', marginTop: '24px' }}>2. Exclusão</h2>
          <p>Solicite a remoção para: contato@tobiasestivalete.com.br</p>
        </div>
      </body>
    </html>
  );
}
