export const metadata = {
  title: 'Termos de Serviço | Tobias Content Engine',
  description: 'Termos de serviço do Tobias Content Engine.',
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto py-20 px-6 font-sans text-gray-800">
      <h1 className="text-3xl font-black mb-6">Termos de Serviço</h1>
      <p className="mb-4">Ao utilizar o Tobias Content Engine, você concorda com estes termos básicos.</p>
      <h2 className="text-xl font-bold mt-6 mb-2">1. Uso do Serviço</h2>
      <p className="mb-4">Nossa ferramenta facilita o gerenciamento de conteúdo para redes sociais. Você é responsável pelo conteúdo que publica.</p>
      <h2 className="text-xl font-bold mt-6 mb-2">2. Integrações</h2>
      <p className="mb-4">Utilizamos as APIs oficiais da Meta (Facebook/Instagram) e seguimos rigorosamente suas políticas de uso.</p>
      <h2 className="text-xl font-bold mt-6 mb-2">3. Limitação de Responsabilidade</h2>
      <p className="mb-4">Não nos responsabilizamos por perdas decorrentes do uso inadequado da ferramenta ou mudanças nas diretrizes das redes sociais.</p>
      <p className="mt-10 text-sm text-gray-500">Última atualização: 12 de Março de 2026</p>
    </div>
  );
}
