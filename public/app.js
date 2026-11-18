const { createApp, ref, computed, watch } = Vue;

createApp({
  setup() {
    const tamanhoAtual = ref(15);
    const matrizAtual = ref([]);
    const geracao = ref(0);
    const rodando = ref(false);
    const modoEdicao = ref(true);
    const velocidadeMs = ref(300);
    const padraoSelecionado = ref("");
    const arrastandoMouse = ref(false);
    const valorPintura = ref(1);
    const celulaFocada = ref({ linha: null, coluna: null });
    const logSistema = ref("Aguardando configuração inicial da placa...");

    let intervalo = null;

    // Criar matriz zerada
    const construirMatriz = (tamanho) => {
      const novaMatriz = [];
      for (let i = 0; i < tamanho; i++) {
        novaMatriz.push(new Array(tamanho).fill(0)); // Matriz é um array de arrays unidimensional
      }
      return novaMatriz;
    };

    // Ajusta o tamanho da matriz mantendo o que já estava desenhado
    const ajustarTamanhoMatriz = (novoTamanho) => {
      const novaMatriz = construirMatriz(novoTamanho);
      const antiga = matrizAtual.value;
      const limite = Math.min(antiga.length, novoTamanho);

      for (let i = 0; i < limite; i++) {
        for (let j = 0; j < limite; j++) {
          novaMatriz[i][j] = antiga[i][j];
        }
      }
      matrizAtual.value = novaMatriz;
    };

    // Função do Botão de Reiniciar
    const reiniciarGrade = () => {
      pausar();
      matrizAtual.value = construirMatriz(tamanhoAtual.value);
      geracao.value = 0;
      modoEdicao.value = true;
      padraoSelecionado.value = "";
      logSistema.value = "Grade reiniciada.";
    };

    // Toggle para mudar célula (0 = vazia, 1 = viva, 2 = morreu)
    const alternarCelula = (i, j) => {
      if (!modoEdicao.value || rodando.value) return;
      matrizAtual.value[i][j] = matrizAtual.value[i][j] === 1 ? 0 : 1;
    };

    const iniciarPintura = (i, j) => {
      if (!modoEdicao.value || rodando.value) return;
      arrastandoMouse.value = true;
      let novoValor = matrizAtual.value[i][j] === 1 ? 0 : 1;
      valorPintura.value = novoValor;
      matrizAtual.value[i][j] = novoValor;
      logSistema.value = "Célula (" + (i + 1) + ", " + (j + 1) + ") alterada.";
    };

    const pintarAoArrastar = (i, j) => {
      celulaFocada.value = { linha: i + 1, coluna: j + 1 };
      if (!arrastandoMouse.value || !modoEdicao.value || rodando.value) return;
      matrizAtual.value[i][j] = valorPintura.value;
    };

    const limparFocoCelula = () => {
      celulaFocada.value = { linha: null, coluna: null };
      arrastandoMouse.value = false;
    };

    const encerrarPintura = () => {
      arrastandoMouse.value = false;
    };

    const alternarModoEdicao = () => {
      if (rodando.value) {
        pausar();
      }
      modoEdicao.value = !modoEdicao.value;
      logSistema.value = modoEdicao.value ? "Modo de edição ativado." : "Modo de edição desativado.";
    };

    // Conta Total de células vivas
    const totalVivas = computed(() => {
      let total = 0;
      matrizAtual.value.forEach(linha => {
        linha.forEach(celula => {
          if (celula === 1) total++;
        });
      });
      return total;
    });

    // Conta quantas células já morreram na placa atual
    const totalMortas = computed(() => {
      let total = 0;
      matrizAtual.value.forEach(linha => {
        linha.forEach(celula => {
          if (celula === 2) total++;
        });
      });
      return total;
    });

    const totalCelulas = computed(() => {
      return tamanhoAtual.value * tamanhoAtual.value;
    });

    const densidadePercentual = computed(() => {
      if (totalCelulas.value === 0) return 0;
      return Math.round((totalVivas.value / totalCelulas.value) * 100);
    });

    const tamanhoCelulaPx = computed(() => {
      let n = tamanhoAtual.value;
      if (n <= 12) return 34;
      if (n <= 18) return 28;
      if (n <= 25) return 22;
      if (n <= 35) return 16;
      return 12;
    });

    // Quando mudar o tamanho no input, atualiza a matriz na hora
    watch(tamanhoAtual, (novoTam) => {
      if (!novoTam || isNaN(novoTam)) return;
      let tam = parseInt(novoTam);
      if (tam < 5) tam = 5;
      if (tam > 50) tam = 50;

      if (tam !== novoTam) {
        tamanhoAtual.value = tam;
        return;
      }
      ajustarTamanhoMatriz(tam);
      logSistema.value = "Matriz alterada para " + tam + "x" + tam;
    });

    watch(velocidadeMs, (novaVel) => {
      if (rodando.value) {
        clearInterval(intervalo);
        intervalo = setInterval(avancarPasso, novaVel);
      }
    });

    // Iniciar Simulação
    const iniciar = () => {
      if (rodando.value) return;
      rodando.value = true;
      modoEdicao.value = false;
      logSistema.value = "Simulação rodando...";
      intervalo = setInterval(avancarPasso, velocidadeMs.value);
    };

    // Pausar Simulação
    const pausar = () => {
      rodando.value = false;
      clearInterval(intervalo);
      logSistema.value = "Simulação pausada na geração " + geracao.value;
    };

    // Função para contar vizinhos vivos
    const contarVizinhos = (linha, coluna) => {
      let numVizinhos = 0;
      const limite = tamanhoAtual.value;

      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          // Pula a célula central
          if (i === 0 && j === 0) continue;

          const vizinhoLinha = linha + i;
          const vizinhoColuna = coluna + j;

          // Verificar se não passou das bordas
          if (vizinhoLinha >= 0 && vizinhoLinha < limite && vizinhoColuna >= 0 && vizinhoColuna < limite) {
            if (matrizAtual.value[vizinhoLinha][vizinhoColuna] === 1) {
              numVizinhos++;
            }
          }
        }
      }
      return numVizinhos;
    };

    // Função que aplica as regras do jogo
    // 0 = célula inativa (vazia), 1 = célula viva, 2 = célula que morreu
    const calcPopulacao = () => {
      let mudou = false;
      const tamanho = tamanhoAtual.value;
      let matrizBuffer = matrizAtual.value.map(linha => [...linha]);

      for (let i = 0; i < tamanho; i++) {
        for (let j = 0; j < tamanho; j++) {
          let vizinhosAtuais = contarVizinhos(i, j);
          let estadoAtual = matrizAtual.value[i][j];

          if (estadoAtual === 1) {
            if (vizinhosAtuais === 2 || vizinhosAtuais === 3) {
              matrizBuffer[i][j] = 1; // Sobrevive
            } else {
              matrizBuffer[i][j] = 2; // Morre por isolamento ou superpopulação (fica morta)
            }
          } else {
            if (vizinhosAtuais === 3) {
              matrizBuffer[i][j] = 1; // Nascimento
            } else {
              matrizBuffer[i][j] = estadoAtual; // Continua como estava (morta)
            }
          }

          // Flag para detectar Mudança no estado vivo/morto
          if ((matrizBuffer[i][j] === 1) !== (estadoAtual === 1)) {
            mudou = true;
          }
        }
      }

      if (!mudou && rodando.value) {
        console.log("Simulação estagnou. Parando automaticamente.");
        pausar();
        logSistema.value = "Simulação estabilizou na geração " + (geracao.value + 1);
      }

      // Atualiza a matriz
      matrizAtual.value = matrizBuffer;
    };

    // Botão de avançar passo
    const avancarPasso = () => {
      calcPopulacao();
      geracao.value++;
    };

    // Carrega alguns exemplos prontos para facilitar os testes
    const aplicarPadrao = () => {
      let tipo = padraoSelecionado.value;
      if (!tipo) return;

      pausar();
      let n = tamanhoAtual.value;
      let nova = construirMatriz(n);
      let meio = Math.floor(n / 2);

      if (tipo === "pdf" && n >= 5) {
        nova[meio - 1][meio] = 1;
        nova[meio][meio - 1] = 1;
        nova[meio][meio] = 1;
        nova[meio][meio + 1] = 1;
      } else if (tipo === "glider" && n >= 5) {
        nova[1][2] = 1;
        nova[2][3] = 1;
        nova[3][1] = 1;
        nova[3][2] = 1;
        nova[3][3] = 1;
      } else if (tipo === "blinker" && n >= 5) {
        nova[meio][meio - 1] = 1;
        nova[meio][meio] = 1;
        nova[meio][meio + 1] = 1;
      } else if (tipo === "aleatorio") {
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            nova[i][j] = Math.random() < 0.28 ? 1 : 0;
          }
        }
      }

      matrizAtual.value = nova;
      geracao.value = 0;
      modoEdicao.value = true;
      logSistema.value = "Padrão carregado: " + tipo;
    };

    reiniciarGrade();

    return {
      tamanhoAtual,
      matrizAtual,
      geracao,
      rodando,
      modoEdicao,
      velocidadeMs,
      padraoSelecionado,
      celulaFocada,
      logSistema,
      totalVivas,
      totalMortas,
      totalCelulas,
      densidadePercentual,
      tamanhoCelulaPx,
      reiniciarGrade,
      alternarCelula,
      iniciarPintura,
      pintarAoArrastar,
      limparFocoCelula,
      encerrarPintura,
      alternarModoEdicao,
      iniciar,
      pausar,
      avancarPasso,
      aplicarPadrao
    };
  }
}).mount('#app');
