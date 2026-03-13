export const metadata = {
  title: 'Exclusão de Dados | Tobias Content Engine',
};

export default function DataDeletionPage() {
  return (
    <html>
      <body style={{ margin: 0, padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#111827' }}>Exclusão de Dados</h1>
          <p>Para remover seus dados ou desconectar seu Instagram:</p>
          <ol>
            <li>Desconecte o app nas configurações do seu Facebook.</li>
            <li>Ou envie e-mail para contato@tobiasestivalete.com.br solicitando o "wipe" da conta.</li>
          </ol>
        </div>
      </body>
    </html>
  );
}
