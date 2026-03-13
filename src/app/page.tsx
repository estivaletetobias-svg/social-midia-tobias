import { redirect } from "next/navigation";

export default function RootPage() {
    // Redireciona automaticamente para o Dashboard.
    // O middleware cuidará de levar para a tela de login se não estiver logado.
    redirect("/dashboard");
}
