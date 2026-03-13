export const metadata = {
  title: 'Política de Privacidade | Tobias Content Engine',
  description: 'Privacidade e segurança dos seus dados.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#EAEAE5] py-20 px-6">
        <div className="max-w-2xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-xl shadow-black/5 border border-white/60">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-8">Política de Privacidade</h1>
          
          <div className="space-y-6 text-gray-600 font-medium">
            <p>Este aplicativo (Tobias Content Engine) respeita a sua privacidade e a segurança dos seus dados.</p>
            
            <section>
              <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight mb-2">1. Coleta de Dados</h2>
              <p>Coletamos apenas as informações necessárias para a integração com o Instagram via API oficial da Meta.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight mb-2">2. Exclusão de Dados</h2>
              <p>Você pode solicitar a exclusão total enviando um e-mail para: <span className="text-gray-900 font-black">contato@tobiasestivalete.com.br</span></p>
            </section>
          </div>
        </div>
    </div>
  );
}
