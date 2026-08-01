function isSimulationRequest(query) {
  return /modo simulado|questoes para responder|questões para responder/i.test(query);
}

export function formatIdecanCalibration(query) {
  if (!isSimulationRequest(query)) return "";

  return `
CALIBRAÇÃO IDECAN GCM - PARAÍBA
Use este perfil, extraído de provas IDECAN de Guardas Municipais de Campina Grande, Patos e João Pessoa, como critério obrigatório de elaboração.

NÍVEL E DISTRIBUIÇÃO
- Gere questões de nível intermediário ou avançado. Não crie item introdutório, de mera definição ou com resposta evidente.
- Em cada conjunto, priorize aproximadamente 70% de nível intermediário e 30% de nível avançado.
- Cada questão deve exigir pelo menos duas operações mentais: localizar a regra e aplicar exceção, comparar afirmativas, interpretar contexto, ou distinguir conceitos próximos.

FORMATO RECORRENTE
- Para o perfil de Campina Grande, use somente A, B, C e D.
- Alterne entre: múltiplas afirmativas I, II e III; alternativa correta/incorreta; preenchimento de lacunas; e situação prática curta ligada à atividade pública ou à Guarda Municipal.
- Em itens com afirmativas, cada assertiva deve ter fundamento próprio e os conjuntos de respostas devem ser plausíveis. Não use sempre o padrão de apenas uma correta.
- Em legislação, explore alcance da norma, sujeito competente, condição, exceção, prazo, percentual, efeito jurídico ou consequência. Não troque apenas uma palavra de forma óbvia.
- Em Português, prefira texto-base e cobre inferência, valor semântico, classe/função de palavra no contexto, regência, colocação, acentuação e reescrita gramatical.
- Em Raciocínio Lógico, prefira equivalência, negação, tabela-verdade, conjuntos, relações de ordem e problemas com condição adicional; evite cálculo de uma etapa.

CRITÉRIO DE QUALIDADE
- As quatro alternativas devem parecer defensáveis para quem domina o assunto superficialmente.
- Crie distratores baseados em exceções reais, competência de órgão diverso, requisito incompleto ou consequência jurídica parecida. Nunca use alternativas absurdas ou cômicas.
- Não repita enunciados, alternativas, dados numéricos ou gabaritos das provas de referência.
- Antes de responder, resolva silenciosamente cada item, verifique que só há uma resposta correta e rejeite qualquer questão ambígua, desatualizada ou fora da disciplina solicitada.
`;
}
