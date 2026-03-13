export const metadata = {
  title: 'Exclusão de Dados | STELAR',
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-[#EAEAE5] py-20 px-6">
        <div className="max-w-2xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-xl shadow-black/5 border border-white/60">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-8">Exclusão de Dados</h1>
          <div className="space-y-6 text-gray-600 font-medium">
            <p>Para remover seu vínculo com o Instagram:</p>
            <ol className="list-decimal ml-6 space-y-2">
              <li>Acesse seu Facebook &gt; Configurações &gt; Aplicativos e Sites.</li>
              <li>Remova o acesso do "Tobias Content Engine".</li>
              <li>Pronto, seus tokens serão invalidados automaticamente.</li>
            </ol>
          </div>
        </div>
    </div>
  );
}
