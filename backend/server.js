import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

app.get("/", (req, res) => {
  res.send("Backend do Agente GCM IA está funcionando!");
});

app.post("/api/teste", (req, res) => {
  res.json({
    message: "POST funcionando!",
    body: req.body,
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Envie uma mensagem no campo 'message'.",
      });
    }

    const systemPrompt = `
Você é um agente de IA especializado no concurso da Guarda Civil Municipal de Campina Grande - PB, banca IDECAN.

Sua função é ajudar o aluno a estudar melhor.

Regras:
- Responda em português do Brasil.
- Explique de forma simples e direta.
- Foque em concurso público.
- Quando possível, crie exemplos no estilo IDECAN.
- Ajude com Português, Raciocínio Lógico, História de Campina Grande, Legislação, Direito Constitucional, Direitos Humanos, Direito Penal, Processo Penal e Legislação Extravagante.
- Quando criar questões, coloque gabarito e comentário.
- Não invente leis ou artigos. Quando não tiver certeza, avise.
`;

    const safeHistory = history
      .filter((item) => item.role === "user" || item.role === "assistant")
      .slice(-10);

    const resposta = await client.chat.completions.create({
      model: process.env.NVIDIA_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...safeHistory,
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.4,
      max_tokens: 1200,
    });

    const answer = resposta.choices?.[0]?.message?.content || "";

    res.json({
      answer,
    });
  } catch (error) {
    console.error("Erro na IA:", error);

    res.status(500).json({
      error: "Erro ao chamar a IA da NVIDIA.",
      details: error.message,
    });
  }
});

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});