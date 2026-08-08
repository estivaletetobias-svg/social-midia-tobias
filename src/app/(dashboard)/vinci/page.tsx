import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solvefy Vinci — iAgente de Geração de Vídeo Inteligente",
  description: "Transforme assuntos e roteiros em vídeos curtos com clone virtual e quadro ilustrado automático.",
};

export default function VinciPage() {
  return (
    <div style={{ width: "100%", height: "100vh", border: "none", overflow: "hidden", background: "#090d16" }}>
      <iframe
        src="https://joao-iagente-video.vercel.app"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          minHeight: "100vh",
        }}
        title="Solvefy Vinci iAgent"
      />
    </div>
  );
}
