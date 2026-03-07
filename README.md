# AI Content Engine — Tobias Estivalete

## 🏗️ Production-Grade Content Automation Platform

A robust, backend-first system designed to automate social media content production, topic discovery, and editorial workflows for **Instagram** and **LinkedIn**.

### 🛠️ Architecture Overview
*   **Next.js (App Router)**: Framework for the unified API and Admin Hub.
*   **Prisma + PostgreSQL**: Solid relational data layer for tracking every version of every post.
*   **BullMQ + Redis**: High-performance background worker for long-running LLM and Image tasks.
*   **Service-Oriented Design**: Business logic isolated in `src/services/` for maximum testability.
*   **RAG-Ready**: Grounded content generation using a searchable Knowledge Base.

---

### 📂 Folder Structure
```text
/src
  /app                  # Next.js App Router (Páginas e API)
    /api                # API Endpoints (Brand, Topics, Content)
    /dashboard          # Admin UI (Kanban, Calendar, Knowledge)
  /services             # Camada de Serviços (Lógica de Negócio)
    /brand              # Motor de Identidade de Marca
    /discovery          # Motor de Descoberta de Tópicos (IA)
    /knowledge          # Base de Conhecimento (RAG)
    /content            # Pipeline de Geração Multi-etapa (IA)
    /image              # Geração de Imagens e Prompts (IA)
    /workflow           # Máquina de Estados Editorial
  /lib                  # Utilitários & Singletons (Prisma, Redis, OpenAI)
  /workers              # Definições de Processamento em Background
  /components           # UI Components (Sidebar, Layout, Cards)
  /types                # Definições globais de TypeScript
/prisma                 # Database Schema e Seeds
/scripts                # Scripts de manutenção e automação
```

---

### 🚀 Setup & Installation

1.  **Clone the Repository**
2.  **Install dependencies**
    ```bash
    npm install
    ```
3.  **Environment Variables**
    Configure your `.env` (copy from `.env.example`):
    ```bash
    cp .env.example .env
    ```
4.  **Database Initial Setup**
    ```bash
    npx prisma generate
    npx prisma migrate dev --name init
    npx prisma db seed
    ```
5.  **Run the Platform**
    *   **Terminal 1 (Dashboard/API)**: `npm run dev`
    *   **Terminal 2 (AI Worker)**: `npm run worker`

---

### 🧠 Core Modules Documentation
*   [Technical PRD](.gemini/antigravity/brain/5b55f81f-4366-4bd2-8969-66273fd3f2b0/technical_prd.md)
*   [Architectural Blueprint](.gemini/antigravity/brain/5b55f81f-4366-4bd2-8969-66273fd3f2b0/architecture_plan.md)

---
**Lead Architect**: Tobias Estivalete
**Senior AI Systems Engineer**: Antigravity
