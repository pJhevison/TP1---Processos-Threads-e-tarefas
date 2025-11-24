// ======== ESTADO GLOBAL =========

let processos = [];
let proximoPid = 1;
let processoSelecionadoId = null;
let numCores = 1; // 1 núcleo (concorrência) ou 2 núcleos (paralelismo)

// ======== UTILIDADES =========

function log(mensagem) {
  const logContainer = document.getElementById("log-container");
  const linha = document.createElement("div");
  linha.className = "log-entry";
  linha.textContent = mensagem;
  logContainer.appendChild(linha);
  logContainer.scrollTop = logContainer.scrollHeight;
}

function getProcessoSelecionado() {
  if (processoSelecionadoId == null) return null;
  return processos.find((p) => p.id === processoSelecionadoId) || null;
}

// ======== CONFIGURAÇÃO DE NÚCLEOS =========

function setNumCores(n) {
  if (n !== 1 && n !== 2) return;
  if (numCores === n) return;

  if (n === 1) {
    const executando = processos.filter((p) => p.estado === "executando");
    if (executando.length > 1) {
      executando.sort((a, b) => a.id - b.id);
      const manter = executando[0];
      log(
        `[CPU] Modo alterado para 1 núcleo. O processo ${manter.nome} (PID ${manter.id}) continua em execução; os demais processos em execução voltam para a Fila de Prontos.`
      );
      for (let i = 1; i < executando.length; i++) {
        executando[i].estado = "pronto";
        log(
          `       Processo ${executando[i].nome} (PID ${executando[i].id}) devolvido para a Fila de Prontos.`
        );
      }
    } else {
      log(
        `[CPU] Modo alterado para 1 núcleo (concorrência: apenas um processo executa de cada vez).`
      );
    }
  } else {
    log(
      `[CPU] Modo alterado para 2 núcleos (paralelismo): agora até dois processos podem executar ao mesmo tempo, um em cada CPU.`
    );
  }

  numCores = n;
  atualizarInterface();
}

// ======== AÇÕES DO USUÁRIO =========

function criarProcesso(tipo) {
  const processo = {
    id: proximoPid++,
    nome: tipo,
    estado: "novo",
    threads: 1
  };

  processos.push(processo);
  log(
    `[CRIAÇÃO] Processo ${tipo} criado (PID ${processo.id}). Estado inicial: Novo.`
  );
  atualizarInterface();
}

function proximoPasso() {
  processos
    .filter((p) => p.estado === "novo")
    .forEach((p) => {
      p.estado = "pronto";
      log(
        `[ESCALONADOR] Processo ${p.nome} (PID ${p.id}) mudou de Novo para Pronto. ` +
          `Ele entrou na Fila de Prontos e agora pode ser escolhido para usar a CPU.`
      );
    });

  const executando = processos.filter((p) => p.estado === "executando");

  if (numCores === 1) {
    if (executando.length === 0) {
      const pronto = processos.find((p) => p.estado === "pronto");
      if (pronto) {
        pronto.estado = "executando";
        log(
          `[ESCALONADOR] (1 núcleo) O escalonador escolheu o processo ${pronto.nome} (PID ${pronto.id}) ` +
            `da Fila de Prontos e o colocou para Executar na CPU.`
        );
      } else {
        log(
          `[ESCALONADOR] (1 núcleo) Não há processos na Fila de Prontos no momento. A CPU fica ociosa.`
        );
      }
    } else {
      log(
        `[ESCALONADOR] (1 núcleo) Já existe um processo em execução (PID ${executando[0].id}). ` +
          `Use 'Bloquear' ou 'Finalizar' para liberar a CPU.`
      );
    }
  } else {
    if (executando.length >= 2) {
      log(
        `[ESCALONADOR] (2 núcleos) As duas CPUs já estão ocupadas. Use 'Bloquear' ou 'Finalizar' para liberar alguma CPU.`
      );
    } else {
      const vagas = 2 - executando.length;
      if (vagas <= 0) {
        log(
          `[ESCALONADOR] (2 núcleos) Não há vagas em CPU neste momento.`
        );
      } else {
        for (let i = 0; i < vagas; i++) {
          const pronto = processos.find((p) => p.estado === "pronto");
          if (!pronto) {
            if (i === 0) {
              log(
                `[ESCALONADOR] (2 núcleos) Não há processos na Fila de Prontos para ocupar CPUs livres.`
              );
            }
            break;
          }
          pronto.estado = "executando";
          const cpuNumber = executando.length + i + 1;
          log(
            `[ESCALONADOR] (2 núcleos) O escalonador escolheu o processo ${pronto.nome} (PID ${pronto.id}) ` +
              `da Fila de Prontos e o colocou para Executar na CPU ${cpuNumber}.`
          );
        }
      }
    }
  }

  atualizarInterface();
}

function bloquearProcesso() {
  let alvo = getProcessoSelecionado();
  if (!alvo || alvo.estado !== "executando") {
    alvo = processos.find((p) => p.estado === "executando");
  }
  if (!alvo) {
    alert("Não há processo em execução para bloquear.");
    return;
  }

  alvo.estado = "bloqueado";
  log(
    `[I/O] Processo ${alvo.nome} (PID ${alvo.id}) solicitou uma operação de entrada/saída ` +
      `(por exemplo, ler do disco ou baixar um arquivo). Ele saiu da CPU e foi para o estado Bloqueado.`
  );

  atualizarInterface();
}

function concluirIO() {
  const bloqueado = processos.find((p) => p.estado === "bloqueado");
  if (!bloqueado) {
    alert("Não há processos bloqueados.");
    return;
  }

  bloqueado.estado = "pronto";
  log(
    `[I/O] A operação de E/S do processo ${bloqueado.nome} (PID ${bloqueado.id}) terminou. ` +
      `O escalonador coloca o processo de volta na Fila de Prontos (Bloqueado → Pronto).`
  );

  atualizarInterface();
}

function finalizarProcesso() {
  let executando = getProcessoSelecionado();
  if (!executando || executando.estado !== "executando") {
    executando = processos.find((p) => p.estado === "executando");
  }

  if (!executando) {
    alert("Não há processo em execução para finalizar.");
    return;
  }

  const threadsAntes = executando.threads;
  executando.threads = 0;
  executando.estado = "finalizado";

  log(
    `[TERMINAÇÃO] Processo ${executando.nome} (PID ${executando.id}) terminou sua execução. ` +
      `O sistema operacional encerra todas as suas ${threadsAntes} threads e libera a CPU e a memória ocupada.`
  );
  log(
    `               Esse processo agora possui 0 threads ativas, pois todas foram encerradas.`
  );

  atualizarInterface();
}

function fecharAplicativo() {
  const p = getProcessoSelecionado();
  if (!p) return;

  if (p.estado === "finalizado") {
    log(
      `[APP] O aplicativo ${p.nome} (PID ${p.id}) já está finalizado. Nenhuma ação necessária.`
    );
    return;
  }

  const threadsAntes = p.threads;
  p.threads = 0;
  p.estado = "finalizado";

  log(
    `[APP] Você pediu para fechar o aplicativo ${p.nome} (PID ${p.id}). ` +
      `O sistema operacional marca o processo para término e encerra todas as suas ${threadsAntes} threads.`
  );
  log(
    `      Todos os recursos do processo (memória, arquivos abertos, threads) foram liberados.`
  );

  atualizarInterface();
}

function resetSimulacao() {
  processos = [];
  proximoPid = 1;
  processoSelecionadoId = null;
  numCores = 1;

  document.getElementById("log-container").innerHTML = "";
  log("Simulação resetada.");
  log(
    "Use os botões de aplicativos para criar processos e os controles do kernel para observar o escalonador, o bloqueio por I/O, as threads, a concorrência (1 núcleo) e o paralelismo (2 núcleos)."
  );

  atualizarInterface();
}

function selecionarProcesso(id) {
  processoSelecionadoId = id;
  const p = getProcessoSelecionado();
  if (p) {
    log(
      `[SELEÇÃO] Você selecionou o processo ${p.nome} (PID ${p.id}). ` +
        `Veja abaixo suas threads e ações específicas.`
    );
  }
  atualizarInterface();
}

function adicionarThread() {
  const processo = getProcessoSelecionado();
  if (!processo) return;

  processo.threads += 1;
  log(
    `[THREAD] Uma nova thread foi criada manualmente no processo ${processo.nome} (PID ${processo.id}). ` +
      `Total de threads agora: ${processo.threads}.`
  );

  atualizarInterface();
}

// ======== MINI EXECUÇÃO POR APLICATIVO =========
//
// MÚSICA
//

// tocar música (3 threads: decodificar, tocar, buffer)
function simularMusica() {
  const p = getProcessoSelecionado();
  if (!p || p.nome !== "Música") return;

  p.threads += 3;
  log(
    `[MÚSICA] O processo de Música (PID ${p.id}) começou a tocar uma faixa.`
  );
  log(
    `         → Thread criada para decodificar o áudio (transformar o arquivo em dados tocáveis).`
  );
  log(
    `         → Thread criada para tocar o áudio na saída de som (enviar para as caixas de som/fones).`
  );
  log(
    `         → Thread criada para gerenciar o buffer, evitando cortes e travamentos na reprodução.`
  );
  log(
    `         Agora o processo de Música tem ${p.threads} threads no total (1 principal + auxiliares).`
  );

  atualizarInterface();
}

// pular música (1 thread de controle rápido)
function simularPularMusica() {
  const p = getProcessoSelecionado();
  if (!p || p.nome !== "Música") return;

  p.threads += 1;
  log(
    `[MÚSICA] O usuário pulou para a próxima faixa no processo de Música (PID ${p.id}).`
  );
  log(
    `         → Uma thread de controle coordena o encerramento da faixa atual e a preparação da próxima (atualiza buffers e estado do player).`
  );
  log(`         Total de threads do player agora: ${p.threads}.`);

  atualizarInterface();
}

// visualizar letra (2 threads: rede + UI)
function simularVisualizarLetra() {
  const p = getProcessoSelecionado();
  if (!p || p.nome !== "Música") return;

  p.threads += 2;
  log(
    `[MÚSICA] O usuário pediu para visualizar a letra da música no processo de Música (PID ${p.id}).`
  );
  log(
    `         → Thread criada para buscar a letra em um serviço externo (rede/Internet).`
  );
  log(
    `         → Thread criada para atualizar a interface do player, exibindo a letra sincronizada com a música.`
  );
  log(`         Total de threads do player agora: ${p.threads}.`);

  atualizarInterface();
}

//
// NAVEGADOR
//

// nova aba (2 threads: rede + renderização)
function simularNovaAba() {
  const p = getProcessoSelecionado();
  if (!p || p.nome !== "Navegador") return;

  p.threads += 2;
  log(
    `[NAVEGADOR] O processo Navegador (PID ${p.id}) abriu uma nova aba.`
  );
  log(
    `           → Thread criada para buscar os dados da página na rede (HTTP, downloads de recursos).`
  );
  log(
    `           → Thread criada para renderizar a página (HTML, CSS, JavaScript) na tela do usuário.`
  );
  log(
    `           Agora o navegador tem ${p.threads} threads no total, uma para cada aba/atividade importante.`
  );

  atualizarInterface();
}

// fazer download (2 threads: rede + gravação em disco)
function simularDownloadNavegador() {
  const p = getProcessoSelecionado();
  if (!p || p.nome !== "Navegador") return;

  p.threads += 2;
  log(
    `[NAVEGADOR] O usuário iniciou um download no Navegador (PID ${p.id}).`
  );
  log(
    `           → Thread criada para receber os dados da rede continuamente.`
  );
  log(
    `           → Thread criada para gravar os blocos recebidos em disco sem travar a interface.`
  );
  log(`           Total de threads do navegador agora: ${p.threads}.`);

  atualizarInterface();
}

// reproduzir vídeo (3 threads: vídeo, áudio, buffer)
function simularReproduzirVideo() {
  const p = getProcessoSelecionado();
  if (!p || p.nome !== "Navegador") return;

  p.threads += 3;
  log(
    `[NAVEGADOR] O usuário começou a reproduzir um vídeo em uma aba do Navegador (PID ${p.id}).`
  );
  log(
    `           → Thread criada para decodificar o vídeo (frames de imagem).`
  );
  log(
    `           → Thread criada para decodificar e reproduzir o áudio do vídeo.`
  );
  log(
    `           → Thread criada para gerenciar o buffer de streaming, evitando travamentos durante a reprodução.`
  );
  log(`           Total de threads do navegador agora: ${p.threads}.`);

  atualizarInterface();
}

//
// EDITOR
//

function simularDigitarTexto() {
  const p = getProcessoSelecionado();
  if (!p || p.nome !== "Editor") return;

  p.threads += 1;
  log(
    `[EDITOR] O processo Editor (PID ${p.id}) recebeu entrada do teclado (o usuário digitou texto).`
  );
  log(
    `         → Uma thread de interface trata a tecla pressionada e atualiza o texto exibido na tela.`
  );
  log(`         Total de threads do editor agora: ${p.threads}.`);

  atualizarInterface();
}

function simularCliqueMouse() {
  const p = getProcessoSelecionado();
  if (!p || p.nome !== "Editor") return;

  p.threads += 1;
  log(
    `[EDITOR] O usuário clicou com o mouse dentro da janela do Editor (PID ${p.id}).`
  );
  log(
    `         → Uma thread de interface trata o evento de mouse (posiciona o cursor, seleciona texto, abre menus, etc.).`
  );
  log(`         Total de threads do editor agora: ${p.threads}.`);

  atualizarInterface();
}

function simularRedimensionarJanela() {
  const p = getProcessoSelecionado();
  if (!p || p.nome !== "Editor") return;

  p.threads += 1;
  log(
    `[EDITOR] A janela do Editor (PID ${p.id}) foi redimensionada (arrastada pelo usuário).`
  );
  log(
    `         → Uma thread trata o redimensionamento, recalculando o layout e redesenhando o conteúdo.`
  );
  log(`         Total de threads do editor agora: ${p.threads}.`);

  atualizarInterface();
}

function simularCorretorOrtografico() {
  const p = getProcessoSelecionado();
  if (!p || p.nome !== "Editor") return;

  p.threads += 1;
  log(
    `[EDITOR] O corretor ortográfico do Editor (PID ${p.id}) começou a analisar o texto digitado.`
  );
  log(
    `         → Uma thread varre o texto em segundo plano procurando erros e sugerindo correções.`
  );
  log(`         Total de threads do editor agora: ${p.threads}.`);

  atualizarInterface();
}

// ======== ATUALIZAÇÃO DE INTERFACE =========

function atualizarInterface() {
  const estados = ["novo", "pronto", "executando", "bloqueado", "finalizado"];
  const idsPorEstado = {
    novo: "lista-novo",
    pronto: "lista-pronto",
    executando: "lista-executando",
    bloqueado: "lista-bloqueado",
    finalizado: "lista-finalizado"
  };

  estados.forEach((est) => {
    const el = document.getElementById(idsPorEstado[est]);
    if (el) el.innerHTML = "";
  });

  processos.forEach((p) => {
    const container = document.getElementById(idsPorEstado[p.estado]);
    if (!container) return;

    const div = document.createElement("div");
    div.classList.add("process-card");

    if (p.nome === "Música") div.classList.add("process-music");
    else if (p.nome === "Navegador") div.classList.add("process-browser");
    else div.classList.add("process-editor");

    if (p.id === processoSelecionadoId) {
      div.classList.add("selected");
    }

    div.onclick = () => selecionarProcesso(p.id);

    div.innerHTML = `
      <span>PID ${p.id}</span>
      <span>${p.nome}</span>
      <span>${p.threads} th</span>
    `;

    container.appendChild(div);
  });

  const executando = processos.filter((p) => p.estado === "executando");
  const modeLabel = document.getElementById("cpu-mode-label");
  const cpu2Container = document.getElementById("cpu2-container");
  const cpu1Status = document.getElementById("cpu1-status");
  const cpu2Status = document.getElementById("cpu2-status");

  if (numCores === 1) {
    if (modeLabel) modeLabel.textContent = "1 núcleo (concorrência)";
    if (cpu2Container) cpu2Container.style.display = "none";

    const p = executando[0];
    if (cpu1Status) {
      if (p) {
        cpu1Status.textContent = `CPU executando o processo ${p.nome} (PID ${p.id}).`;
      } else {
        cpu1Status.textContent =
          "Nenhum processo em execução. Use 'Próximo passo' para o escalonador escolher um processo da Fila de Prontos.";
      }
    }
  } else {
    if (modeLabel) modeLabel.textContent = "2 núcleos (paralelismo)";
    if (cpu2Container) cpu2Container.style.display = "block";

    const p1 = executando[0];
    const p2 = executando[1];

    if (cpu1Status) {
      if (p1) {
        cpu1Status.textContent = `CPU 1 executando o processo ${p1.nome} (PID ${p1.id}).`;
      } else {
        cpu1Status.textContent =
          "CPU 1 livre. Não há processo em execução neste núcleo.";
      }
    }

    if (cpu2Status) {
      if (p2) {
        cpu2Status.textContent = `CPU 2 executando o processo ${p2.nome} (PID ${p2.id}).`;
      } else {
        cpu2Status.textContent =
          "CPU 2 livre. Não há processo em execução neste núcleo.";
      }
    }
  }

  const detalhes = document.getElementById("detalhes-processo");
  const btnAddThread = document.getElementById("btn-add-thread");
  const acoesDiv = document.getElementById("acoes-processo");

  const pSel = getProcessoSelecionado();

  if (!pSel) {
    if (detalhes)
      detalhes.innerHTML = "<p>Nenhum processo selecionado.</p>";
    if (btnAddThread) btnAddThread.disabled = true;
    if (acoesDiv)
      acoesDiv.innerHTML =
        "<p>Selecione um processo para ver ações específicas (tocar música, abrir aba, digitar texto, etc.).</p>";
  } else {
    if (detalhes) {
      detalhes.innerHTML = `
        <p><strong>PID:</strong> ${pSel.id}</p>
        <p><strong>Nome:</strong> ${pSel.nome}</p>
        <p><strong>Estado atual:</strong> ${pSel.estado}</p>
        <p><strong>Número de threads:</strong> ${pSel.threads}</p>
        <p style="margin-top:4px;font-size:0.85rem;">
          Lembrete: threads do mesmo processo compartilham recursos (memória, arquivos),
          mas cada thread representa um fluxo de execução independente.
        </p>
      `;
    }
    if (btnAddThread) btnAddThread.disabled = false;

    if (!acoesDiv) return;

    if (pSel.nome === "Música") {
      acoesDiv.innerHTML = `
        <p><strong>Ações específicas deste processo (Música):</strong></p>
        <button onclick="simularMusica()">Simular tocar música</button>
        <p class="mini-desc">
          Ao tocar uma música, o processo pode criar threads para decodificar o arquivo de áudio,
          reproduzir o som e gerenciar o buffer, tudo ao mesmo tempo.
        </p>

        <button onclick="simularPularMusica()">Pular música</button>
        <p class="mini-desc">
          Representa uma thread de controle que coordena o fim da faixa atual e o início da próxima,
          atualizando buffers e o estado do player.
        </p>

        <button onclick="simularVisualizarLetra()">Visualizar letra da música</button>
        <p class="mini-desc">
          Cria threads para buscar a letra em um serviço externo e atualizar a interface exibindo a letra
          sincronizada com a música.
        </p>

        <button onclick="fecharAplicativo()">Fechar este aplicativo (encerrar processo)</button>
        <p class="mini-desc">
          Fechar o player faz o sistema operacional terminar o processo e encerrar todas as threads ligadas a ele.
        </p>
      `;
    } else if (pSel.nome === "Navegador") {
      acoesDiv.innerHTML = `
        <p><strong>Ações específicas deste processo (Navegador):</strong></p>

        <button onclick="simularNovaAba()">Abrir nova aba</button>
        <p class="mini-desc">
          Cada aba aberta pode gerar novas threads: uma para buscar dados na rede e outra para renderizar a página.
        </p>

        <button onclick="simularDownloadNavegador()">Fazer download</button>
        <p class="mini-desc">
          Representa threads que recebem dados da rede continuamente e gravam em disco sem travar a interface.
        </p>

        <button onclick="simularReproduzirVideo()">Reproduzir um vídeo</button>
        <p class="mini-desc">
          Cria threads para decodificar o vídeo, reproduzir o áudio e gerenciar o buffer do streaming.
        </p>

        <button onclick="fecharAplicativo()">Fechar este aplicativo (encerrar processo)</button>
        <p class="mini-desc">
          Fechar o navegador encerra o processo inteiro e todas as threads de abas, downloads e vídeos.
        </p>
      `;
    } else if (pSel.nome === "Editor") {
      acoesDiv.innerHTML = `
        <p><strong>Ações específicas deste processo (Editor de Texto):</strong></p>

        <button onclick="simularDigitarTexto()">Simular digitar texto</button>
        <p class="mini-desc">
          Representa a thread de interface que trata as teclas pressionadas e atualiza o texto exibido na tela.
        </p>

        <button onclick="simularCliqueMouse()">Simular clique do mouse</button>
        <p class="mini-desc">
          Representa a thread que trata eventos de mouse: movimentar o cursor, selecionar texto, abrir menus, etc.
        </p>

        <button onclick="simularRedimensionarJanela()">Simular redimensionar janela</button>
        <p class="mini-desc">
          Representa uma thread responsável por recalcular o layout e redesenhar o conteúdo quando a janela muda de tamanho.
        </p>

        <button onclick="simularCorretorOrtografico()">Simular corretor ortográfico</button>
        <p class="mini-desc">
          Representa uma thread em segundo plano que analisa o texto e sugere correções enquanto o usuário continua digitando.
        </p>

        <button onclick="fecharAplicativo()">Fechar este aplicativo (encerrar processo)</button>
        <p class="mini-desc">
          Fechar o editor faz o sistema liberar memória, arquivos abertos e encerrar todas as threads do editor.
        </p>
      `;
    } else {
      acoesDiv.innerHTML = `
        <p>Este processo não tem ações específicas definidas.</p>
        <button onclick="fecharAplicativo()">Fechar este aplicativo (encerrar processo)</button>
      `;
    }
  }
}

// ======== INICIALIZAÇÃO =========

window.onload = () => {
  log("Bem-vindo ao simulador didático de processos.");
  log(
    "Crie processos pelos aplicativos acima e use os controles do kernel para observar o escalonador, o bloqueio por I/O, as threads, a concorrência (1 núcleo) e o paralelismo (2 núcleos)."
  );
  atualizarInterface();
};
