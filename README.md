# Agente GCM IA

Aplicação de estudos para concursos com frontend Vue/Vite e API Express integrada a um modelo da NVIDIA.

## Desenvolvimento

1. No diretório `backend`, copie `.env.example` para `.env`, informe `NVIDIA_API_KEY` e execute `npm ci` seguido de `npm start`.
2. No diretório `frontend`, copie `.env.example` para `.env`, informe a URL local da API e execute `npm ci` seguido de `npm run dev`.

## Deploy

### Render (backend)

Configure as variáveis de ambiente:

- `NVIDIA_API_KEY`: chave privada do provedor. Nunca a adicione ao Git ou ao Vercel.
- `NVIDIA_MODEL`: modelo disponível na sua conta NVIDIA. Prefira um modelo de maior capacidade para tarefas jurídicas e de correção.
- `PORT`: fornecida automaticamente pelo Render quando aplicável.
- `CORS_ORIGINS`: domínio exato do frontend, por exemplo `https://seu-projeto.vercel.app`. Para múltiplos domínios, separe por vírgula.
- `REFERENCE_DIR`: diretório persistente que contém as referências RAG, por exemplo `/var/data/references`.

Use `npm ci` como build command e `npm start` como start command. Configure o health check como `/healthz`. Para manter o acervo RAG após deploys, adicione um Persistent Disk montado em `/var/data` e use `REFERENCE_DIR=/var/data/references`.

### Vercel (frontend)

Configure `VITE_API_URL` com a URL HTTPS pública do serviço no Render, sem barra final. Faça novo deploy após alterar a variável, pois as variáveis `VITE_` são incorporadas no build.

## Segurança

- Revogue e substitua qualquer chave NVIDIA que já tenha sido enviada ao repositório.
- O endpoint ainda precisa de autenticação e rate limiting antes de ser exposto a usuários públicos.
- O modelo não substitui a consulta a legislação, edital e jurisprudência oficiais vigentes.

## Base de Referências IDECAN

O backend recupera trechos relevantes de provas oficiais para calibrar os simulados por assunto. Em desenvolvimento, os documentos ficam em `backend/data`; em produção no Render, use o Persistent Disk configurado em `REFERENCE_DIR`. O acervo não é enviado ao Git.

1. Coloque um PDF oficial com texto pesquisável em `backend/data/sources`.
2. No diretório `backend`, execute:

```bash
npm run import:reference -- --input data/sources/prova-gcm.pdf --title "Prova GCM - IDECAN" --topic "Lei 13.022/2014, Direito Constitucional" --source-url "https://url-oficial-da-prova"
```

3. O importador gera um JSON em `backend/data/references`. Em pedidos no modo simulado, a API seleciona até três referências aderentes ao assunto.

PDFs escaneados precisam de OCR antes da importação. A referência serve para aprender estilo e distribuição de cobrança; a API instrui o modelo a não reproduzir questões, alternativas ou gabaritos.

No Render, importe pelo Shell usando um caminho do disco persistente, por exemplo `REFERENCE_DIR=/var/data/references npm run import:reference -- --input /var/data/sources/prova-gcm.pdf --title "Prova GCM - IDECAN" --topic "Lei 13.022/2014"`.
