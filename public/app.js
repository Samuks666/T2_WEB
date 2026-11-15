const { createApp, ref, computed } = Vue;

createApp({
  setup() {
    const tamanhoAtual = ref(15);
    const matrizAtual = ref([]);
    const geracao = ref(0);
    const rodando = ref(false);
    let intervalo = null;

    // Criar matriz zerada
    const construirMatriz = (tamanho) => {
      const novaMatriz = [];
      for (let i = 0; i < tamanho; i++) {
        novaMatriz.push(new Array(tamanho).fill(0));
      }
      return novaMatriz;
    };

    // Função do Botão de Reiniciar
    const reiniciarGrade = () => {
      pausar();
      matrizAtual.value = construirMatriz(tamanhoAtual.value);
      geracao.value = 0;
    };

    // Toggle para mudar célula
    const alternarCelula = (i, j) => {
      matrizAtual.value[i][j] = matrizAtual.value[i][j] === 0 ? 1 : 0;
    };

    // Conta Total 
    const totalVivas = computed(() => {
      let total = 0;
      matrizAtual.value.forEach(linha => {
        linha.forEach(celula => {
          if (celula === 1) total++;
        });
      });
      return total;
    });

    // Iniciar Simulação
    const iniciar = () => {
      rodando.value = true;
      intervalo = setInterval(avancarPasso, 300); // 300ms dá uma fluidez melhor na tela
    };

    // Pausar Simulação
    const pausar = () => {
      rodando.value = false;
      clearInterval(intervalo);
    };

    // Função para contar vizinhos
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
            numVizinhos += matrizAtual.value[vizinhoLinha][vizinhoColuna];
          }
        }
      }
      return numVizinhos;
    };

    // Função que aplica as regras do jogo
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
              matrizBuffer[i][j] = 0; // isolamento ou superpopulação
            }
          } else {
            if (vizinhosAtuais === 3) {
              matrizBuffer[i][j] = 1; // Nascimento
            } else {
              matrizBuffer[i][j] = 0; // Continua morte
            }
          }

          // Flag para detectar Mudança
          if (matrizBuffer[i][j] !== estadoAtual) {
            mudou = true;
          }
        }
      }

      if (!mudou && rodando.value) {
        console.log("Simulação estagnou. Parando automaticamente.");
        pausar();
      }

      // Atualiza a matriz
      matrizAtual.value = matrizBuffer;
    };

    // Botão de avançar passo
    const avancarPasso = () => {
      calcPopulacao();
      geracao.value++;
    };

    reiniciarGrade();

    return {
      tamanhoAtual, matrizAtual, geracao, rodando, totalVivas,
      reiniciarGrade, alternarCelula, iniciar, pausar, avancarPasso
    };
  }
}).mount('#app');
