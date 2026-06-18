<script setup>
import { ref, watch, onMounted, nextTick, computed } from "vue";
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

function gerarId() {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

const perfil = ref(null);

const loginForm = ref({
  nome: "",
  email: "",
  banca: "IDECAN",
  cargo: "Guarda Civil Municipal",
  concurso: "Campina Grande - PB",
  objetivo: "Passar dentro das vagas",
});

const bancas = ["IDECAN", "CEBRASPE", "FGV", "FCC", "VUNESP", "IBFC", "AOCP"];

const cargos = [
  "Guarda Civil Municipal",
  "Agente Administrativo",
  "Professor",
  "Técnico Administrativo",
  "Policial Penal",
  "Agente de Trânsito",
];

const concursos = [
  "Campina Grande - PB",
  "Prefeitura Municipal",
  "Guarda Municipal",
  "Concurso Estadual",
  "Concurso Federal",
];

const sessoes = ref([]);
const sessaoAtivaId = ref(null);

const mensagem = ref("");
const loading = ref(false);
const chatRef = ref(null);

const falando = ref(false);
const ouvindo = ref(false);

const ferramentaAtiva = ref(null);

const disciplinaSimulado = ref("Lei 13.022/2014");
const quantidadeQuestoes = ref(5);
const respostasAluno = ref("");
const tempoEstudo = ref("2 horas");
const focoEstudo = ref("Legislação Extravagante");
const dificuldadeEstudo = ref("");

const temaFlashcards = ref("Lei 13.022/2014");
const quantidadeFlashcards = ref(10);

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

const sessaoAtiva = computed(() => {
  return sessoes.value.find((sessao) => sessao.id === sessaoAtivaId.value);
});

const mensagensAtivas = computed(() => {
  return sessaoAtiva.value?.messages || [];
});

const flashcardsAtivos = computed(() => {
  return sessaoAtiva.value?.flashcards || [];
});

const flashcardAtualDados = computed(() => {
  const sessao = sessaoAtiva.value;

  if (!sessao || !sessao.flashcards?.length) return null;

  return sessao.flashcards[sessao.flashcardAtual || 0];
});

const perguntasRapidas = computed(() => {
  const banca = perfil.value?.banca || "IDECAN";
  const cargo = perfil.value?.cargo || "GCM";

  return [
    `Crie 5 questões no estilo ${banca} para ${cargo}.`,
    `Explique como a banca ${banca} cobra Lei 13.022/2014.`,
    `Crie um resumo de revisão para ${cargo}.`,
    "Monte um plano de estudo para hoje.",
    "Crie flashcards sobre Legislação Extravagante.",
  ];
});

function contextoDoAluno() {
  if (!perfil.value) return "";

  return `Contexto fixo do aluno:
- Tipo de sistema: Agente de Estudos para Concursos.
- Nome do aluno: ${perfil.value.nome}.
- Banca escolhida: ${perfil.value.banca}.
- Cargo escolhido: ${perfil.value.cargo}.
- Concurso/Cidade: ${perfil.value.concurso}.
- Objetivo: ${perfil.value.objetivo}.

Instruções para a IA:
- Responda sempre focando no concurso, cargo e banca escolhidos.
- Quando a banca for IDECAN, use perfil de cobrança objetivo, interpretação cuidadosa, legislação seca e questões com pegadinhas moderadas.
- Quando o cargo for Guarda Civil Municipal, priorize Lei 13.022/2014, Constituição, Direitos Humanos, Direito Penal, Processo Penal, Legislação Extravagante, CTB, ECA, Maria da Penha e Abuso de Autoridade.
- Seja direto, didático e voltado para aprovação.`;
}

function normalizarSessao(sessao) {
  const mensagens = Array.isArray(sessao.messages) ? sessao.messages : [];

  const mensagensLimpas = mensagens.filter((msg) => {
    const conteudo = String(msg.content || "");

    const ehMensagemAntiga =
      msg.role === "assistant" &&
      conteudo.includes("Sou seu **Agente de Estudos para Concursos**") &&
      conteudo.includes("Perfil ativo:");

    return !ehMensagemAntiga;
  });

  return {
    id: sessao.id || gerarId(),
    title: sessao.title || "Nova conversa",
    createdAt: sessao.createdAt || new Date().toISOString(),
    updatedAt: sessao.updatedAt || new Date().toISOString(),
    messages: mensagensLimpas,
    flashcards: Array.isArray(sessao.flashcards) ? sessao.flashcards : [],
    flashcardAtual: Number.isInteger(sessao.flashcardAtual)
      ? sessao.flashcardAtual
      : 0,
    cardVirado: Boolean(sessao.cardVirado),
  };
}

function criarSessao(titulo = "Nova conversa") {
  const novaSessao = {
    id: gerarId(),
    title: titulo,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
    flashcards: [],
    flashcardAtual: 0,
    cardVirado: false,
  };

  sessoes.value.unshift(novaSessao);
  sessaoAtivaId.value = novaSessao.id;
  ferramentaAtiva.value = null;

  return novaSessao;
}

function selecionarSessao(id) {
  sessaoAtivaId.value = id;
  ferramentaAtiva.value = null;
  rolarChat();
}

function atualizarSessaoAtiva() {
  if (sessaoAtiva.value) {
    sessaoAtiva.value.updatedAt = new Date().toISOString();
  }
}

function removerSessao(id) {
  if (sessoes.value.length === 1) {
    limparSessao();
    return;
  }

  sessoes.value = sessoes.value.filter((sessao) => sessao.id !== id);

  if (sessaoAtivaId.value === id) {
    sessaoAtivaId.value = sessoes.value[0]?.id || null;
  }
}

function limparSessao() {
  if (!sessaoAtiva.value) return;

  pararVoz();

  sessaoAtiva.value.messages = [];
  sessaoAtiva.value.flashcards = [];
  sessaoAtiva.value.flashcardAtual = 0;
  sessaoAtiva.value.cardVirado = false;
  sessaoAtiva.value.title = "Nova conversa";

  atualizarSessaoAtiva();
}

function criarTituloInteligente(texto) {
  const textoLimpo = texto.replace(/\s+/g, " ").trim();

  if (textoLimpo.includes("Modo Simulado")) {
    return `Simulado: ${disciplinaSimulado.value}`;
  }

  if (textoLimpo.includes("Modo Correção")) {
    return "Correção de respostas";
  }

  if (textoLimpo.includes("Modo Plano de Estudo")) {
    return "Plano de estudo";
  }

  if (textoLimpo.toLowerCase().includes("flashcard")) {
    return `Flashcards: ${temaFlashcards.value}`;
  }

  return textoLimpo.slice(0, 38) || "Nova conversa";
}

function atualizarTituloSessao(texto) {
  const sessao = sessaoAtiva.value;

  if (!sessao) return;

  const titulosPadrao = ["Nova conversa", "Nova sessão", "Início dos estudos"];

  if (!titulosPadrao.includes(sessao.title)) return;

  sessao.title = criarTituloInteligente(texto);
}

function entrar() {
  if (!loginForm.value.nome.trim()) {
    alert("Digite seu nome para continuar.");
    return;
  }

  perfil.value = {
    id: gerarId(),
    nome: loginForm.value.nome.trim(),
    email: loginForm.value.email.trim(),
    banca: loginForm.value.banca,
    cargo: loginForm.value.cargo,
    concurso: loginForm.value.concurso,
    objetivo: loginForm.value.objetivo.trim() || "Passar no concurso",
  };

  localStorage.setItem("perfil-concurso-ia", JSON.stringify(perfil.value));

  if (!sessoes.value.length) {
    criarSessao("Início dos estudos");
  }

  if (!sessaoAtivaId.value && sessoes.value.length) {
    sessaoAtivaId.value = sessoes.value[0].id;
  }
}

function sair() {
  pararVoz();
  perfil.value = null;
  localStorage.removeItem("perfil-concurso-ia");
}

onMounted(() => {
  const perfilSalvo = localStorage.getItem("perfil-concurso-ia");
  const sessoesSalvas = localStorage.getItem("sessoes-concurso-ia");
  const sessaoAtivaSalva = localStorage.getItem("sessao-ativa-concurso-ia");

  if (perfilSalvo) {
    try {
      perfil.value = JSON.parse(perfilSalvo);
      loginForm.value = {
        ...loginForm.value,
        ...perfil.value,
      };
    } catch {
      perfil.value = null;
    }
  }

  if (sessoesSalvas) {
    try {
      const salvas = JSON.parse(sessoesSalvas);
      sessoes.value = Array.isArray(salvas)
        ? salvas.map((sessao) => normalizarSessao(sessao))
        : [];
    } catch {
      sessoes.value = [];
    }
  }

  if (sessaoAtivaSalva) {
    sessaoAtivaId.value = sessaoAtivaSalva;
  }

  if (perfil.value && !sessoes.value.length) {
    criarSessao("Início dos estudos");
  }

  if (perfil.value && sessoes.value.length && !sessaoAtiva.value) {
    sessaoAtivaId.value = sessoes.value[0].id;
  }

  carregarVozes();
  rolarChat();
});

watch(
  sessoes,
  () => {
    localStorage.setItem("sessoes-concurso-ia", JSON.stringify(sessoes.value));
    rolarChat();
  },
  { deep: true }
);

watch(sessaoAtivaId, () => {
  if (sessaoAtivaId.value) {
    localStorage.setItem("sessao-ativa-concurso-ia", sessaoAtivaId.value);
  }
});

async function rolarChat() {
  await nextTick();

  if (chatRef.value) {
    chatRef.value.scrollTop = chatRef.value.scrollHeight;
  }
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
  const ultimaResposta = [...mensagensAtivas.value]
    .reverse()
    .find((msg) => msg.role === "assistant");

  if (ultimaResposta) {
    falarTexto(ultimaResposta.content);
  }
}

function falarFlashcardAtual() {
  const card = flashcardAtualDados.value;

  if (!card || !sessaoAtiva.value) return;

  const texto = sessaoAtiva.value.cardVirado
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

    mensagem.value = mensagem.value
      ? `${mensagem.value} ${textoFalado}`
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
  if (!sessaoAtiva.value) return;

  sessaoAtiva.value.cardVirado = !sessaoAtiva.value.cardVirado;
  atualizarSessaoAtiva();
}

function proximoFlashcard() {
  const sessao = sessaoAtiva.value;

  if (!sessao?.flashcards?.length) return;

  sessao.cardVirado = false;

  sessao.flashcardAtual =
    sessao.flashcardAtual + 1 >= sessao.flashcards.length
      ? 0
      : sessao.flashcardAtual + 1;

  atualizarSessaoAtiva();
}

function flashcardAnterior() {
  const sessao = sessaoAtiva.value;

  if (!sessao?.flashcards?.length) return;

  sessao.cardVirado = false;

  sessao.flashcardAtual =
    sessao.flashcardAtual - 1 < 0
      ? sessao.flashcards.length - 1
      : sessao.flashcardAtual - 1;

  atualizarSessaoAtiva();
}

function embaralharFlashcards() {
  const sessao = sessaoAtiva.value;

  if (!sessao?.flashcards?.length) return;

  sessao.flashcards = [...sessao.flashcards].sort(() => Math.random() - 0.5);
  sessao.flashcardAtual = 0;
  sessao.cardVirado = false;

  atualizarSessaoAtiva();
}

function limparFlashcards() {
  if (!sessaoAtiva.value) return;

  sessaoAtiva.value.flashcards = [];
  sessaoAtiva.value.flashcardAtual = 0;
  sessaoAtiva.value.cardVirado = false;

  atualizarSessaoAtiva();
}

function gerarSimulado() {
  enviarMensagem(
    `Modo Simulado IDECAN: crie ${quantidadeQuestoes.value} questões sobre ${disciplinaSimulado.value}.

Contexto do aluno:
- banca: ${perfil.value?.banca};
- cargo: ${perfil.value?.cargo};
- concurso: ${perfil.value?.concurso}.

REGRA PRINCIPAL:
A disciplina escolhida manda no conteúdo. Não misture matérias.

PADRÃO OBRIGATÓRIO:
- Use apenas alternativas A, B, C e D.
- Não use alternativa E.
- Crie questões no estilo IDECAN.
- Não faça perguntas óbvias.
- Não faça perguntas de opinião.
- Não revele o gabarito agora.
- Não coloque comentários agora.
- Não diga qual alternativa está correta agora.

IMPORTANTE:
Este é um simulado para o aluno responder.
Portanto, entregue SOMENTE as questões.

Formato obrigatório:

Questão 1
[enunciado]

A) ...
B) ...
C) ...
D) ...

Questão 2
[enunciado]

A) ...
B) ...
C) ...
D) ...

No final, escreva apenas:
"Responda no formato 1-A, 2-B, 3-C... que eu corrijo para você."

Se a disciplina for Raciocínio Lógico:
- crie lógica pura;
- use equivalência lógica, negação, conectivos, tabela-verdade, conjuntos, sequências, porcentagem, razão ou proporção;
- não misture legislação, trânsito, abuso de autoridade ou conduta de guarda.

Antes de responder, revise:
- todas as questões pertencem à disciplina ${disciplinaSimulado.value}?
- há somente alternativas A, B, C e D?
- existe apenas uma correta?
- o gabarito NÃO apareceu na resposta?
- o estilo parece IDECAN?`
  );
}

function corrigirRespostas() {
  if (!respostasAluno.value.trim()) return;

  enviarMensagem(
    `Modo Correção de Simulado IDECAN.

Corrija minhas respostas com base no ÚLTIMO SIMULADO gerado nesta sessão.

Minhas respostas:
${respostasAluno.value}

Tarefas:
1. Identifique o último simulado nesta conversa.
2. Resolva novamente as questões para montar o gabarito correto.
3. Compare com minhas respostas.
4. Mostre quantas acertei e quantas errei.
5. Dê uma nota aproximada.
6. Mostre o gabarito completo somente agora.
7. Explique cada erro de forma curta e objetiva.
8. Informe os assuntos que devo revisar.

Formato da resposta:

Resultado:
- Acertos:
- Erros:
- Nota:

Gabarito:
1-A
2-B
3-C

Correção:
Questão 1:
- Minha resposta:
- Gabarito:
- Comentário:

Assuntos para revisar:
- ...

Contexto:
- banca: ${perfil.value?.banca};
- cargo: ${perfil.value?.cargo};
- concurso: ${perfil.value?.concurso}.`
  );

  respostasAluno.value = "";
}

function gerarPlanoDia() {
  enviarMensagem(
    `Modo Plano de Estudo: monte um plano de estudo para hoje.

Tempo disponível: ${tempoEstudo.value}
Foco principal: ${focoEstudo.value}
Minhas dificuldades: ${dificuldadeEstudo.value || "não informei"}

Contexto:
- banca: ${perfil.value?.banca};
- cargo: ${perfil.value?.cargo};
- concurso: ${perfil.value?.concurso};
- objetivo: ${perfil.value?.objetivo}.

Monte um plano simples, direto e possível de cumprir, com:
- blocos de estudo;
- teoria;
- questões;
- revisão;
- meta final do dia.`
  );
}

async function gerarFlashcards() {
  if (loading.value || !sessaoAtiva.value) return;

  const prompt = `${contextoDoAluno()}

Ferramenta interna: Flashcards.

Crie ${quantidadeFlashcards.value} flashcards sobre ${temaFlashcards.value}.

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
- Foque no que mais costuma cair na banca escolhida.
- Adapte para o cargo escolhido.
- Use linguagem simples.
- Não use markdown.
- Não coloque gabarito.
- Não explique fora do JSON.`;

  sessaoAtiva.value.messages.push({
    role: "user",
    content: `Criar ${quantidadeFlashcards.value} flashcards sobre ${temaFlashcards.value}.`,
  });

  atualizarTituloSessao(`Flashcards sobre ${temaFlashcards.value}`);

  loading.value = true;
  sessaoAtiva.value.flashcards = [];
  sessaoAtiva.value.flashcardAtual = 0;
  sessaoAtiva.value.cardVirado = false;
  atualizarSessaoAtiva();

  try {
    const history = mensagensAtivas.value.slice(0, -1).map((msg) => ({
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
      sessaoAtiva.value.messages.push({
        role: "assistant",
        content: `**Erro:** ${data.error}`,
      });
      return;
    }

    const cards = tentarLerFlashcards(data.answer);

    if (!cards.length) {
      sessaoAtiva.value.messages.push({
        role: "assistant",
        content:
          "Não consegui transformar a resposta em flashcards interativos. Tente gerar novamente.",
      });
      return;
    }

    sessaoAtiva.value.flashcards = cards;

    sessaoAtiva.value.messages.push({
      role: "assistant",
      content: `Criei **${cards.length} flashcards interativos** sobre **${temaFlashcards.value}** e salvei nesta sessão.`,
    });
  } catch {
    sessaoAtiva.value.messages.push({
      role: "assistant",
      content: `**Erro ao gerar flashcards.** Verifique se o backend está rodando em \`${API_URL}\`.`,
    });
  } finally {
    loading.value = false;
    atualizarSessaoAtiva();
  }
}

async function enviarMensagem(textoAtalho = null) {
  const texto = textoAtalho || mensagem.value;

  if (!texto.trim() || loading.value || !sessaoAtiva.value) return;

  sessaoAtiva.value.messages.push({
    role: "user",
    content: texto,
  });

  atualizarTituloSessao(texto);

  mensagem.value = "";
  loading.value = true;
  atualizarSessaoAtiva();

  try {
    const history = mensagensAtivas.value.slice(0, -1).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `${contextoDoAluno()}

Mensagem do aluno:
${texto}`,
        history,
      }),
    });

    const data = await response.json();

    if (data.error) {
      sessaoAtiva.value.messages.push({
        role: "assistant",
        content: `**Erro:** ${data.error}`,
      });
      return;
    }

    sessaoAtiva.value.messages.push({
      role: "assistant",
      content: data.answer || "A IA respondeu vazio. Tente novamente.",
    });
  } catch {
    sessaoAtiva.value.messages.push({
      role: "assistant",
      content: `**Erro ao conectar com o backend.** Verifique se o servidor está rodando em \`${API_URL}\`.`,
    });
  } finally {
    loading.value = false;
    atualizarSessaoAtiva();
  }
}
</script>

<template>
  <main v-if="!perfil" class="auth-page">
    <section class="auth-card">
      <div class="auth-copy">
        <div>
          <span class="eyebrow dark">Agente de estudos</span>

```
      <h1>Prepare seu concurso com estratégia</h1>

      <p>
        Configure sua banca, cargo e objetivo. O agente adapta questões,
        flashcards, planos e correções para sua preparação.
      </p>
    </div>

    <div class="auth-features">
      <div>
        <strong>IDECAN</strong>
        <span>Banca configurável</span>
      </div>

      <div>
        <strong>GCM</strong>
        <span>Foco em legislação</span>
      </div>

      <div>
        <strong>IA</strong>
        <span>Estudo guiado</span>
      </div>
    </div>
  </div>

  <form class="auth-form" @submit.prevent="entrar">
    <div class="form-head">
      <h2>Criar perfil</h2>
      <p>Seu ambiente de estudo será montado com essas informações.</p>
    </div>

    <label>
      Nome
      <input v-model="loginForm.nome" placeholder="Ex: Hugo" />
    </label>

    <label>
      E-mail
      <input v-model="loginForm.email" placeholder="seuemail@gmail.com" />
    </label>

    <div class="auth-grid">
      <label>
        Banca
        <select v-model="loginForm.banca">
          <option v-for="banca in bancas" :key="banca">
            {{ banca }}
          </option>
        </select>
      </label>

      <label>
        Cargo
        <select v-model="loginForm.cargo">
          <option v-for="cargo in cargos" :key="cargo">
            {{ cargo }}
          </option>
        </select>
      </label>
    </div>

    <label>
      Concurso/Cidade
      <select v-model="loginForm.concurso">
        <option v-for="concurso in concursos" :key="concurso">
          {{ concurso }}
        </option>
      </select>
    </label>

    <label>
      Objetivo
      <input
        v-model="loginForm.objetivo"
        placeholder="Ex: passar dentro das vagas"
      />
    </label>

    <button type="submit">
      Entrar no agente
    </button>

    <small>
      Nesta versão, o perfil fica salvo apenas no navegador. Depois podemos
      conectar login real com banco de dados.
    </small>
  </form>
</section>
```

  </main>

  <main v-else class="app">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-icon">A</div>

```
    <div>
      <h1>Agente IA</h1>
      <p>Estudos para concurso</p>
    </div>
  </div>

  <button class="new-chat" @click="criarSessao()">
    + Nova conversa
  </button>

  <section class="profile-card">
    <span>Perfil ativo</span>
    <strong>{{ perfil.banca }}</strong>
    <p>{{ perfil.cargo }}</p>
    <small>{{ perfil.concurso }}</small>
  </section>

  <section class="sessions">
    <div class="sessions-title">
      <span>Sessões</span>
    </div>

    <button
      v-for="sessao in sessoes"
      :key="sessao.id"
      class="session-item"
      :class="{ active: sessao.id === sessaoAtivaId }"
      @click="selecionarSessao(sessao.id)"
    >
      <span>{{ sessao.title }}</span>

      <button
        v-if="sessoes.length > 1"
        class="delete-session"
        @click.stop="removerSessao(sessao.id)"
        title="Excluir sessão"
      >
        ×
      </button>
    </button>
  </section>

  <div class="sidebar-actions">
    <button @click="falarUltimaResposta" :disabled="loading">
      🔊 Ler última
    </button>

    <button @click="limparSessao">
      Limpar sessão
    </button>

    <button class="logout" @click="sair">
      Sair
    </button>
  </div>
</aside>

<section class="workspace" :class="{ 'has-tool': ferramentaAtiva }">
  <header class="topbar">
    <div>
      <span class="eyebrow">Agente de Estudos para Concursos</span>
      <h2>{{ sessaoAtiva?.title || "Nova conversa" }}</h2>
      <p>
        {{ perfil.banca }} • {{ perfil.cargo }} • {{ perfil.concurso }}
      </p>
    </div>

    <div class="status-group">
      <div class="status" :class="{ thinking: loading }">
        {{ loading ? "Pensando..." : "Pronto" }}
      </div>

      <div v-if="ouvindo" class="status listening">
        Ouvindo...
      </div>

      <div v-if="falando" class="status speaking">
        Lendo...
      </div>
    </div>
  </header>

  <section class="tools-row">
    <button
      :class="{ active: ferramentaAtiva === 'simulado' }"
      @click="ferramentaAtiva = ferramentaAtiva === 'simulado' ? null : 'simulado'"
    >
      Simulado
    </button>

    <button
      :class="{ active: ferramentaAtiva === 'flashcards' }"
      @click="ferramentaAtiva = ferramentaAtiva === 'flashcards' ? null : 'flashcards'"
    >
      Flashcards
    </button>

    <button
      :class="{ active: ferramentaAtiva === 'plano' }"
      @click="ferramentaAtiva = ferramentaAtiva === 'plano' ? null : 'plano'"
    >
      Plano
    </button>

    <button
      :class="{ active: ferramentaAtiva === 'correcao' }"
      @click="ferramentaAtiva = ferramentaAtiva === 'correcao' ? null : 'correcao'"
    >
      Correção
    </button>
  </section>

  <section class="chat-panel">
    <div ref="chatRef" class="chat-area">
      <section v-if="!mensagensAtivas.length" class="welcome-card">
        <span class="welcome-kicker">Perfil pronto</span>

        <h3>Olá, {{ perfil.nome }}.</h3>

        <p>
          Seu agente está configurado para
          <strong>{{ perfil.banca }}</strong>,
          <strong>{{ perfil.cargo }}</strong> e
          <strong>{{ perfil.concurso }}</strong>.
        </p>

        <div class="welcome-actions">
          <button @click="enviarMensagem(`Crie 5 questões no estilo ${perfil.banca} para ${perfil.cargo}.`)">
            Criar questões
          </button>

          <button @click="ferramentaAtiva = 'flashcards'">
            Abrir flashcards
          </button>

          <button @click="gerarPlanoDia">
            Plano de hoje
          </button>
        </div>
      </section>

      <div
        v-for="(msg, index) in mensagensAtivas"
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

        <div class="markdown" v-html="formatarMarkdown(msg.content)"></div>
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

    <div class="quick-badges">
      <button
        v-for="prompt in perguntasRapidas"
        :key="prompt"
        @click="enviarMensagem(prompt)"
        :disabled="loading"
      >
        {{ prompt }}
      </button>
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
        v-model="mensagem"
        placeholder="Pergunte sobre seu concurso, peça questões, flashcards, plano ou correção..."
        @keydown.enter.prevent="enviarMensagem()"
      ></textarea>

      <button @click="enviarMensagem()" :disabled="loading">
        {{ loading ? "..." : "Enviar" }}
      </button>
    </div>
  </section>

  <aside v-if="ferramentaAtiva" class="tool-card">
    <div v-if="ferramentaAtiva === 'simulado'">
      <div class="tool-title">
        <span>Ferramenta</span>
        <h3>Gerar simulado</h3>
        <p>Questões adaptadas à banca e ao cargo escolhido.</p>
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
          Gerar simulado
        </button>
      </div>
    </div>

    <div v-if="ferramentaAtiva === 'plano'">
      <div class="tool-title">
        <span>Ferramenta</span>
        <h3>Plano de estudo</h3>
        <p>Monte uma rotina simples para o dia.</p>
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

    <div v-if="ferramentaAtiva === 'correcao'">
      <div class="tool-title">
        <span>Ferramenta</span>
        <h3>Correção</h3>
        <p>Cole suas respostas para receber análise dos erros.</p>
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
      <button
        class="wide-btn"
        @click="corrigirRespostas"
        :disabled="loading"
      >
        Corrigir respostas
      </button>
    </div>

    <div v-if="ferramentaAtiva === 'flashcards'">
      <div class="tool-title">
        <span>Ferramenta</span>
        <h3>Flashcards</h3>
        <p>Cards salvos apenas nesta sessão de estudo.</p>
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
          Criar flashcards
        </button>
      </div>

      <div
        v-if="flashcardsAtivos.length && flashcardAtualDados"
        class="flashcard-study"
      >
        <div class="flashcard-top">
          <span>
            Card {{ (sessaoAtiva?.flashcardAtual || 0) + 1 }} de
            {{ flashcardsAtivos.length }}
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
          :class="{ flipped: sessaoAtiva?.cardVirado }"
          @click="virarFlashcard"
        >
          <div class="flip-inner">
            <div class="flip-face flip-front">
              <span class="card-label">Pergunta</span>
              <h4>{{ flashcardAtualDados.pergunta }}</h4>
              <small>Clique para ver a resposta</small>
            </div>

            <div class="flip-face flip-back">
              <span class="card-label">Resposta</span>
              <h4>{{ flashcardAtualDados.resposta }}</h4>

              <div class="memory-tip">
                <strong>Dica</strong>
                <p>{{ flashcardAtualDados.dica }}</p>
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
            {{ sessaoAtiva?.cardVirado ? "Ver pergunta" : "Ver resposta" }}
          </button>

          <button @click="proximoFlashcard">
            Próximo →
          </button>
        </div>
      </div>
    </div>
  </aside>
</section>
```

  </main>
</template>

<style>
:root {
  --bg: #f4f1e8;
  --surface: #fffdf8;
  --surface-soft: #f7f3e8;
  --surface-hover: #eee7d6;

  --ink: #121510;
  --ink-2: #202719;
  --olive-900: #26301d;
  --olive-800: #354126;
  --olive-700: #465430;
  --olive-600: #5f6d3f;
  --olive-500: #7a8755;

  --sand-50: #fffdf8;
  --sand-100: #fbf8ef;
  --sand-200: #efe7d2;
  --sand-300: #ddd0b1;

  --border: #ded3b7;
  --border-strong: #c6b895;

  --text: #1f2419;
  --muted: #706f61;
  --muted-2: #9a9583;

  --accent: #5f6d3f;
  --accent-soft: #e9eddb;

  --danger: #b42318;
  --danger-soft: #fff1ee;

  --warning: #9a5b13;
  --warning-soft: #fff7e8;

  --success: #49663b;
  --success-soft: #eef5e8;

  --shadow: 0 20px 60px rgba(32, 39, 25, 0.11);
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
    radial-gradient(circle at top left, rgba(95, 109, 63, 0.15), transparent 32%),
    radial-gradient(circle at bottom right, rgba(198, 184, 149, 0.34), transparent 34%),
    var(--bg);
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
  transition: 0.16s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px;
}

.auth-card {
  width: min(1080px, 100%);
  min-height: 640px;
  display: grid;
  grid-template-columns: 1fr 430px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 34px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.auth-copy {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px;
  color: #fffaf0;
  background:
    linear-gradient(135deg, rgba(18, 21, 16, 0.97), rgba(38, 48, 29, 0.96)),
    radial-gradient(circle at top right, rgba(122, 135, 85, 0.36), transparent 38%);
  overflow: hidden;
}

.auth-copy::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: linear-gradient(to bottom, black, transparent 92%);
}

.auth-copy::after {
  content: "";
  position: absolute;
  right: -110px;
  bottom: -110px;
  width: 300px;
  height: 300px;
  border-radius: 999px;
  background: rgba(221, 208, 177, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.auth-copy > * {
  position: relative;
  z-index: 1;
}

.eyebrow {
  width: max-content;
  padding: 7px 11px;
  border: 1px solid #cfd8b6;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--olive-900);
  font-size: 11px;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: 0.13em;
}

.eyebrow.dark {
  border: 1px solid rgba(240, 234, 216, 0.2);
  background: rgba(240, 234, 216, 0.08);
  color: #efe7ce;
}

.auth-copy h1 {
  max-width: 600px;
  margin: 24px 0 16px;
  font-size: clamp(40px, 5vw, 68px);
  line-height: 0.95;
  letter-spacing: -0.06em;
}

.auth-copy p {
  max-width: 520px;
  margin: 0;
  color: #d8d2bd;
  font-size: 18px;
  line-height: 1.65;
}

.auth-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.auth-features div {
  padding: 14px;
  border: 1px solid rgba(240, 234, 216, 0.16);
  border-radius: 18px;
  background: rgba(240, 234, 216, 0.08);
  backdrop-filter: blur(10px);
}

.auth-features strong,
.auth-features span {
  display: block;
}

.auth-features strong {
  font-size: 18px;
  color: #fffaf0;
}

.auth-features span {
  margin-top: 4px;
  color: #d8d2bd;
  font-size: 12px;
  font-weight: 800;
}

.auth-form {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 13px;
  padding: 34px;
  background: var(--surface);
}

.form-head h2 {
  margin: 0;
  color: var(--ink);
  font-size: 30px;
  letter-spacing: -0.04em;
}

.form-head p {
  margin: 6px 0 8px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}

.auth-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

label {
  display: grid;
  gap: 7px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 850;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--sand-100);
  color: var(--text);
  outline: none;
}

input,
select {
  height: 48px;
  padding: 0 13px;
  font-weight: 750;
}

textarea {
  min-height: 102px;
  margin-top: 14px;
  padding: 12px;
  resize: vertical;
  line-height: 1.5;
}

input::placeholder,
textarea::placeholder {
  color: var(--muted-2);
}

input:focus,
select:focus,
textarea:focus {
  border-color: var(--olive-600);
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(95, 109, 63, 0.13);
}

.auth-form button {
  width: 100%;
  height: 52px;
  margin-top: 8px;
  border: none;
  border-radius: 16px;
  background: var(--ink);
  color: #fffaf0;
  font-size: 15px;
  font-weight: 950;
}

.auth-form button:hover:not(:disabled) {
  background: var(--olive-900);
}

.auth-form small {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
}

.app {
  width: 100%;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  background: var(--bg);
  overflow: hidden;
}

.sidebar {
  min-height: 100vh;
  padding: 18px 14px;
  border-right: 1px solid rgba(222, 211, 183, 0.8);
  background: var(--ink);
  color: #fffaf0;
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 4px 18px;
  border-bottom: 1px solid rgba(255, 250, 240, 0.1);
}

.brand-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: linear-gradient(135deg, var(--sand-300), var(--olive-500));
  color: var(--ink);
  font-size: 21px;
  font-weight: 950;
}

.brand h1 {
  margin: 0;
  color: #fffaf0;
  font-size: 19px;
  letter-spacing: -0.03em;
}

.brand p {
  margin: 2px 0 0;
  color: #b8b19d;
  font-size: 12px;
}

.new-chat {
  width: 100%;
  min-height: 44px;
  margin: 16px 0 14px;
  border: 1px solid rgba(255, 250, 240, 0.1);
  border-radius: 14px;
  background: #fffaf0;
  color: var(--ink);
  font-size: 15px;
  font-weight: 950;
}

.new-chat:hover {
  background: var(--sand-200);
}

.profile-card {
  padding: 15px;
  border: 1px solid rgba(255, 250, 240, 0.1);
  border-radius: 18px;
  background: rgba(255, 250, 240, 0.06);
  text-align: center;
}

.profile-card span,
.sessions-title span {
  color: #b8b19d;
  font-size: 11px;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.profile-card strong,
.profile-card p,
.profile-card small {
  display: block;
}

.profile-card strong {
  margin-top: 9px;
  color: #fffaf0;
  font-size: 18px;
}

.profile-card p {
  margin: 6px 0 4px;
  color: #efe7ce;
  font-size: 14px;
}

.profile-card small {
  color: #b8b19d;
  font-size: 13px;
}

.sessions {
  margin-top: 18px;
  min-height: 0;
  overflow-y: auto;
  flex: 1;
}

.sessions::-webkit-scrollbar {
  width: 5px;
}

.sessions::-webkit-scrollbar-thumb {
  background: rgba(255, 250, 240, 0.16);
  border-radius: 999px;
}

.sessions-title {
  margin-bottom: 8px;
  padding: 0 6px;
}

.session-item {
  width: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: #efe7ce;
  text-align: left;
  font-size: 14px;
}

.session-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-item:hover,
.session-item.active {
  background: rgba(255, 250, 240, 0.08);
  border-color: rgba(255, 250, 240, 0.12);
}

.delete-session {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #b8b19d;
  font-weight: 900;
}

.delete-session:hover {
  background: rgba(180, 35, 24, 0.14);
  color: #ffb4ab;
}

.sidebar-actions {
  display: grid;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 250, 240, 0.1);
}

.sidebar-actions button {
  min-height: 39px;
  border: 1px solid rgba(255, 250, 240, 0.1);
  border-radius: 12px;
  background: rgba(255, 250, 240, 0.06);
  color: #efe7ce;
  font-size: 14px;
  font-weight: 850;
}

.sidebar-actions button:hover:not(:disabled) {
  background: rgba(255, 250, 240, 0.1);
}

.sidebar-actions .logout {
  color: #ffb4ab;
}

.workspace {
  height: 100vh;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px 20px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto minmax(0, 1fr);
  grid-template-areas:
    "topbar"
    "tools"
    "chat";
  gap: 12px;
  overflow: hidden;
}

.workspace.has-tool {
  grid-template-columns: minmax(0, 1fr) 410px;
  grid-template-areas:
    "topbar topbar"
    "tools tools"
    "chat tool";
}

.topbar {
  grid-area: topbar;
  min-height: 104px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: rgba(255, 253, 248, 0.96);
  box-shadow: 0 14px 36px rgba(32, 39, 25, 0.08);
}

.topbar h2 {
  max-width: 820px;
  margin: 8px 0 2px;
  color: var(--ink);
  font-size: clamp(24px, 3vw, 32px);
  line-height: 1.05;
  letter-spacing: -0.04em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.status-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.status {
  white-space: nowrap;
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--success-soft);
  border: 1px solid #cfe2c6;
  color: var(--success);
  font-weight: 950;
  font-size: 12px;
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
  border-color: #cfd8b6;
  color: var(--olive-900);
}

.tools-row {
  grid-area: tools;
  display: flex;
  gap: 8px;
  padding: 2px 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.tools-row::-webkit-scrollbar {
  display: none;
}

.tools-row button {
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink-2);
  font-size: 14px;
  font-weight: 900;
  white-space: nowrap;
}

.tools-row button.active {
  background: var(--ink);
  border-color: var(--ink);
  color: #fffaf0;
}

.chat-panel {
  grid-area: chat;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: var(--surface);
  box-shadow: 0 18px 46px rgba(32, 39, 25, 0.08);
  overflow: hidden;
}

.chat-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 34px 28px 20px;
  background: var(--surface);
}

.chat-area::-webkit-scrollbar,
.tool-card::-webkit-scrollbar {
  width: 8px;
}

.chat-area::-webkit-scrollbar-track,
.tool-card::-webkit-scrollbar-track {
  background: transparent;
}

.chat-area::-webkit-scrollbar-thumb,
.tool-card::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 999px;
}

.welcome-card {
  max-width: 820px;
  margin: 32px auto;
  padding: 30px;
  border: 1px solid var(--border);
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(95, 109, 63, 0.12), transparent 40%),
    var(--sand-100);
  box-shadow: 0 18px 44px rgba(32, 39, 25, 0.07);
}

.welcome-kicker {
  width: max-content;
  display: inline-flex;
  padding: 7px 11px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--olive-900);
  font-size: 11px;
  font-weight: 950;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.welcome-card h3 {
  margin: 18px 0 10px;
  color: var(--ink);
  font-size: clamp(30px, 4vw, 46px);
  line-height: 1;
  letter-spacing: -0.05em;
}

.welcome-card p {
  max-width: 650px;
  margin: 0;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.7;
}

.welcome-card p strong {
  color: var(--ink);
}

.welcome-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 22px;
}

.welcome-actions button {
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #ffffff;
  color: var(--ink);
  font-weight: 900;
}

.welcome-actions button:first-child {
  background: var(--ink);
  color: #fffaf0;
  border-color: var(--ink);
}

.message {
  max-width: 840px;
  margin: 0 auto 24px;
  padding: 0;
}

.message-top {
  width: 100%;
  max-width: 840px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.message.user {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message.user .message-top {
  justify-content: flex-end;
}

.message-name {
  display: inline-block;
  padding: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  font-weight: 950;
}

.message.assistant .markdown {
  max-width: 840px;
  color: var(--text);
  font-size: 16px;
  line-height: 1.78;
}

.message.user .markdown {
  max-width: 72%;
  padding: 12px 15px;
  border: 1px solid #cfd8b6;
  border-radius: 18px 18px 4px 18px;
  background: var(--accent-soft);
  color: var(--ink-2);
}

.listen-message {
  width: 30px;
  height: 30px;
  min-width: 30px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-soft);
}

.markdown {
  line-height: 1.78;
  overflow-wrap: anywhere;
}

.markdown p {
  margin: 0 0 12px;
}

.markdown p:last-child {
  margin-bottom: 0;
}

.markdown ul,
.markdown ol {
  margin-top: 8px;
  margin-bottom: 8px;
  padding-left: 22px;
}

.markdown li {
  margin-bottom: 6px;
}

.markdown strong,
.markdown h1,
.markdown h2,
.markdown h3 {
  color: var(--ink);
}

.markdown code {
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--surface-soft);
  color: var(--olive-900);
}

.typing {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px 0;
}

.typing i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--olive-600);
  animation: bounce 1s infinite ease-in-out;
}

.typing i:nth-child(2) {
  animation-delay: 0.15s;
}

.typing i:nth-child(3) {
  animation-delay: 0.3s;
}

.quick-badges {
  max-width: 880px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  gap: 8px;
  padding: 10px 14px 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.quick-badges::-webkit-scrollbar {
  display: none;
}

.quick-badges button {
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--sand-100);
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 850;
  white-space: nowrap;
}

.quick-badges button:hover:not(:disabled) {
  background: var(--accent-soft);
  color: var(--ink);
  border-color: #cfd8b6;
}

.composer {
  max-width: 880px;
  width: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 48px 1fr 92px;
  gap: 10px;
  padding: 10px 14px 16px;
}

.composer textarea {
  min-height: 58px;
  max-height: 150px;
  margin: 0;
  padding: 16px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid var(--border);
  color: var(--text);
  box-shadow: 0 8px 22px rgba(32, 39, 25, 0.04);
}

.composer textarea:focus {
  border-color: var(--olive-600);
  box-shadow: 0 0 0 4px rgba(95, 109, 63, 0.12);
}

.composer button {
  min-height: 58px;
  border: none;
  border-radius: 16px;
  background: var(--ink);
  color: #fffaf0;
  font-size: 14px;
  font-weight: 950;
}

.composer button:hover:not(:disabled) {
  background: var(--olive-900);
}

.mic-btn {
  border: 1px solid var(--border) !important;
  background: var(--sand-100) !important;
  color: var(--ink) !important;
  font-size: 18px;
}

.tool-card {
  grid-area: tool;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: var(--surface);
  box-shadow: 0 18px 46px rgba(32, 39, 25, 0.08);
}

.tool-title {
  margin-bottom: 16px;
}

.tool-title span {
  display: inline-flex;
  width: max-content;
  margin-bottom: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--olive-900);
  font-size: 11px;
  font-weight: 950;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.tool-title h3 {
  margin: 0;
  color: var(--ink);
  font-size: 23px;
  letter-spacing: -0.03em;
}

.tool-title p {
  margin: 5px 0 0;
  color: var(--muted);
  line-height: 1.5;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  align-items: end;
  margin-top: 14px;
}

.form-row.two {
  grid-template-columns: 1fr;
}

.form-row button,
.wide-btn {
  min-height: 48px;
  border: none;
  border-radius: 14px;
  background: var(--ink);
  color: #fffaf0;
  font-weight: 950;
}

.form-row button:hover:not(:disabled),
.wide-btn:hover:not(:disabled) {
  background: var(--olive-900);
}

.wide-btn {
  width: 100%;
  margin-top: 12px;
}

.tool-card textarea {
  min-height: 140px;
}

.flashcard-study {
  margin-top: 16px;
  padding: 15px;
  border-radius: 20px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
}

.flashcard-top {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.flashcard-top span {
  color: var(--olive-900);
  font-weight: 950;
}

.flashcard-top-actions {
  width: 100%;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.flashcard-top-actions button {
  flex: 1;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #ffffff;
  color: var(--text);
  font-weight: 900;
}

.flip-card {
  width: 100%;
  min-height: 320px;
  perspective: 1200px;
  cursor: pointer;
}

.flip-inner {
  position: relative;
  width: 100%;
  min-height: 320px;
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
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background:
    linear-gradient(135deg, rgba(95, 109, 63, 0.08), transparent 46%),
    #ffffff;
  backface-visibility: hidden;
  box-shadow: 0 14px 34px rgba(32, 39, 25, 0.08);
}

.flip-back {
  transform: rotateY(180deg);
}

.card-label {
  width: max-content;
  margin-bottom: 14px;
  padding: 6px 11px;
  border: 1px solid #cfd8b6;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--olive-900);
  font-size: 12px;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.flip-face h4 {
  margin: 0;
  font-size: clamp(20px, 2vw, 28px);
  line-height: 1.25;
  letter-spacing: -0.03em;
}

.flip-face small {
  margin-top: 18px;
  color: var(--muted);
}

.memory-tip {
  margin-top: 18px;
  padding: 14px;
  border-radius: 16px;
  background: var(--success-soft);
  border: 1px solid #cfe2c6;
}

.memory-tip strong {
  color: var(--success);
}

.memory-tip p {
  margin: 6px 0 0;
  color: var(--text);
}

.flashcard-controls {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 12px;
}

.flashcard-controls button {
  min-height: 44px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #ffffff;
  color: var(--text);
  font-weight: 900;
}

.flashcard-controls button:nth-child(2) {
  background: var(--ink);
  color: #fffaf0;
  border-color: var(--ink);
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }

  40% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(95, 109, 63, 0.2);
  }

  100% {
    box-shadow: 0 0 0 12px rgba(95, 109, 63, 0);
  }
}

@media (max-width: 1180px) {
  .workspace.has-tool {
    grid-template-columns: minmax(0, 1fr) 360px;
  }
}

@media (max-width: 1050px) {
  .app {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .sidebar {
    min-height: auto;
    max-height: none;
    border-right: none;
    border-bottom: 1px solid rgba(255, 250, 240, 0.1);
  }

  .workspace,
  .workspace.has-tool {
    height: auto;
    min-height: 100vh;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    overflow: visible;
  }

  .chat-panel {
    min-height: 650px;
  }

  .tool-card {
    height: auto;
    max-height: none;
  }

  .auth-card {
    grid-template-columns: 1fr;
  }

  .auth-copy {
    min-height: 420px;
  }
}

@media (max-width: 720px) {
  .auth-page,
  .workspace {
    padding: 10px;
  }

  .auth-card {
    min-height: auto;
    grid-template-columns: 1fr;
    border-radius: 24px;
  }

  .auth-copy {
    min-height: 360px;
    padding: 28px;
  }

  .auth-features {
    grid-template-columns: 1fr;
  }

  .auth-form {
    padding: 22px;
  }

  .auth-grid,
  .composer {
    grid-template-columns: 1fr;
  }

  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .topbar h2 {
    max-width: 100%;
    white-space: normal;
  }

  .status-group {
    justify-content: flex-start;
  }

  .message.user .markdown {
    max-width: 100%;
  }

  .composer button,
  .mic-btn {
    min-height: 48px;
  }

  .flip-card,
  .flip-inner {
    min-height: 340px;
  }
}
</style>
