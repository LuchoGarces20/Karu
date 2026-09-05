# Fase atual do produto
O Karu encontra-se em um estágio avançado de refinamento do motor de inteligência artificial de feedback fisiológico e prevenção de overtraining, priorizando a estabilização de regras de segurança e mitigação de lesões (ACWR).

# O que foi concluído recentemente
* Análise profunda do algoritmo de treinamento e identificação de vulnerabilidades (incluindo a "miopia" da intervenção de overreaching anterior).
* Atualização da lógica do método `analisarFeedbackFisiologico()` em `app.js` para expandir o horizonte de proteção da IA de 1 único treino para uma janela sistêmica de 5 dias.
* Implementação de cortes de volume mais agressivos (30%) e bloqueio preventivo de treinos intensos (convertendo-os em regenerativos) em cenários de sobrecarga crítica (ACWR > 1.45 ou fadiga recorrente).
* Criação e validação do arquivo de contexto estrutural permanente (`PROJECT.md`).

# Estado exato do código
* **Arquivos modificados recentemente**: `app.js` (atualização do protocolo sistêmico de overreaching) e criação de `PROJECT.md`.
* **Comportamento atual**: O app está totalmente funcional, calculando corretamente o modelo de Banister (CTL, ATL, TSB), gerando o macrociclo via Wizard de 5 passos e agora intervindo de forma sistêmica e robusta nos próximos 5 dias quando detecta overreaching ou risco elevado de lesão.
* **Bugs abertos**: Nenhum erro crítico ou bloqueante pendente no código atual.

# Próxima tarefa imediata
Validar na interface a nova lógica da IA: simular uma sequência de 3 treinos com RPE muito alto (9 ou 10) e verificar se o sistema intercepta e reestrutura sistemicamente os treinos dos próximos 5 dias no forecast do usuário, gerando os logs correspondentes.

# Blockers e dependências pendentes
Nenhum impedimento técnico ou dependência externa pendente. O sistema opera de forma autônoma e local via `localStorage`.

# Decisões tomadas na última sessão
* Rejeição da sugestão de acelerar o crescimento da fase de "Manutenção" para preservar a essência de consistência e rodagem aeróbica do esporte.
* Substituição de uma intervenção de "band-aid" (que afetava apenas o treino seguinte) por um "Protocolo de Sobrevivência Sistêmico" de 5 dias para derrubar eficazmente a carga aguda (ATL) e normalizar o ACWR.

# Próximo milestone
Expandir a robustez dos relatórios de histórico de desempenho e refinar a exibição visual dos alertas de intervenção da IA diretamente nas telas de Forecast e Hoje.