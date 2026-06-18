<script setup>
import { ref, watch, onMounted, nextTick } from "vue";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

function formatarMarkdown(texto) {
  return md.render(texto || "");
}

const message = ref("");
const loading = ref(false);
const chatRef = ref(null);
const modoAtivo = ref("chat");

const falando = ref(false);
const ouvindo = ref(false);

const disciplinaSimulado = ref("Lei 13.022/2014");
const quantidadeQuestoes = ref(5);
const respostasAluno = ref("");
const tempoEstudo = ref("2 horas");
const focoEstudo = ref("Legislação Extravagante");
const dificuldadeEstudo = ref("");

const temaFlashcards = ref("Lei 13.022/2014");
const quantidadeFlashcards = ref(10);
const flashcardsGerados = ref([]);
const flashcardAtual = ref(0);
const cardVirado = ref(false);

const mensagemInicial = {
  role: "assistant",
  content:
    "Olá! Sou seu **Agente IA de Estudos para GCM Campina Grande / IDECAN**.\n\nEscolha um modo acima ou me pergunte algo direto. Vamos estudar com foco, questões, revisão ativa, voz e flashcards interativos.",
};

const messages = ref([mensagemInicial]);

const modos = [
  { id: "chat", nome: "Chat" },
  { id: "simulado", nome: "Simulado" },
  { id: "correcao", nome: "Correção" },
  { id: "plano", nome: "Plano" },
  { id: "flashcards", nome: "Flashcards" },
];

const disciplinas = [
  "Lei 13.022/2014",
  "Português",
  "Raciocínio Lógico",
  "Direito Constitucional",
  "Direitos Humanos",
  "Direito Penal",
  "Processo Penal",
  "Legislação Extravagante",
  "História de Campina Grande",
  "Lei Maria da Penha",
  "Abuso de Autoridade",
  "ECA",
  "CTB",
];

const focos = [
  "Português",
  "Raciocínio Lógico",
  "História de Campina Grande",
  "Legislação e Ética",
  "Direito Administrativo",
  "Direito Constitucional",
  "Direitos Humanos",
  "Direito Penal",
  "Processo Penal",
  "Legislação Extravagante",
  "Lei 13.022/2014",
  "Lei Maria da Penha",
  "ECA",
  "CTB",
];

const temasFlashcards = [
  "Lei 13.022/2014",
  "Lei Maria da Penha",
  "Abuso de Autoridade",
  "ECA",
  "CTB",
  "Direito Constitucional",
  "Direitos Humanos",
  "Direito Penal",
  "Processo Penal",
  "Português - Crase",
  "Português - Concordância",
  "História de Campina Grande",
];

const promptsRapidos = [
  "Crie 5 questões sobre Lei 13.022/2014 no estilo IDECAN.",
  "Me explique crase com exemplos de prova.",
  "Faça uma revisão rápida de Direito Penal para GCM.",
  "Monte uma rotina de estudo para hoje com 2 horas disponíveis.",
];

onMounted(() => {
  const historicoSalvo = localStorage.getItem("historico-gcm-ia");

  if (historicoSalvo) {
    try {
      messages.value = JSON.parse(historicoSalvo);
    } catch {
      messages.value = [mensagemInicial];
    }
  }

  const flashcardsSalvos = localStorage.getItem("flashcards-gcm-ia");

  if (flashcardsSalvos) {
    try {
      flashcardsGerados.value = JSON.parse(flashcardsSalvos);
    } catch {
      flashcardsGerados.value = [];
    }
  }

  carregarVozes();
  rolarChat();
});

watch(
  messages,
  () => {
    localStorage.setItem("historico-gcm-ia", JSON.stringify(messages.value));
    rolarChat();
  },
  { deep: true }
);

watch(
  flashcardsGerados,
  () => {
    localStorage.setItem(
      "flashcards-gcm-ia",
      JSON.stringify(flashcardsGerados.value)
    );
  },
  { deep: true }
);

async function rolarChat() {
  await nextTick();

  if (chatRef.value) {
    chatRef.value.scrollTop = chatRef.value.scrollHeight;
  }
}

function limparChat() {
  pararVoz();
  messages.value = [mensagemInicial];
  localStorage.removeItem("historico-gcm-ia");
}

function limparFlashcards() {
  flashcardsGerados.value = [];
  flashcardAtual.value = 0;
  cardVirado.value = false;
  localStorage.removeItem("flashcards-gcm-ia");
}

function limparTextoParaVoz(texto) {
  return (texto || "")
    .replace(/[#*_`>]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/Questão\s*(\d+)/gi, "Questão $1")
    .replace(/Alternativa\s*A/gi, "Alternativa A")
    .replace(/Alternativa\s*B/gi, "Alternativa B")
    .replace(/Alternativa\s*C/gi, "Alternativa C")
    .replace(/Alternativa\s*D/gi, "Alternativa D")
    .replace(/Alternativa\s*E/gi, "Alternativa E")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function carregarVozes() {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.getVoices();

  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

function escolherVozPtBr() {
  if (!("speechSynthesis" in window)) return null;

  const vozes = window.speechSynthesis.getVoices();

  return (
    vozes.find((voz) => voz.lang?.toLowerCase() === "pt-br") ||
    vozes.find((voz) => voz.lang?.toLowerCase().startsWith("pt")) ||
    null
  );
}

function falarTexto(texto) {
  if (!("speechSynthesis" in window)) {
    alert("Seu navegador não suporta leitura por voz.");
    return;
  }

  const textoLimpo = limparTextoParaVoz(texto);

  if (!textoLimpo) return;

  window.speechSynthesis.cancel();

  const fala = new SpeechSynthesisUtterance(textoLimpo);

  fala.lang = "pt-BR";
  fala.rate = 0.92;
  fala.pitch = 1;
  fala.volume = 1;

  const vozPtBr = escolherVozPtBr();

  if (vozPtBr) {
    fala.voice = vozPtBr;
  }

  fala.onstart = () => {
    falando.value = true;
  };

  fala.onend = () => {
    falando.value = false;
  };

  fala.onerror = () => {
    falando.value = false;
  };

  window.speechSynthesis.speak(fala);
}

function falarUltimaResposta() {
  const ultimaResposta = [...messages.value]
    .reverse()
    .find((msg) => msg.role === "assistant");

  if (ultimaResposta) {
    falarTexto(ultimaResposta.content);
  }
}

function falarFlashcardAtual() {
  const card = flashcardsGerados.value[flashcardAtual.value];

  if (!card) return;

  const texto = cardVirado.value
    ? `Resposta: ${card.resposta}. Dica: ${card.dica}`
    : `Pergunta: ${card.pergunta}`;

  falarTexto(texto);
}

function pararVoz() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  falando.value = false;
}

function iniciarDitado() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert(
      "Reconhecimento de voz não disponível neste navegador. Tente usar Chrome ou Edge."
    );
    return;
  }

  const reconhecimento = new SpeechRecognition();

  reconhecimento.lang = "pt-BR";
  reconhecimento.continuous = false;
  reconhecimento.interimResults = false;
  reconhecimento.maxAlternatives = 1;

  ouvindo.value = true;

  reconhecimento.onresult = (event) => {
    const textoFalado = event.results[0][0].transcript;

    message.value = message.value
      ? `${message.value} ${textoFalado}`
      : textoFalado;
  };

  reconhecimento.onerror = () => {
    ouvindo.value = false;
  };

  reconhecimento.onend = () => {
    ouvindo.value = false;
  };

  reconhecimento.start();
}

function limparJsonFlashcards(texto) {
  return (texto || "")
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function tentarLerFlashcards(texto) {
  try {
    const limpo = limparJsonFlashcards(texto);
    const inicio = limpo.indexOf("[");
    const fim = limpo.lastIndexOf("]");

    if (inicio === -1 || fim === -1) return [];

    const json = limpo.slice(inicio, fim + 1);
    const cards = JSON.parse(json);

    if (!Array.isArray(cards)) return [];

    return cards
      .filter((card) => card.pergunta && card.resposta)
      .map((card) => ({
        pergunta: String(card.pergunta).trim(),
        resposta: String(card.resposta).trim(),
        dica: card.dica
          ? String(card.dica).trim()
          : "Revise esse ponto com atenção.",
      }));
  } catch {
    return [];
  }
}

function virarFlashcard() {
  cardVirado.value = !cardVirado.value;
}

function proximoFlashcard() {
  if (!flashcardsGerados.value.length) return;

  cardVirado.value = false;

  flashcardAtual.value =
    flashcardAtual.value + 1 >= flashcardsGerados.value.length
      ? 0
      : flashcardAtual.value + 1;
}

function flashcardAnterior() {
  if (!flashcardsGerados.value.length) return;

  cardVirado.value = false;

  flashcardAtual.value =
    flashcardAtual.value - 1 < 0
      ? flashcardsGerados.value.length - 1
      : flashcardAtual.value - 1;
}

function embaralharFlashcards() {
  flashcardsGerados.value = [...flashcardsGerados.value].sort(
    () => Math.random() - 0.5
  );

  flashcardAtual.value = 0;
  cardVirado.value = false;
}

function gerarSimulado() {
  enviarMensagem(
    `Modo Simulado: crie ${quantidadeQuestoes.value} questões sobre ${disciplinaSimulado.value} no estilo IDECAN para GCM Campina Grande.

Use alternativas A, B, C, D e E.

No final, coloque:
- gabarito separado;
- comentários curtos;
- nível de dificuldade;
- assuntos que devo revisar.`
  );
}

function corrigirRespostas() {
  if (!respostasAluno.value.trim()) return;

  enviarMensagem(
    `Modo Correção: corrija minhas respostas do simulado anterior.

Minhas respostas:
${respostasAluno.value}

Tarefas:
- diga quantas acertei;
- dê minha nota;
- mostre o gabarito;
- explique meus erros;
- diga o que devo revisar agora.`
  );

  respostasAluno.value = "";
}

function gerarPlanoDia() {
  enviarMensagem(
    `Modo Plano de Estudo: monte um plano de estudo para hoje.

Tempo disponível: ${tempoEstudo.value}
Foco principal: ${focoEstudo.value}
Minhas dificuldades: ${dificuldadeEstudo.value || "não informei"}

Monte um plano simples, direto e possível de cumprir, com:
- blocos de estudo;
- teoria;
- questões;
- revisão;
- meta final do dia.

Foque no concurso GCM Campina Grande / IDECAN.`
  );
}

async function gerarFlashcards() {
  if (loading.value) return;

  const prompt = `Modo Flashcards Interativos: crie ${quantidadeFlashcards.value} flashcards sobre ${temaFlashcards.value} para o concurso GCM Campina Grande / IDECAN.

Responda APENAS com um JSON válido, sem texto antes e sem texto depois.

Formato obrigatório:
[
  {
    "pergunta": "pergunta do flashcard",
    "resposta": "resposta objetiva",
    "dica": "dica de memorização"
  }
]

Regras:
- Foque no que mais costuma cair em prova.
- Use linguagem simples.
- Não use markdown.
- Não coloque gabarito.
- Não explique fora do JSON.`;

  messages.value.push({
    role: "user",
    content: `Gerar ${quantidadeFlashcards.value} flashcards interativos sobre ${temaFlashcards.value}.`,
  });

  loading.value = true;
  flashcardsGerados.value = [];
  cardVirado.value = false;
  flashcardAtual.value = 0;

  try {
    const history = messages.value.slice(0, -1).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: prompt,
        history,
      }),
    });

    const data = await response.json();

    if (data.error) {
      messages.value.push({
        role: "assistant",
        content: `**Erro:** ${data.error}`,
      });
      return;
    }

    const cards = tentarLerFlashcards(data.answer);

    if (!cards.length) {
      messages.value.push({
        role: "assistant",
        content:
          "Não consegui transformar a resposta em flashcards interativos. Tente gerar novamente.",
      });
      return;
    }

    flashcardsGerados.value = cards;

    messages.value.push({
      role: "assistant",
      content: `Criei **${cards.length} flashcards interativos** sobre **${temaFlashcards.value}**. Vá até a aba **Flashcards**, clique no card para virar e revise no estilo pergunta/resposta.`,
    });
  } catch {
    messages.value.push({
      role: "assistant",
      content: `**Erro ao gerar flashcards.** Verifique se o backend está rodando em \`${API_URL}\`.`,
    });
  } finally {
    loading.value = false;
  }
}

async function enviarMensagem(textoAtalho = null) {
  const texto = textoAtalho || message.value;

  if (!texto.trim() || loading.value) return;

  messages.value.push({
    role: "user",
    content: texto,
  });

  message.value = "";
  loading.value = true;

  try {
    const history = messages.value.slice(0, -1).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: texto,
        history,
      }),
    });

    const data = await response.json();

    if (data.error) {
      messages.value.push({
        role: "assistant",
        content: `**Erro:** ${data.error}`,
      });
      return;
    }

    messages.value.push({
      role: "assistant",
      content: data.answer || "A IA respondeu vazio. Tente novamente.",
    });
  } catch {
    messages.value.push({
      role: "assistant",
      content: `**Erro ao conectar com o backend.** Verifique se o servidor está rodando em \`${API_URL}\`.`,
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="app">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-icon">G</div>

```
    <div>
      <h1>GCM IA</h1>
      <p>IDECAN • Estudos</p>
    </div>
  </div>

  <div class="focus-card">
    <span>Hoje</span>
    <strong>Estudar com foco</strong>
    <small>Questões, revisão ativa e voz</small>
  </div>

  <div class="voice-card">
    <span>Modo voz</span>

    <button @click="falarUltimaResposta" :disabled="loading">
      🔊 Ler última resposta
    </button>

    <button @click="pararVoz" :disabled="!falando">
      ⏹ Parar leitura
    </button>
  </div>

  <button class="clear-btn" @click="limparChat">
    Limpar conversa
  </button>
</aside>

<section class="workspace">
  <header class="topbar">
    <div>
      <span class="eyebrow">Agente de estudos</span>
      <h2>Preparação GCM Campina Grande</h2>
    </div>

    <div class="status-group">
      <div class="status" :class="{ thinking: loading }">
        {{ loading ? "Pensando..." : "Pronto para estudar" }}
      </div>

      <div v-if="ouvindo" class="status listening">
        Ouvindo...
      </div>

      <div v-if="falando" class="status speaking">
        Lendo...
      </div>
    </div>
  </header>

  <nav class="mode-tabs">
    <button
      v-for="modo in modos"
      :key="modo.id"
      :class="{ active: modoAtivo === modo.id }"
      @click="modoAtivo = modo.id"
    >
      {{ modo.nome }}
    </button>
  </nav>

  <section v-if="modoAtivo !== 'chat'" class="tool-section">
    <div v-if="modoAtivo === 'simulado'" class="tool-card">
      <div class="tool-title">
        <h3>Gerar simulado</h3>
        <p>Treine no estilo IDECAN com gabarito e comentários.</p>
      </div>

      <div class="form-row">
        <label>
          Disciplina
          <select v-model="disciplinaSimulado">
            <option v-for="disciplina in disciplinas" :key="disciplina">
              {{ disciplina }}
            </option>
          </select>
        </label>

        <label>
          Questões
          <input
            type="number"
            v-model="quantidadeQuestoes"
            min="1"
            max="20"
          />
        </label>

        <button @click="gerarSimulado" :disabled="loading">
          Gerar
        </button>
      </div>
    </div>

    <div v-if="modoAtivo === 'correcao'" class="tool-card">
      <div class="tool-title">
        <h3>Corrigir respostas</h3>
        <p>Cole suas respostas do simulado anterior.</p>
      </div>

      <textarea
        v-model="respostasAluno"
        placeholder="Ex:
```

1-A
2-C
3-B
4-D
5-E"
></textarea>

```
      <button class="wide-btn" @click="corrigirRespostas" :disabled="loading">
        Corrigir respostas
      </button>
    </div>

    <div v-if="modoAtivo === 'plano'" class="tool-card">
      <div class="tool-title">
        <h3>Plano de estudo do dia</h3>
        <p>Monte uma rotina simples para cumprir hoje.</p>
      </div>

      <div class="form-row two">
        <label>
          Tempo
          <input v-model="tempoEstudo" placeholder="Ex: 2 horas" />
        </label>

        <label>
          Foco
          <select v-model="focoEstudo">
            <option v-for="foco in focos" :key="foco">
              {{ foco }}
            </option>
          </select>
        </label>
      </div>

      <textarea
        v-model="dificuldadeEstudo"
        placeholder="Dificuldades. Ex: crase, constitucional e abuso de autoridade."
      ></textarea>

      <button class="wide-btn" @click="gerarPlanoDia" :disabled="loading">
        Gerar plano
      </button>
    </div>

    <div v-if="modoAtivo === 'flashcards'" class="tool-card flashcard-tool">
      <div class="tool-title">
        <h3>Flashcards interativos</h3>
        <p>Gere cards que viram para revisar pergunta, resposta e dica.</p>
      </div>

      <div class="form-row">
        <label>
          Tema
          <select v-model="temaFlashcards">
            <option v-for="tema in temasFlashcards" :key="tema">
              {{ tema }}
            </option>
          </select>
        </label>

        <label>
          Cards
          <input
            type="number"
            v-model="quantidadeFlashcards"
            min="3"
            max="30"
          />
        </label>

        <button @click="gerarFlashcards" :disabled="loading">
          Gerar
        </button>
      </div>

      <div v-if="flashcardsGerados.length" class="flashcard-study">
        <div class="flashcard-top">
          <span>
            Card {{ flashcardAtual + 1 }} de {{ flashcardsGerados.length }}
          </span>

          <div class="flashcard-top-actions">
            <button @click="falarFlashcardAtual">
              🔊 Ouvir
            </button>

            <button @click="embaralharFlashcards">
              Embaralhar
            </button>

            <button @click="limparFlashcards">
              Limpar
            </button>
          </div>
        </div>

        <div
          class="flip-card"
          :class="{ flipped: cardVirado }"
          @click="virarFlashcard"
        >
          <div class="flip-inner">
            <div class="flip-face flip-front">
              <span class="card-label">Pergunta</span>

              <h4>
                {{ flashcardsGerados[flashcardAtual].pergunta }}
              </h4>

              <small>Clique para ver a resposta</small>
            </div>

            <div class="flip-face flip-back">
              <span class="card-label">Resposta</span>

              <h4>
                {{ flashcardsGerados[flashcardAtual].resposta }}
              </h4>

              <div class="memory-tip">
                <strong>Dica de memorização</strong>
                <p>{{ flashcardsGerados[flashcardAtual].dica }}</p>
              </div>

              <small>Clique para voltar</small>
            </div>
          </div>
        </div>

        <div class="flashcard-controls">
          <button @click="flashcardAnterior">
            ← Anterior
          </button>

          <button @click="virarFlashcard">
            {{ cardVirado ? "Ver pergunta" : "Ver resposta" }}
          </button>

          <button @click="proximoFlashcard">
            Próximo →
          </button>
        </div>
      </div>

      <div v-else class="empty-flashcards">
        <strong>Nenhum flashcard gerado ainda.</strong>
        <p>
          Escolha um tema, clique em gerar e revise clicando no card para virar.
        </p>
      </div>
    </div>
  </section>

  <section class="chat-layout">
    <section class="chat-panel">
      <div class="chat-header">
        <div>
          <h3>Chat de estudo</h3>
          <p>Digite ou fale sua pergunta. A IA também pode ler as respostas.</p>
        </div>

        <div class="chat-voice-actions">
          <button @click="falarUltimaResposta" :disabled="loading">
            🔊 Ler última
          </button>

          <button @click="pararVoz" :disabled="!falando">
            ⏹ Parar
          </button>
        </div>
      </div>

      <div ref="chatRef" class="chat-area">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['message', msg.role]"
        >
          <div class="message-top">
            <div class="message-name">
              {{ msg.role === "user" ? "Você" : "Agente IA" }}
            </div>

            <button
              v-if="msg.role === 'assistant'"
              class="listen-message"
              @click="falarTexto(msg.content)"
              :disabled="loading"
              title="Ler esta resposta"
            >
              🔊
            </button>
          </div>

          <div
            class="markdown"
            v-html="formatarMarkdown(msg.content)"
          ></div>
        </div>

        <div v-if="loading" class="message assistant">
          <div class="message-top">
            <div class="message-name">Agente IA</div>
          </div>

          <div class="typing">
            <i></i>
            <i></i>
            <i></i>
          </div>
        </div>
      </div>

      <div class="composer">
        <button
          class="mic-btn"
          @click="iniciarDitado"
          :disabled="loading || ouvindo"
          title="Falar pergunta"
        >
          {{ ouvindo ? "🎙️" : "🎤" }}
        </button>

        <textarea
          v-model="message"
          placeholder="Digite ou fale sua pergunta. Ex: Me explique abuso de autoridade no estilo IDECAN."
          @keydown.enter.prevent="enviarMensagem()"
        ></textarea>

        <button @click="enviarMensagem()" :disabled="loading">
          {{ loading ? "..." : "Enviar" }}
        </button>
      </div>
    </section>

    <aside class="study-panel">
      <h3>Atalhos rápidos</h3>
      <p>Use quando quiser começar sem pensar muito.</p>

      <button
        v-for="prompt in promptsRapidos"
        :key="prompt"
        @click="enviarMensagem(prompt)"
        :disabled="loading"
      >
        {{ prompt }}
      </button>
    </aside>
  </section>
</section>
```

  </main>
</template>

<style>
:root {
  --bg: #f4f1ea;
  --surface: #ffffff;
  --surface-soft: #faf8f3;
  --surface-muted: #ebe4d8;
  --sidebar: #fbfaf7;

  --border: #ddd3c4;
  --border-strong: #c7b8a3;

  --text: #1f2933;
  --muted: #667085;
  --muted-2: #8a94a6;

  --primary: #1f3a5f;
  --primary-dark: #14263f;
  --primary-soft: #e7eef7;

  --accent: #2f6f4e;
  --accent-soft: #e8f3ec;

  --warning: #9a5b13;
  --warning-soft: #fff4df;

  --danger: #b4232f;
  --danger-soft: #fff0f2;

  --shadow: 0 18px 50px rgba(20, 38, 63, 0.10);
}

* {
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  min-height: 100%;
  margin: 0;
}

body {
  min-height: 100vh;
  font-family: Inter, Arial, sans-serif;
  color: var(--text);
  background:
    radial-gradient(circle at top left, rgba(31, 58, 95, 0.10), transparent 32%),
    radial-gradient(circle at bottom right, rgba(47, 111, 78, 0.10), transparent 35%),
    linear-gradient(135deg, #f7f3ea, #eef3f0);
  overflow-x: hidden;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
  transition: 0.18s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.app {
  width: 100%;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr);
}

.sidebar {
  min-height: 100vh;
  padding: 22px;
  background: rgba(255, 255, 255, 0.82);
  border-right: 1px solid var(--border);
  backdrop-filter: blur(16px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: #ffffff;
  font-size: 24px;
  font-weight: 900;
  box-shadow: 0 12px 28px rgba(31, 58, 95, 0.25);
}

.brand h1 {
  margin: 0;
  font-size: 23px;
}

.brand p {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.focus-card,
.voice-card {
  margin-top: 24px;
  padding: 16px;
  border-radius: 20px;
  background: var(--primary-soft);
  border: 1px solid #cbd8e6;
}

.focus-card span,
.focus-card strong,
.focus-card small {
  display: block;
}

.focus-card span,
.voice-card span {
  color: var(--primary-dark);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.focus-card strong {
  margin-top: 8px;
  font-size: 18px;
}

.focus-card small {
  margin-top: 5px;
  color: var(--muted);
}

.voice-card {
  display: grid;
  gap: 9px;
  background: var(--accent-soft);
  border-color: #c9e2d2;
}


.voice-card span {
  color: var(--accent);
}

.voice-card button {
  min-height: 40px;
  border: 1px solid #b8d7d2;
  border-radius: 13px;
  background: #ffffff;
  color: var(--text);
  font-weight: 800;
}

.clear-btn {
  width: 100%;
  margin-top: 20px;
  padding: 13px;
  border: 1px solid #fecdd3;
  border-radius: 15px;
  background: var(--danger-soft);
  color: var(--danger);
  font-weight: 800;
}

.workspace {
  width: 100%;
  min-width: 0;
  padding: 18px;
}

.topbar {
  min-height: 92px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 22px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: var(--shadow);
  backdrop-filter: blur(16px);
}

.eyebrow {
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.topbar h2 {
  margin: 6px 0 0;
  font-size: clamp(24px, 3vw, 38px);
  line-height: 1.05;
}

.status-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.status {
  white-space: nowrap;
  padding: 10px 13px;
  border-radius: 999px;
  background: var(--primary-soft);
  border: 1px solid #cbd8e6;
  color: var(--primary-dark);
  font-weight: 900;
  font-size: 13px;
}

.status.thinking {
  animation: pulse 1s infinite;
}

.status.listening {
  background: var(--warning-soft);
  border-color: #fed7aa;
  color: var(--warning);
}

.status.speaking {
  background: var(--accent-soft);
  border-color: #b8ebe4;
  color: var(--accent);
}

.mode-tabs {
  display: flex;
  gap: 10px;
  margin: 14px 0;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.04);
  overflow-x: auto;
}

.mode-tabs button {
  min-width: max-content;
  padding: 11px 16px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  color: var(--muted);
  font-weight: 800;
}

.mode-tabs button.active {
  color: #ffffff;
  background: linear-gradient(135deg, var(--primary), var(--accent));
}

.tool-section {
  margin-bottom: 14px;
}

.tool-card {
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow);
}

.tool-title h3 {
  margin: 0;
  font-size: 22px;
}

.tool-title p {
  margin: 5px 0 0;
  color: var(--muted);
}

.form-row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 110px 120px;
  gap: 12px;
  align-items: end;
  margin-top: 16px;
}

.form-row.two {
  grid-template-columns: 1fr 1fr;
}

label {
  display: grid;
  gap: 7px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 15px;
  background: #ffffff;
  color: var(--text);
  outline: none;
}

input,
select {
  height: 48px;
  padding: 0 13px;
}

textarea {
  min-height: 105px;
  margin-top: 14px;
  padding: 13px;
  resize: vertical;
  line-height: 1.5;
}

input:focus,
select:focus,
textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(31, 58, 95, 0.14);
}
.tool-card button,
.wide-btn,
.composer button,
.study-panel button {
  border: none;
  border-radius: 15px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: #ffffff;
  font-weight: 900;
}

.form-row button {
  height: 48px;
}

.wide-btn {
  width: 100%;
  min-height: 48px;
  margin-top: 12px;
}

.flashcard-tool {
  overflow: visible;
}

.flashcard-study {
  margin-top: 18px;
  padding: 16px;
  border-radius: 22px;
  background:
    radial-gradient(circle at top, rgba(37, 99, 235, 0.10), transparent 45%),
    #ffffff;
  border: 1px solid var(--border);
}

.flashcard-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.flashcard-top span {
  color: var(--primary-dark);
  font-weight: 900;
}

.flashcard-top-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.flashcard-top-actions button {
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface-soft);
  color: var(--text);
  font-weight: 900;
}

.flip-card {
  width: 100%;
  min-height: 300px;
  perspective: 1200px;
  cursor: pointer;
}

.flip-inner {
  position: relative;
  width: 100%;
  min-height: 300px;
  transition: transform 0.7s ease;
  transform-style: preserve-3d;
}

.flip-card.flipped .flip-inner {
  transform: rotateY(180deg);
}

.flip-face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 28px;
  border-radius: 24px;
  border: 1px solid var(--border);
  backface-visibility: hidden;
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.08);
}

.flip-front {
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.10), rgba(15, 118, 110, 0.08)),
    #ffffff;
}

.flip-back {
  transform: rotateY(180deg);
  background:
    linear-gradient(135deg, rgba(15, 118, 110, 0.10), rgba(37, 99, 235, 0.06)),
    #ffffff;
}

.card-label {
  width: max-content;
  margin-bottom: 16px;
  padding: 7px 12px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary-dark);
  border: 1px solid #c7d7fe;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.flip-face h4 {
  margin: 0;
  font-size: clamp(22px, 3vw, 34px);
  line-height: 1.25;
}

.flip-face small {
  margin-top: 20px;
  color: var(--muted);
}

.memory-tip {
  margin-top: 20px;
  padding: 14px;
  border-radius: 16px;
  background: var(--accent-soft);
  border: 1px solid #b8ebe4;
}

.memory-tip strong {
  color: var(--accent);
}

.memory-tip p {
  margin: 6px 0 0;
  color: var(--text);
}

.flashcard-controls {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-top: 14px;
}

.flashcard-controls button {
  min-height: 46px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #ffffff;
  color: var(--text);
  font-weight: 900;
}

.flashcard-controls button:nth-child(2) {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: #ffffff;
}

.empty-flashcards {
  margin-top: 18px;
  padding: 18px;
  border-radius: 20px;
  border: 1px dashed var(--border-strong);
  background: var(--surface-soft);
}

.empty-flashcards strong {
  color: var(--primary-dark);
}

.empty-flashcards p {
  margin: 6px 0 0;
  color: var(--muted);
}

.chat-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 14px;
  align-items: stretch;
}

.chat-panel,
.study-panel {
  border: 1px solid var(--border);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.chat-panel {
  min-width: 0;
  height: calc(100vh - 230px);
  min-height: 560px;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-soft);
}

.chat-header h3 {
  margin: 0;
  font-size: 22px;
}

.chat-header p {
  margin: 4px 0 0;
  color: var(--muted);
}

.chat-voice-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chat-voice-actions button {
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #ffffff;
  color: var(--primary-dark);
  font-weight: 900;
}

.chat-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px;
  background:
    linear-gradient(rgba(31, 58, 95, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(31, 58, 95, 0.035) 1px, transparent 1px),
    #fbfaf7;
  background-size: 26px 26px;
}

.message {
  max-width: 88%;
  margin-bottom: 14px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid var(--border);
}

.message.user {
  margin-left: auto;
  background: var(--primary-soft);
  border-color: #c7d7fe;
}

.message.assistant {
  margin-right: auto;
  background: #ffffff;
}

.message-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.message-name {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--primary-dark);
  font-size: 12px;
  font-weight: 900;
}

.listen-message {
  min-width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #ffffff;
  color: var(--primary-dark);
}

.markdown {
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.markdown p {
  margin: 0 0 10px;
}

.markdown p:last-child {
  margin-bottom: 0;
}

.markdown ul,
.markdown ol {
  padding-left: 22px;
}

.markdown li {
  margin-bottom: 6px;
}

.markdown strong,
.markdown h1,
.markdown h2,
.markdown h3 {
  color: var(--primary-dark);
}

.markdown code {
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--surface-muted);
  color: var(--primary-dark);
}

.typing {
  display: flex;
  gap: 6px;
  align-items: center;
}

.typing i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  animation: bounce 1s infinite ease-in-out;
}

.typing i:nth-child(2) {
  animation-delay: 0.15s;
}

.typing i:nth-child(3) {
  animation-delay: 0.3s;
}

.composer {
  display: grid;
  grid-template-columns: 54px 1fr 110px;
  gap: 12px;
  padding: 14px;
  border-top: 1px solid var(--border);
  background: var(--surface-soft);
}

.composer textarea {
  min-height: 62px;
  margin: 0;
}

.composer button {
  min-height: 62px;
}

.mic-btn {
  border: 1px solid var(--border) !important;
  background: #ffffff !important;
  color: var(--primary-dark) !important;
  font-size: 20px;
}

.study-panel {
  padding: 18px;
}

.study-panel h3 {
  margin: 0;
  font-size: 21px;
}

.study-panel p {
  margin: 6px 0 14px;
  color: var(--muted);
  line-height: 1.5;
}

.study-panel button {
  width: 100%;
  min-height: 48px;
  margin-top: 9px;
  padding: 12px;
  text-align: left;
  background: #ffffff;
  color: var(--text);
  border: 1px solid var(--border);
}

.study-panel button:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary-dark);
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }

  40% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.22);
  }

  100% {
    box-shadow: 0 0 0 12px rgba(37, 99, 235, 0);
  }
}

@media (max-width: 1100px) {
  .app {
    grid-template-columns: 1fr;
  }

  .sidebar {
    min-height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .chat-layout {
    grid-template-columns: 1fr;
  }

  .chat-panel {
    height: 620px;
  }

  .study-panel {
    display: none;
  }
}

@media (max-width: 760px) {
  .workspace {
    padding: 12px;
  }

  .topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-group {
    justify-content: flex-start;
  }

  .form-row,
  .form-row.two,
  .composer {
    grid-template-columns: 1fr;
  }

  .chat-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .message {
    max-width: 100%;
  }

  .chat-panel {
    min-height: 540px;
    height: 620px;
  }

  .composer button,
  .mic-btn {
    min-height: 48px;
  }

  .flashcard-top {
    align-items: flex-start;
    flex-direction: column;
  }

  .flashcard-controls {
    grid-template-columns: 1fr;
  }

  .flip-card,
  .flip-inner {
    min-height: 360px;
  }

  .flip-face {
    padding: 22px;
  }
}
</style>
