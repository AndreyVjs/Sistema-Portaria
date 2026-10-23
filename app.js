/*
 * CONTROLE DE ACESSO — PORTARIA
 * ------------------------------------------------------------------
 * Protótipo de front-end. Todos os dados ficam na memória desta página.
 * Não há servidor, banco de dados nem comunicação entre aparelhos.
 *
 * FLUXO PRINCIPAL:
 * 1. Morador cria uma autorização e compartilha o código.
 * 2. Portaria 1 valida o código/placa e confirma a passagem principal.
 * 3. O protótipo mostra um aviso na área do morador e envia a chegada
 *    para a fila da Portaria 2 (tudo apenas neste mesmo navegador).
 * 4. Portaria 2 registra a chegada ao grupo e conclui o chamado.
 *
 * STATUS DOS CHAMADOS:
 * ativo             = esperando validação na Portaria 1
 * aguardando_grupo  = passagem principal confirmada; esperando Portaria 2
 * concluido         = chegada ao grupo registrada
 * expirado          = autorização venceu antes da validação
 *
 * ORGANIZAÇÃO DO ARQUIVO:
 * 1. Estado e utilitários
 * 2. Renderização e dashboard
 * 3. Avisos temporários e notificação demonstrativa do morador
 * 4. QR ilustrativo e compartilhamento
 * 5. Eventos do Morador
 * 6. Eventos da Portaria 1
 * 7. Eventos da Portaria 2
 * 8. Navegação e inicialização
 */

// ================================================================
// 1. ESTADO E UTILITÁRIOS
// ================================================================

const buscarElemento = (id) => document.getElementById(id);

// Chamados de demonstração para que o protótipo abra com conteúdo.
let chamados = [
  {
    id: "CH-001", apartamento: "12B", tipo: "Entregador",
    placa: "ABC1D23", nome: "iFood - João", codigo: "111111",
    criadoEm: Date.now(), validadeMin: 60,
    preferenciaLigacao: false, status: "ativo"
  },
  {
    id: "CH-002", apartamento: "7A", tipo: "Motorista",
    placa: "", nome: "Uber Eats - Bike", codigo: "222222",
    criadoEm: Date.now(), validadeMin: 30,
    preferenciaLigacao: true, status: "ativo"
  }
];

let chamadoSelecionadoNaPortaria = null;
let temporizadorAvisoPortaria1 = null;
let temporizadorAvisoPortaria2 = null;
let temporizadorAvisoCompartilhamento = null;
let historicoMovimentacoes = [];
let notificacaoMoradorNaoLida = false;

function gerarCodigoDeAcesso() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function gerarIdentificadorChamado() {
  const maiorNumero = chamados.reduce((maior, chamado) => {
    const numero = Number(chamado.id.replace("CH-", "")) || 0;
    return Math.max(maior, numero);
  }, 0);
  return `CH-${String(maiorNumero + 1).padStart(3, "0")}`;
}

function chamadoEstaValido(chamado) {
  if (!chamado || chamado.status !== "ativo") return false;
  const horarioDeExpiracao = chamado.criadoEm + chamado.validadeMin * 60_000;
  return Date.now() <= horarioDeExpiracao;
}

function calcularMinutosRestantes(chamado) {
  const horarioDeExpiracao = chamado.criadoEm + chamado.validadeMin * 60_000;
  return Math.max(0, Math.ceil((horarioDeExpiracao - Date.now()) / 60_000));
}

function escaparTexto(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, caractere => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[caractere]);
}

function registrarMovimentacao(chamado, titulo, estado) {
  historicoMovimentacoes.unshift({
    titulo,
    detalhe: `${chamado.id} · Ap. ${chamado.apartamento} · ${chamado.nome || chamado.tipo}`,
    estado
  });
  historicoMovimentacoes = historicoMovimentacoes.slice(0, 6);
}

// ================================================================
// 2. RENDERIZAÇÃO DAS LISTAS, MENU E DASHBOARD
// ================================================================

function renderizarChamadosDaPortaria1() {
  const lista = buscarElemento("lista-chamados");
  const mensagemVazia = buscarElemento("vazio");
  if (!lista || !mensagemVazia) return;

  lista.replaceChildren();
  const ativos = chamados.filter(chamado =>
    chamado.status === "ativo" && chamadoEstaValido(chamado)
  );
  mensagemVazia.classList.toggle("escondido", ativos.length > 0);

  ativos.forEach(chamado => {
    const item = document.createElement("li");
    item.innerHTML = `
      <strong>${escaparTexto(chamado.id)}</strong> — Ap. ${escaparTexto(chamado.apartamento)}
      <span class="tag">${calcularMinutosRestantes(chamado)} min</span><br>
      Tipo: ${escaparTexto(chamado.tipo)} | Placa: ${escaparTexto(chamado.placa || "—")}<br>
      Pessoa: ${escaparTexto(chamado.nome || chamado.tipo)}
    `;
    lista.appendChild(item);
  });
}

function renderizarFilaDaPortaria2() {
  const lista = buscarElemento("lista-portaria2");
  const mensagemVazia = buscarElemento("vazio-p2");
  if (!lista || !mensagemVazia) return;

  lista.replaceChildren();
  const aguardando = chamados.filter(chamado => chamado.status === "aguardando_grupo");
  mensagemVazia.classList.toggle("escondido", aguardando.length > 0);

  aguardando.forEach(chamado => {
    const item = document.createElement("li");
    const avisoLigacao = chamado.preferenciaLigacao
      ? '<span class="pref-ligacao">morador solicitou ligação</span>' : "";
    item.innerHTML = `
      <strong>${escaparTexto(chamado.id)}</strong> — Ap. ${escaparTexto(chamado.apartamento)}
      <span class="tipo">${escaparTexto(chamado.tipo)}</span>${avisoLigacao}<br>
      Pessoa: ${escaparTexto(chamado.nome || chamado.tipo)} |
      Placa: ${escaparTexto(chamado.placa || "—")}
      <div class="acoes">
        ${chamado.preferenciaLigacao ? `<button data-acao="ligar" data-id="${chamado.id}" class="secundario">Orientação para ligar ao apartamento</button>` : ""}
        <button data-acao="concluir" data-id="${chamado.id}">Registrar chegada ao grupo</button>
      </div>
    `;
    lista.appendChild(item);
  });
}

function atualizarIndicadorMenu(id, quantidade) {
  const indicador = buscarElemento(id);
  if (!indicador) return;
  indicador.textContent = quantidade > 0 ? (quantidade > 9 ? "9+" : String(quantidade)) : "";
  indicador.classList.toggle("visivel", quantidade > 0);
  indicador.setAttribute("aria-hidden", quantidade > 0 ? "false" : "true");
}

function atualizarDashboardCentral() {
  const quantidadeAtiva = chamados.filter(chamado => chamado.status === "ativo").length;
  const quantidadeAguardando = chamados.filter(chamado => chamado.status === "aguardando_grupo").length;
  const quantidadeConcluida = chamados.filter(chamado => chamado.status === "concluido").length;

  if (buscarElemento("dash-ativos")) buscarElemento("dash-ativos").textContent = quantidadeAtiva;
  if (buscarElemento("dash-grupo")) buscarElemento("dash-grupo").textContent = quantidadeAguardando;
  // O número inicial é fictício, apenas para apresentação do protótipo.
  if (buscarElemento("dash-concluidos")) buscarElemento("dash-concluidos").textContent = 12 + quantidadeConcluida;

  atualizarIndicadorMenu("badge-morador", notificacaoMoradorNaoLida ? 1 : 0);
  atualizarIndicadorMenu("badge-portaria2", quantidadeAguardando);
  atualizarIndicadorMenu("badge-chamados", quantidadeAtiva);

  const listaRecente = buscarElemento("dash-recentes");
  if (!listaRecente) return;
  const movimentacoes = historicoMovimentacoes.length
    ? historicoMovimentacoes
    : chamados.slice().reverse().slice(0, 4).map(chamado => ({
        titulo: "Autorização de demonstração",
        detalhe: `${chamado.id} · Ap. ${chamado.apartamento} · ${chamado.nome || chamado.tipo}`,
        estado: chamado.status === "ativo" ? "Ativo" : chamado.status
      }));

  listaRecente.innerHTML = movimentacoes.map(movimentacao => `
    <div class="recent-item">
      <span class="recent-status">${movimentacao.estado === "Concluído" ? "✓" : "•"}</span>
      <div class="recent-info"><b>${escaparTexto(movimentacao.titulo)}</b>
      <small>${escaparTexto(movimentacao.detalhe)}</small></div>
      <span class="recent-state">${escaparTexto(movimentacao.estado)}</span>
    </div>
  `).join("");
}

function atualizarInterface() {
  renderizarChamadosDaPortaria1();
  renderizarFilaDaPortaria2();
  atualizarDashboardCentral();
}

function expirarAutorizacoesVencidas() {
  let houveMudanca = false;
  chamados.forEach(chamado => {
    if (chamado.status === "ativo" && !chamadoEstaValido(chamado)) {
      chamado.status = "expirado";
      houveMudanca = true;
    }
  });
  if (houveMudanca) atualizarInterface();
}

// ================================================================
// 3. AVISOS TEMPORÁRIOS E NOTIFICAÇÃO DEMONSTRATIVA DO MORADOR
// ================================================================

function mostrarAvisoTemporario(idElemento, mensagem, duracaoMs, nomeTemporizador) {
  const aviso = buscarElemento(idElemento);
  if (!aviso) return;

  if (nomeTemporizador === "portaria1" && temporizadorAvisoPortaria1) clearTimeout(temporizadorAvisoPortaria1);
  if (nomeTemporizador === "portaria2" && temporizadorAvisoPortaria2) clearTimeout(temporizadorAvisoPortaria2);
  aviso.textContent = mensagem;
  aviso.classList.remove("escondido");

  const ocultar = () => aviso.classList.add("escondido");
  const temporizador = setTimeout(ocultar, duracaoMs);
  if (nomeTemporizador === "portaria1") temporizadorAvisoPortaria1 = temporizador;
  if (nomeTemporizador === "portaria2") temporizadorAvisoPortaria2 = temporizador;
}

function notificarMoradorDaChegada(chamado) {
  const aviso = buscarElemento("notificacao-morador");
  if (!aviso) return;

  // É uma notificação visual dentro desta página, não uma mensagem para outro celular.
  aviso.innerHTML = `
    <strong>Você já pode descer à portaria do grupo</strong>
    <p>A pessoa autorizada para o apartamento ${escaparTexto(chamado.apartamento)} passou pela portaria principal.</p>
    <p><strong>${escaparTexto(chamado.nome || chamado.tipo)}</strong> · Chamado ${escaparTexto(chamado.id)}</p>
    <button type="button" id="btn-marcar-notificacao-lida" class="secundario">Entendi, marcar como lida</button>
  `;
  aviso.classList.remove("escondido");
  notificacaoMoradorNaoLida = true;
  atualizarDashboardCentral();

  buscarElemento("btn-marcar-notificacao-lida").addEventListener("click", () => {
    aviso.classList.add("escondido");
    notificacaoMoradorNaoLida = false;
    atualizarDashboardCentral();
  });
}

// ================================================================
// 4. AUTORIZAÇÃO VISUAL, QR ILUSTRATIVO E COMPARTILHAMENTO
// ================================================================

function mostrarAutorizacaoCriada(chamado) {
  const resultado = buscarElemento("resultado-chamado");
  resultado.classList.remove("escondido", "erro");
  resultado.classList.add("ok");
  buscarElemento("res-id").textContent = chamado.id;
  buscarElemento("res-ap").textContent = chamado.apartamento;
  buscarElemento("res-tipo").textContent = chamado.tipo;
  buscarElemento("res-codigo").textContent = chamado.codigo;
  buscarElemento("res-qr-visual").innerHTML = gerarQrIlustrativo(chamado.id + chamado.codigo + chamado.apartamento);
  buscarElemento("btn-compartilhar").dataset.chamadoId = chamado.id;
}

// Desenho de QR apenas decorativo: não codifica dados e não é escaneável.
function gerarQrIlustrativo(textoBase) {
  const tamanho = 25;
  let semente = 0;
  for (const caractere of textoBase) semente = (semente * 31 + caractere.charCodeAt(0)) >>> 0;
  const aleatorio = () => {
    semente = (semente * 1664525 + 1013904223) >>> 0;
    return (semente & 0xffff) / 0xffff;
  };
  const celulas = Array.from({ length: tamanho }, () => Array(tamanho).fill(false));
  const reservadas = Array.from({ length: tamanho }, () => Array(tamanho).fill(false));

  function desenharMarcador(xInicial, yInicial) {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      reservadas[yInicial + y][xInicial + x] = true;
      celulas[yInicial + y][xInicial + x] = x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
    }
  }
  desenharMarcador(1, 1);
  desenharMarcador(tamanho - 8, 1);
  desenharMarcador(1, tamanho - 8);

  for (let y = 0; y < tamanho; y++) for (let x = 0; x < tamanho; x++) {
    if (!reservadas[y][x]) celulas[y][x] = aleatorio() > 0.52;
  }
  let quadrados = "";
  for (let y = 0; y < tamanho; y++) for (let x = 0; x < tamanho; x++) {
    if (celulas[y][x]) quadrados += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg viewBox="0 0 ${tamanho} ${tamanho}" aria-hidden="true" shape-rendering="crispEdges"><rect width="${tamanho}" height="${tamanho}" fill="#fff"/><g fill="#17294f">${quadrados}</g></svg>`;
}

buscarElemento("btn-compartilhar").addEventListener("click", async () => {
  const chamado = chamados.find(item => item.id === buscarElemento("btn-compartilhar").dataset.chamadoId);
  if (!chamado) return;
  const texto = `Autorização de entrada\nApartamento: ${chamado.apartamento}\nChamado: ${chamado.id}\nTipo: ${chamado.tipo}\nPessoa: ${chamado.nome || chamado.tipo}\nCódigo de validação: ${chamado.codigo}\nValidade: ${chamado.validadeMin} minutos`;
  const retorno = buscarElemento("share-feedback");
  try {
    if (navigator.share) {
      await navigator.share({ title: `Autorização ${chamado.id}`, text: texto });
      retorno.textContent = "Menu de compartilhamento aberto.";
    } else if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      retorno.textContent = "Dados da autorização copiados para compartilhar.";
    } else {
      const campoTemporario = document.createElement("textarea");
      campoTemporario.value = texto;
      campoTemporario.style.position = "fixed";
      campoTemporario.style.opacity = "0";
      document.body.appendChild(campoTemporario);
      campoTemporario.select();
      const copiou = document.execCommand("copy");
      campoTemporario.remove();
      if (!copiou) throw new Error("Não foi possível copiar o texto.");
      retorno.textContent = "Dados da autorização copiados para compartilhar.";
    }
    retorno.classList.remove("escondido");
    clearTimeout(temporizadorAvisoCompartilhamento);
    temporizadorAvisoCompartilhamento = setTimeout(() => retorno.classList.add("escondido"), 6000);
  } catch (erro) {
    if (erro?.name === "AbortError") return;
    retorno.textContent = "Não foi possível compartilhar automaticamente. Informe o código numérico à portaria.";
    retorno.classList.remove("escondido");
  }
});

// ================================================================
// 5. EVENTOS DO MORADOR
// ================================================================

buscarElemento("btn-abrir-chamado").addEventListener("click", () => {
  const apartamento = buscarElemento("morador-ap").value.trim();
  if (!apartamento) {
    alert("Informe o apartamento.");
    buscarElemento("morador-ap").focus();
    return;
  }

  const chamado = {
    id: gerarIdentificadorChamado(),
    apartamento,
    tipo: buscarElemento("morador-tipo").value,
    placa: buscarElemento("morador-placa").value.trim().toUpperCase(),
    nome: buscarElemento("morador-nome").value.trim(),
    codigo: gerarCodigoDeAcesso(),
    criadoEm: Date.now(),
    validadeMin: Math.max(5, Number.parseInt(buscarElemento("morador-validade").value, 10) || 60),
    preferenciaLigacao: buscarElemento("morador-pref-ligacao").checked,
    status: "ativo"
  };

  chamados.push(chamado);
  registrarMovimentacao(chamado, "Nova autorização criada", "Ativo");
  mostrarAutorizacaoCriada(chamado);
  buscarElemento("notificacao-morador").classList.add("escondido");
  notificacaoMoradorNaoLida = false;
  buscarElemento("morador-placa").value = "";
  buscarElemento("morador-nome").value = "";
  buscarElemento("morador-pref-ligacao").checked = false;
  atualizarInterface();
});

// ================================================================
// 6. EVENTOS DA PORTARIA 1
// ================================================================

function mostrarResultadoDeValidacao(conteudo, tipo) {
  const resultado = buscarElemento("resultado-validacao");
  resultado.classList.remove("escondido", "ok", "erro");
  resultado.classList.add(tipo);
  resultado.innerHTML = conteudo;
}

function esconderConfirmacaoDePassagem() {
  buscarElemento("area-fechar").classList.add("escondido");
  chamadoSelecionadoNaPortaria = null;
}

function validarAutorizacao(chamado) {
  chamadoSelecionadoNaPortaria = chamado;
  const minutos = calcularMinutosRestantes(chamado);
  mostrarResultadoDeValidacao(`
    <strong>Entrada autorizada</strong><br>
    Chamado ${escaparTexto(chamado.id)} — Ap. ${escaparTexto(chamado.apartamento)} — ${escaparTexto(chamado.tipo)}<br>
    Pessoa: ${escaparTexto(chamado.nome || chamado.tipo)} | Placa: ${escaparTexto(chamado.placa || "—")}<br>
    Validade restante: ${minutos} min
  `, "ok");
  buscarElemento("area-fechar").classList.remove("escondido");
}

function buscarAutorizacaoPorPlaca() {
  const placa = buscarElemento("portaria-placa").value.trim().toUpperCase();
  if (!placa) return alert("Digite a placa do veículo.");
  const chamado = chamados.find(item => item.placa === placa && chamadoEstaValido(item));
  if (chamado) return validarAutorizacao(chamado);

  const existente = chamados.find(item => item.placa === placa);
  const motivo = existente
    ? `O chamado ${existente.id} existe, mas está com status ${existente.status}.`
    : `Não há autorização para a placa ${placa}.`;
  mostrarResultadoDeValidacao(` <strong>Entrada não autorizada.</strong> ${escaparTexto(motivo)} Ligue para o morador para confirmar.`, "erro");
  esconderConfirmacaoDePassagem();
}

function validarCodigoDigitado() {
  const codigo = buscarElemento("portaria-codigo").value.trim();
  if (!codigo) return alert("Digite o código do chamado.");
  const chamado = chamados.find(item => item.codigo === codigo && chamadoEstaValido(item));
  if (chamado) return validarAutorizacao(chamado);
  mostrarResultadoDeValidacao(`<strong>Entrada não autorizada.</strong> O código ${escaparTexto(codigo)} é inválido ou expirou. Ligue para o morador para confirmar.`, "erro");
  esconderConfirmacaoDePassagem();
}

buscarElemento("btn-buscar-placa").addEventListener("click", buscarAutorizacaoPorPlaca);
buscarElemento("btn-validar-codigo").addEventListener("click", validarCodigoDigitado);

buscarElemento("btn-fechar-chamado").addEventListener("click", () => {
  const chamado = chamadoSelecionadoNaPortaria;
  if (!chamado || !chamadoEstaValido(chamado)) {
    mostrarResultadoDeValidacao("A autorização não está mais válida. Valide novamente antes de continuar.", "erro");
    esconderConfirmacaoDePassagem();
    atualizarInterface();
    return;
  }

  chamado.status = "aguardando_grupo";
  registrarMovimentacao(chamado, "Passagem confirmada na portaria principal", "Aguardando Portaria 2");

  // Aviso temporário para a equipe da Portaria 1: desaparece após 7 segundos.
  mostrarAvisoTemporario("aviso-portaria1", `Passagem registrada para o Ap. ${chamado.apartamento}. A Portaria 2 foi atualizada.`, 7000, "portaria1");
  // Aviso demonstrativo para o morador: aparece na área Morador e ativa um ponto vermelho.
  notificarMoradorDaChegada(chamado);

  esconderConfirmacaoDePassagem();
  buscarElemento("portaria-placa").value = "";
  buscarElemento("portaria-codigo").value = "";
  atualizarInterface();
});

buscarElemento("btn-ligar-morador").addEventListener("click", () => {
  mostrarResultadoDeValidacao("<strong>Confirmação manual necessária.</strong> Ligue para o morador e registre a autorização verbal conforme o procedimento do condomínio.", "erro");
  esconderConfirmacaoDePassagem();
});

// ================================================================
// 7. EVENTOS DA PORTARIA 2
// ================================================================

buscarElemento("lista-portaria2").addEventListener("click", evento => {
  const botao = evento.target.closest("button[data-acao]");
  if (!botao) return;
  const chamado = chamados.find(item => item.id === botao.dataset.id);
  if (!chamado) return;

  if (botao.dataset.acao === "ligar") {
    mostrarAvisoTemporario("aviso-portaria2", `Ligue manualmente para o apartamento ${chamado.apartamento} e confirme a chegada de ${chamado.nome || chamado.tipo}. O telefone não está cadastrado no protótipo.`, 10000, "portaria2");
    return;
  }

  if (botao.dataset.acao === "concluir") {
    chamado.status = "concluido";
    registrarMovimentacao(chamado, "Chegada registrada na portaria do grupo", "Concluído");
    mostrarAvisoTemporario("aviso-portaria2", `Chegada registrada: ${chamado.nome || chamado.tipo}, chamado ${chamado.id}, Ap. ${chamado.apartamento}.`, 7000, "portaria2");
    atualizarInterface();
  }
});

// ================================================================
// 8. NAVEGAÇÃO E INICIALIZAÇÃO
// ================================================================

function abrirPainel(idPainel) {
  const painelSelecionado = buscarElemento(idPainel);
  if (!painelSelecionado) return;

  document.querySelectorAll(".operational-panel").forEach(painel => {
    painel.hidden = painel.id !== idPainel;
  });
  document.querySelectorAll(".nav-item[data-target]").forEach(itemMenu => {
    const selecionado = itemMenu.dataset.target === idPainel;
    itemMenu.classList.toggle("ativo", selecionado);
    if (selecionado) itemMenu.setAttribute("aria-current", "page");
    else itemMenu.removeAttribute("aria-current");
  });
  painelSelecionado.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.querySelectorAll(".nav-item[data-target]").forEach(itemMenu => {
  itemMenu.addEventListener("click", evento => {
    evento.preventDefault();
    abrirPainel(itemMenu.dataset.target);
    if (itemMenu.dataset.target === "painel-morador" && notificacaoMoradorNaoLida) {
      // O indicador só some ao marcar a mensagem como lida.
      atualizarDashboardCentral();
    }
  });
});

document.querySelectorAll("[data-go]").forEach(botao => {
  botao.addEventListener("click", () => abrirPainel(botao.dataset.go));
});

atualizarInterface();
abrirPainel("painel-central");
setInterval(expirarAutorizacoesVencidas, 1000);
