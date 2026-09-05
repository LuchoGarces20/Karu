Objetivo do projeto
O Trote | Premium AI Coach é um Progressive Web App (PWA) de coaching de corrida impulsionado por lógica fisiológica e inteligência artificial local. Ele atua como um treinador pessoal automatizado que gera planos de treino periodizados (método Karvonen/VDOT), monitora métricas de carga e fadiga (TSS, CTL, ATL, TSB, ACWR, Monotonia/Foster), controla o desgaste da garagem de tênis e simula táticas de ritmo (Negative Split) e nutrição para o dia da prova.

Stack tecnológica
Linguagens: HTML5, CSS3 moderno, JavaScript (ES6+ Vanilla).

Bibliotecas: Chart.js (via CDN para gráficos de evolução fisiológica).

Persistência: localStorage do navegador para armazenamento local e offline.

PWA & Offline: Service Worker (sw.js) e Web App Manifest (manifest.json).

Design System & Tipografia: CSS Custom Properties (variáveis), estéticas em Glassmorphism (estilo iOS), paleta oficial de cores (#1C1C1E, #F4F5F7, #00D8F6, #0066CC) e Google Fonts (Inter, Outfit e Orbitron).

Arquitetura
O sistema é estruturado como uma SPA (Single Page Application) em Vanilla JS sem frameworks ou compiladores externos.

A aplicação opera sob o padrão de Estado Centralizado:

Toda a inteligência de negócios, cálculos fisiológicos, modelos de periodização e persistência são concentrados na classe RunningCoach (app.js).

Mutações no estado acionam chamadas de renderização no DOM que reinjetam partes da interface reativamente.

Estrutura de Pastas e Responsabilidades
/ (Raiz): Contém o ponto de entrada da aplicação (index.html), o arquivo principal de lógica (app.js), os estilos globais (style.css), a lógica do PWA (sw.js) e as configurações do manifesto (manifest.json).

img/: Armazena os ícones do aplicativo e os logos SVG otimizados para os temas escuro (Trote-logo.svg) e claro (Trote-logo-light.svg).

Fluxos principais
Fluxo 1: Onboarding / Calibração Inicial
Plaintext
Usuário abre o App (sem dados)
↓
Exibição do Onboarding Wizard (5 Passos: Identidade, Fisiologia, Agenda, Prova/Histórico, Garagem)
↓
Envio do Formulário de Setup
↓
Instanciação e execução do app.initSetup()
↓
Geração do Macrociclo e Cálculo das Zonas Cardíacas
↓
Persistência no localStorage ('trote_app_v4')
↓
Redirecionamento para a Tela Principal ("Hoje")
Fluxo 2: Registro de Treino e Intervenção de IA
Plaintext
Tela "Hoje" / Forecast
↓
Clique em "Registrar Treino"
↓
Preenchimento dos dados reais (Distância, Tempo, FC Média, sRPE, Tênis)
↓
Execução do app.processarTreino()
↓
Cálculo de Carga (TSS) e Atualização de Quilometragem do Tênis
↓
Recálculo da Linha do Tempo (Modelo de Banister: CTL, ATL, TSB, ACWR)
↓
Execução do analisarFeedbackFisiologico() (Verificação de Overreaching ou ACWR > 1.45)
↓
[Se Crítico] Protocolo de Sobrevivência de IA: Reestruturação automática dos próximos 5 dias de treino
↓
Persistência no localStorage e Atualização da Interface com aviso de Toast
Fluxo 3: Alternância de Temas (Dark / Light)
Plaintext
Usuário clica no Botão de Alternar Tema
↓
Execução do applyTheme()
↓
Atualização do atributo data-theme no <body>
↓
Troca dinâmica dos logos SVG (#brand-logo-img e favicon)
↓
Atualização da Meta Tag theme-color do sistema
↓
Persistência da escolha no localStorage ('trote_theme')
Fluxo 4: Simulação de Estratégia de Prova
Plaintext
Abertura do Modal de Estratégia
↓
Entrada de dados (Distância, Tempo Alvo, Tática: Negative Split ou Ritmo Constante)
↓
Cálculo do Pace Médio Necessário, Divisão por Blocos de Prova e Recomendações de Carboidratos/Hidratação
↓
Exibição do Plano de Combate em tempo real
Regras de negócio
Modelo de Carga Fisiológica (Banister Impulse-Response):

TSS (Training Stress Score): Pontuação de estresse calculada via Frequência Cardíaca Média ou Percepção Subjetiva de Esforço (sRPE).

CTL (Fitness): Carga de treino crônica (constante de decaimento de 42 dias).

ATL (Fadiga): Carga de treino aguda (constante de decaimento de 7 dias).

TSB (Forma/Frescor): Calculado como CTL - ATL.

Razão Aguda:Crônica (ACWR): Calculada como ATL / CTL. Se ACWR > 1.45, o atleta entra na zona de alto risco de lesão por sobrecarga.

Calibração de Zonas (Karvonen & VDOT): As zonas de treino (Z1 a Z5) e paces alvo são derivados da Frequência Cardíaca de Reserva (FC Máx - FC Repouso) combinados ao Pace de Limiar do atleta.

Protocolo de Intervenção Sistêmica de IA: Caso o atleta registre 3 treinos consecutivos com RPE acima do esperado ou o ACWR supere 1.45, a IA intercepta os treinos dos próximos 5 dias futuros, cortando volumes em 30% ou convertendo treinos intensos em sessões regenerativas em Z1.

Métrica de Monotonia e Strain (Foster): Avalia a variação da carga dos últimos 14 dias (média / desvio_padrão). Valores de monotonia superiores a 2.0 acionam alerta visual de alto risco no dashboard.

Gestão da Garagem de Tênis: O uso do calçado selecionado soma quilometragem automaticamente. Tênis acima de 600 km acumulados exibem alertas visuais de desgaste.

Padrões utilizados
State-Driven UI Rendering: A interface reage totalmente às mudanças do estado central this.state.

Encapsulamento de Domínio (POO): A classe RunningCoach atua como motor único contendo regras de negócio, lógica fisiológica e chamadas de persistência.

Design System Baseado em Tokens & Glassmorphism: Utilização de variáveis CSS chave (:root e [data-theme="dark"]) com efeitos de transparência e desfoque (backdrop-filter) para replicar a estética nativa do iOS.

Stale-While-Revalidate (Service Worker): O sw.js entrega instantaneamente os arquivos salvos em cache enquanto revalida atualizações na rede em segundo plano.

Convenções do projeto
Paleta Oficial de Cores (Identidade Visual e Logos):

Fundo Escuro (Dark Mode): #1C1C1E (iOS Dark Gray)

Fundo Claro (Light Mode): #F4F5F7 (Apple Soft White)

Logo Ciano (Dark Mode): #00D8F6

Logo Azul (Light Mode): #0066CC

Nomenclatura: kebab-case para seletores de ID e classes CSS; camelCase para funções, métodos e variáveis JS; UPPERCASE para constantes do motor.

Manipulação de Datas: Operações com datas usam estritamente strings no formato ISO Local (YYYY-MM-DD) via funções auxiliares (getLocalISODate() e parseLocalDate()) para prevenir bugs de fusos horários.

Mapeamento de Temas: O controle de aparência visual é aplicado na tag raiz <body data-theme="dark|light">.

Mobile-First Touch Interaction: Botões, cards e controles de formulário possuem tamanhos de toque expansivos com efeitos de micro-animações estilo iOS.

Dependências importantes
Chart.js (via CDN): Injetado no index.html, é responsável pela renderização do gráfico interativo de linhas e barras (#chart-carga) que plota as curvas de CTL, ATL e TSB.

Google Fonts: Provedor das fontes Inter (corpo de texto), Outfit (títulos e métricas) e Orbitron (marca).

Estrutura resumida
Plaintext
/
├── index.html          # Shell HTML, telas principais, modais e wizards
├── style.css           # Design System, variáveis de tema e componentes Glassmorphic
├── app.js              # Classe RunningCoach, cálculos fisiológicos e manipulação DOM
├── sw.js               # Service Worker PWA para suporte offline
├── manifest.json       # Configurações de instalação PWA e ícones
└── img/                # Ícones PWA e logos SVG da marca (Light e Dark)
    ├── Trote-logo.svg
    ├── Trote-logo-light.svg
    ├── icon-192.png
    ├── icon-192-light.png
    ├── icon-512.png
    └── icon-512-light.png
Arquivos essenciais
app.js: Concentra todo o motor fisiológico, periodização, inteligência de sobrecarga da IA e controle da interface.

index.html: Define o esqueleto visual completo da SPA, incluindo telas de Onboarding, Dashboard, Hoje e modais.

style.css: Gerencia a identidade visual, temas claro e escuro e estilização responsiva estilo iOS.

sw.js: Garante a execução do app em modo offline e instalação PWA.

Decisões arquiteturais
Desenvolvimento Vanilla JS (Sem Frameworks): Escolhido para garantir carregamento instantâneo, zero dependências de compilação/build e altíssima performance em dispositivos móveis.

Persistência 100% Local (localStorage): Elimina necessidade de backend e banco de dados externo, garantindo total privacidade do atleta e funcionamento offline.

Compromissos e Limitações: A ausência de banco de dados em nuvem vincula os dados estritamente ao navegador do dispositivo do usuário.

Pontos de atenção
Integridade do Esquema no localStorage: Alterações na estrutura do objeto this.state podem causar inconformidades com dados previamente salvos na chave trote_app_v4.

Injeção de HTML Direta (innerHTML): A atualização da UI é feita por renderização direta de string HTML, exigindo cuidado com delegação de eventos para evitar vazamento de memória ou duplicação de ouvintes.

Estilização de Ícones com Tema: A alternância de logos depende do código JS sincronizar os seletores #brand-logo-img e link[rel="icon"].

Como adicionar uma nova funcionalidade
Modelagem de Dados: Atualize o schema no construtor da classe RunningCoach em app.js.

Lógica de Domínio: Adicione os métodos de cálculo ou mutação dentro da classe RunningCoach (app.js).

Marcação HTML: Insira a estrutura visual necessária (card, modal ou formulário) no index.html.

Estilização CSS: Adicione as regras de estilo correspondentes no style.css respeitando os tokens do tema.

Vínculo na UI: Atualize as funções atualizarTelasGlobais() ou renderizarTelas() em app.js para refletir os novos dados no DOM.

Glossário
TSS (Training Stress Score): Pontuação de estresse gerada por uma sessão de treino.

CTL (Chronic Training Load / Fitness): Média de carga acumulada no longo prazo (~42 dias).

ATL (Acute Training Load / Fadiga): Média de carga no curto prazo (~7 dias).

TSB (Training Stress Balance / Forma): Indicador de prontidão física (CTL - ATL).

ACWR (Acute:Chronic Workload Ratio): Razão entre carga aguda e crônica usada para mitigar riscos de lesão.

sRPE (Session Rate of Perceived Exertion): Escala de percepção subjetiva do esforço do treino (1 a 10).

Karvonen / HRR: Método de zonas cardíacas baseado na Frequência Cardíaca de Reserva.

VDOT: Índice de capacidade aeróbica e ritmo de corrida derivado dos métodos de Jack Daniels.

Negative Split: Estratégia de corrida onde a segunda metade da prova é realizada num ritmo mais rápido que a primeira.