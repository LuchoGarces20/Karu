const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;

function applyTheme(themeName) {
    body.setAttribute('data-theme', themeName);
    localStorage.setItem('karu_theme', themeName);
}

const savedTheme = localStorage.getItem('karu_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(savedTheme);

themeToggleBtn.addEventListener('click', () => {
    applyTheme(body.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
});

const STORAGE_KEY = 'karu_app_v4';

class RunningCoach {
    constructor() {
        this.state = this.loadState();
        if (this.state) {
            if(!this.state.atleta.tenis) this.state.atleta.tenis = [];
            this.recalcularLinhaDoTempo();
        }
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    }
    
    saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }
    
    recalcularLinhaDoTempo() {
        if (!this.state || !this.state.atleta || !this.state.atleta.dataInicioISO) return;
        
        const dataInicial = new Date(this.state.atleta.dataInicioISO + "T00:00:00");
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        
        let ctlAtual = this.state.atleta.ctlInicial;
        let atlAtual = this.state.atleta.ctlInicial * 1.2;
        
        const tauCTL = 42;
        const tauATL = 7;
        const alphaCTL = 1 - Math.exp(-1 / tauCTL); 
        const alphaATL = 1 - Math.exp(-1 / tauATL);
        
        const diasTotais = Math.floor((hoje - dataInicial) / (1000 * 60 * 60 * 24));
        
        this.state.atleta.historicoCTL = [];
        
        for(let i = 0; i <= diasTotais; i++) {
            let dataIteracao = new Date(dataInicial);
            dataIteracao.setDate(dataInicial.getDate() + i);
            const dataIsoStr = dataIteracao.toISOString().split('T')[0];
            
            ctlAtual = ctlAtual * Math.exp(-1 / tauCTL);
            atlAtual = atlAtual * Math.exp(-1 / tauATL);
            
            const treinosDoDia = this.state.treinosRealizados.filter(t => t.dataISO === dataIsoStr);
            let tssDia = 0;
            treinosDoDia.forEach(t => tssDia += t.tss);
            
            if(tssDia > 0) {
                ctlAtual += (tssDia * alphaCTL);
                atlAtual += (tssDia * alphaATL);
            }
            
            this.state.atleta.historicoCTL.push({ dataISO: dataIsoStr, ctl: ctlAtual, atl: atlAtual });
        }
        
        this.state.atleta.ctl = ctlAtual;
        this.state.atleta.atl = atlAtual;
        this.state.atleta.tsb = ctlAtual - atlAtual;
        this.state.atleta.ultimaAtualizacaoISO = hoje.toISOString().split('T')[0];
        
        this.saveState();
    }
    
    initSetup(dadosForm) {
        const fcMaxDigitada = parseInt(dadosForm.fcMax);
        const fcMaxCalc = (!isNaN(fcMaxDigitada) && fcMaxDigitada > 0) ? fcMaxDigitada : Math.round(208 - 0.7 * dadosForm.idade);
        
        const distAtualSegura = Math.max(1, dadosForm.distAtual);
        const tempoAtualSeguro = Math.max(1, dadosForm.tempoAtual);
        const paceAtualSegundos = Math.round((tempoAtualSeguro / distAtualSegura) * 60);
        
        const volSemanal = Math.max(distAtualSegura, dadosForm.volSemanal);
        const tssSemanal = ((volSemanal * (paceAtualSegundos / 60)) / 60) * Math.pow(0.75, 2) * 100;
        const ctlInicial = tssSemanal / 7; 
        
        let dias = dadosForm.diasSelecionados;
        dias.sort((a,b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
        
        const dayLongao = dias[dias.length - 1]; 
        let dayTempo = dias[0]; 
        if(dias.length >= 3) dayTempo = dias[Math.floor((dias.length - 1) / 2)];
        
        const diasRegen = dias.filter(d => d !== dayLongao && d !== dayTempo);
        const dataHojeISO = new Date().toISOString().split('T')[0];
        
        const tenisInicial = [{
            id: Date.now(),
            nome: dadosForm.tenisNome,
            categoria: dadosForm.tenisCat,
            kmAcumulados: 0
        }];
        
        this.state = {
            atleta: {
                nome: dadosForm.nome, idade: dadosForm.idade, genero: dadosForm.genero,
                fcMax: fcMaxCalc, fcRepouso: dadosForm.fcRepouso, 
                paceBaseSegundos: paceAtualSegundos, 
                distanciaAtualMax: distAtualSegura,
                volumeSemanalBase: volSemanal, 
                dataInicioISO: dataHojeISO,
                ctlInicial: ctlInicial, ctl: ctlInicial, atl: ctlInicial * 1.2, tsb: ctlInicial - (ctlInicial * 1.2),
                multiplicadorVolume: 1.0, historicoCTL: [],
                tenis: tenisInicial,
                ultimaAtualizacaoISO: dataHojeISO,
                diasTreino: { longao: dayLongao, tempo: dayTempo, regen: diasRegen }
            },
            prova: { distancia: dadosForm.distAlvo, dataStr: dadosForm.dataAlvo },
            plano: [], treinosRealizados: [], logs: []
        };
        
        this.state.logs.push({ data: new Date().toLocaleDateString('pt-BR'), msg: `Calibração Karvonen ativa (FC Máx: ${fcMaxCalc}, Repouso: ${dadosForm.fcRepouso}). Tênis '${dadosForm.tenisNome}' cadastrado.` });
        
        this.gerarPlanoTreino();
        this.recalcularLinhaDoTempo();
    }
    
    gerarPlanoTreino() {
        const dataInicio = new Date(this.state.atleta.dataInicioISO + "T00:00:00");
        const dataFim = new Date(this.state.prova.dataStr + "T00:00:00");
        const diasTotais = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24));
        
        const { longao, tempo, regen } = this.state.atleta.diasTreino;
        const numRegen = Math.max(1, regen.length);
        
        let idCounter = 0; 
        this.state.plano = [];
        const volSemanalBase = this.state.atleta.volumeSemanalBase;
        const capSemanalAbsoluto = Math.max(volSemanalBase * 1.15, this.state.prova.distancia * 2.5);
        let maxLongao = this.state.prova.distancia >= 42.2 ? 34 : this.state.prova.distancia * 0.9;
        
        for (let i = 0; i <= diasTotais; i++) {
            let dataTreino = new Date(dataInicio);
            dataTreino.setDate(dataInicio.getDate() + i);
            const diaSemana = dataTreino.getDay() === 0 ? 7 : dataTreino.getDay();
            const diaSemanaNormal = dataTreino.getDay();
            
            const semanasParaProva = Math.ceil((diasTotais - i) / 7);
            const numeroSemanaAtual = Math.floor(i / 7);
            const ehDeload = (numeroSemanaAtual % 4 === 3);
            let volSemanalAtual = Math.min(volSemanalBase * Math.pow(1.05, numeroSemanaAtual), capSemanalAbsoluto);
            
            if (ehDeload) volSemanalAtual *= 0.75;
            if (semanasParaProva === 2) volSemanalAtual *= 0.6;
            if (semanasParaProva === 1) volSemanalAtual *= 0.4;
            
            let tipo = "Descanso", distancia = 0, prescricao = "", estrutura = [];
            
            if (i === diasTotais) {
                tipo = "PROVA ALVO"; distancia = this.state.prova.distancia; 
                prescricao = "O trabalho está feito. Confie no polimento e execute.";
                estrutura = [`${distancia}km contínuos com estratégia de prova.`];
            } else if ((diaSemanaNormal === longao || diaSemana === longao) && i !== diasTotais) {
                tipo = "Longão"; 
                distancia = Math.min(volSemanalAtual * 0.45, maxLongao); 
                if (semanasParaProva <= 2) prescricao = "Tapering (Polimento). Absorção de carga.";
                else if (ehDeload) prescricao = "Semana Regenerativa (Deload).";
                else prescricao = "Construção aeróbica primária (LISS). Segure o ritmo na Z2.";
                estrutura = [`${distancia.toFixed(1)}km contínuos em Z2 rígida.`];
            } else if (diaSemanaNormal === tempo || diaSemana === tempo) {
                const intensos = ["Tempo Run", "Intervalado VO2", "Fartlek", "Subidas"];
                tipo = intensos[numeroSemanaAtual % 4];
                
                if(tipo === "Tempo Run") {
                    distancia = Math.max(4, volSemanalAtual * 0.20);
                    prescricao = "Limiar de Lactato. Desconforto controlado.";
                    estrutura = ["Aquecimento: 2km Z1", `Principal: ${Math.max(2, Math.round(distancia-3))}km Z3-Z4`, "Soltura: 1km Z1"];
                } else if(tipo === "Intervalado VO2") {
                    distancia = Math.max(5, volSemanalAtual * 0.18);
                    let reps = Math.max(4, Math.round(distancia / 1.5));
                    prescricao = "Aumento do teto aeróbico (VO2 Max).";
                    estrutura = ["Aquecimento: 15min Z1", `Principal: ${reps}x 400m Z5 (Pausa 90s)`, "Soltura: 10min Z1"];
                } else if(tipo === "Fartlek") {
                    distancia = Math.max(5, volSemanalAtual * 0.20);
                    prescricao = "Mudanças de ritmo. Feel the pace.";
                    estrutura = ["Aquecimento: 10min Z1", "Principal: 10x (1min Z4 / 1min Z1)", "Soltura: 10min Z1"];
                } else if(tipo === "Subidas") {
                    distancia = Math.max(4, volSemanalAtual * 0.15);
                    prescricao = "Força específica e mecânica.";
                    estrutura = ["Aquecimento: 15min Z1", "Principal: 8x 30s rampa Z5 (desce trotando)", "Soltura: 10min Z1"];
                }
            } else if (regen.includes(diaSemanaNormal) || regen.includes(diaSemana)) {
                tipo = "Regenerativo"; 
                distancia = Math.max(3, (volSemanalAtual * 0.35) / numRegen); 
                prescricao = "Active Recovery. Flushing do ácido lático.";
                estrutura = [`${distancia.toFixed(1)}km extremamente leve (Z1)`];
            }
            this.state.plano.push({
                id: idCounter++, dataISO: dataTreino.toISOString().split('T')[0],
                tipo: tipo, distanciaBase: parseFloat(distancia.toFixed(1)), 
                prescricao: prescricao, estrutura: estrutura, concluido: false
            });
        }
    }
    
    _segundosParaPace(seg) {
        if(!seg || isNaN(seg)) return "00:00";
        const m = Math.floor(seg / 60); 
        const s = Math.round(seg % 60); 
        return `${m < 10 ? '0':''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    
    _paceParaSegundos(str) {
        const parts = str.split(':');
        if(parts.length !== 2) return 330; 
        return (parseInt(parts[0]) * 60) + parseInt(parts[1]);
    }
    
    obterZonasKarvonen() {
        const base = this.state.atleta.paceBaseSegundos;
        const fcMax = this.state.atleta.fcMax;
        const fcRep = this.state.atleta.fcRepouso;
        const hrr = fcMax - fcRep;
        
        const calcBPM = (minPct, maxPct) => `${Math.round(fcRep + (minPct * hrr))}-${Math.round(fcRep + (maxPct * hrr))} bpm`;
        return {
            "Regenerativo": { pace: `${this._segundosParaPace(base * 1.30)}/km`, fc: `Z1 (${calcBPM(0.50, 0.60)})` },
            "Longão": { pace: `${this._segundosParaPace(base * 1.15)}/km`, fc: `Z2 (${calcBPM(0.60, 0.70)})` },
            "Tempo Run": { pace: `${this._segundosParaPace(base * 0.98)}/km`, fc: `Z3/Z4 (${calcBPM(0.75, 0.85)})` },
            "Intervalado VO2": { pace: `${this._segundosParaPace(base * 0.85)}/km`, fc: `Z5 (${calcBPM(0.90, 1.00)})` },
            "Fartlek": { pace: "Variado", fc: `Z2 a Z4 (${calcBPM(0.60, 0.85)})` },
            "Subidas": { pace: "Esforço Máx", fc: `Z5 (${calcBPM(0.90, 1.00)})` },
            "PROVA ALVO": { pace: `${this._segundosParaPace(base * 1.02)}/km`, fc: `Z4/Máx` },
            "Descanso": { pace: "-", fc: "-" }
        };
    }
    
    obterTenisSugerido(tipoTreino) {
        const lista = this.state.atleta.tenis || [];
        if (lista.length === 0) return null; 
        
        const ehVelocidade = tipoTreino.includes("Tempo") || tipoTreino.includes("Intervalado") || tipoTreino === "PROVA ALVO";
        const categoriaAlvo = ehVelocidade ? "velocidade" : "rodagem";
        let sugerido = lista.find(t => t.categoria === categoriaAlvo);
        if (!sugerido) sugerido = lista.find(t => t.categoria === "versatil");
        
        return sugerido ? sugerido.id : lista[0].id;
    }
    
    adicionarTenis(nome, categoria) {
        this.state.atleta.tenis = this.state.atleta.tenis || [];
        this.state.atleta.tenis.push({
            id: Date.now(),
            nome: nome,
            categoria: categoria,
            kmAcumulados: 0
        });
        this.state.logs.unshift({ data: new Date().toLocaleDateString('pt-BR'), msg: `Tênis '${nome}' adicionado à garagem.` });
        this.saveState();
    }
    
    processarTreino(treinoId, distReal, tempoMin, fcMedia, rpe, tenisId) {
        const treino = this.state.plano.find(t => t.id === parseInt(treinoId));
        if(!treino) return;
        treino.concluido = true;
        let tss = 0, logMsg = `[${treino.tipo}] ${distReal}km. `;
        
        if (tenisId && tenisId !== "") {
            const tenisUsado = this.state.atleta.tenis.find(t => t.id == tenisId);
            if(tenisUsado) {
                tenisUsado.kmAcumulados += distReal;
                logMsg += `Tênis: ${tenisUsado.nome}. `;
            }
        }
        
        if (!isNaN(fcMedia) && fcMedia > this.state.atleta.fcMax) {
            this.state.atleta.fcMax = fcMedia;
            logMsg += `Nova FC Máx (${fcMedia}). `;
        }
        
        if (!isNaN(fcMedia) && fcMedia > 0) {
            const hrr = this.state.atleta.fcMax - this.state.atleta.fcRepouso;
            const hrRatio = Math.max(0.1, Math.min(1, (fcMedia - this.state.atleta.fcRepouso) / hrr));
            const ifFactor = hrRatio / 0.85; 
            tss = (tempoMin / 60) * Math.pow(ifFactor, 2) * 100;
        } else {
            const ifFactor = Math.max(0.4, rpe / 7.5);
            tss = (tempoMin / 60) * Math.pow(ifFactor, 2) * 100;
        }
        
        tss = Math.round(tss);
        logMsg += `Carga: ${tss} TSS.`;
        
        this.state.treinosRealizados.push({ 
            idReferencia: treino.id, 
            dataISO: treino.dataISO, 
            tss: tss, 
            dist: distReal,
            tenisId: tenisId 
        });
        this.recalcularLinhaDoTempo();
        this.state.logs.unshift({ data: new Date().toLocaleDateString('pt-BR'), msg: logMsg });
        this.saveState();
    }
    
    deletarTreino(idRef, dataISO) {
        if(confirm("Remover este treino do histórico? Os dados de carga e a quilometragem do tênis serão recalculados.")) {
            const idx = this.state.treinosRealizados.findIndex(t => t.idReferencia == idRef && t.dataISO === dataISO);
            if(idx > -1) {
                const treinoRemovido = this.state.treinosRealizados[idx];
                
                if(treinoRemovido.tenisId) {
                    const tenisRestaurado = this.state.atleta.tenis.find(t => t.id == treinoRemovido.tenisId);
                    if(tenisRestaurado) {
                        tenisRestaurado.kmAcumulados = Math.max(0, tenisRestaurado.kmAcumulados - treinoRemovido.dist);
                    }
                }
                
                this.state.treinosRealizados.splice(idx, 1);
                const treinoPlano = this.state.plano.find(p => p.id == idRef && p.dataISO === dataISO);
                if(treinoPlano) treinoPlano.concluido = false;
                
                this.state.logs.unshift({ data: new Date().toLocaleDateString('pt-BR'), msg: `Treino de ${dataISO} removido. TSS e KMs estornados.` });
                this.recalcularLinhaDoTempo();
                atualizarTelasGlobais();
            }
        }
    }

    // ==== NOVO ALGORITMO: ÍNDICE DE FOSTER (14 DIAS) ====
    calcularMonotoniaEFoster() {
        if (!this.state || !this.state.treinosRealizados) return { monotonia: 0, strain: 0, status: "Ideal" };

        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        
        const DIAS = 14;
        let cargasUltimos14Dias = [];
        
        // 1. Extrai a carga (TSS) dos últimos 14 dias consecutivos
        for (let i = DIAS - 1; i >= 0; i--) {
            let d = new Date(hoje);
            d.setDate(hoje.getDate() - i);
            const dataIsoStr = d.toISOString().split('T')[0];
            
            const treinosDoDia = this.state.treinosRealizados.filter(t => t.dataISO === dataIsoStr);
            let tssDia = 0;
            treinosDoDia.forEach(t => tssDia += t.tss);
            
            cargasUltimos14Dias.push(tssDia);
        }

        // 2. Cálculo da Média (μ)
        const somaTotal = cargasUltimos14Dias.reduce((acc, val) => acc + val, 0);
        const media = somaTotal / DIAS;

        // 3. Cálculo do Desvio Padrão (σ)
        const variancia = cargasUltimos14Dias.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / DIAS;
        const desvioPadrao = Math.sqrt(variancia);

        // Evita divisão por zero caso o atleta não tenha treinado nada ou sempre a mesma carga 0
        if (desvioPadrao === 0) {
            return { monotonia: media > 0 ? 2.0 : 0, strain: somaTotal, status: "Sem variação" };
        }

        // 4. Índices de Foster
        const monotonia = media / desvioPadrao;
        const strain = somaTotal * monotonia;

        let status = "Ideal";
        if (monotonia > 2.0) status = "Alto Risco";
        else if (monotonia >= 1.5) status = "Atenção";

        return {
            monotonia: parseFloat(monotonia.toFixed(2)),
            strain: Math.round(strain),
            status: status
        };
    }
}

const app = new RunningCoach();

function formatarDataHoje() {
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const d = new Date();
    return `${dias[d.getDay()]}, ${d.getDate()} ${meses[d.getMonth()]}`;
}

function renderizarTelas() {
    const navTabs = document.getElementById('nav-tabs');
    const btnConfig = document.getElementById('btn-config');
    
    if (!app.state) {
        navTabs.classList.remove('active');
        btnConfig.style.display = 'none';
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
        document.getElementById('screen-setup').classList.add('active-screen');
        
        const minDate = new Date(); minDate.setDate(minDate.getDate() + 28);
        document.getElementById('setup-data-alvo').value = minDate.toISOString().split('T')[0];
    } else {
        navTabs.classList.add('active');
        btnConfig.style.display = 'flex';
        switchTab('screen-today', 'tab-today');
        atualizarTelasGlobais();
    }
}

function switchTab(screenId, tabId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
    document.getElementById(screenId).classList.add('active-screen');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    if(screenId === 'screen-dashboard') {
        renderizarGrafico();
    }
}

function renderizarGrafico() {
    if(!app.state || !app.state.atleta.historicoCTL) return;
    const ctx = document.getElementById('chart-carga');
    
    const historicoRecente = app.state.atleta.historicoCTL.slice(-30);
    const labels = historicoRecente.map(h => {
        const [,m,d] = h.dataISO.split('-'); return `${d}/${m}`;
    });
    
    if(window.cargaChart) window.cargaChart.destroy();
    
    Chart.defaults.color = '#A1A1AA';
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    window.cargaChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Fitness (CTL)',
                    data: historicoRecente.map(h => h.ctl),
                    borderColor: '#0284C7',
                    backgroundColor: 'rgba(2, 132, 199, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0
                },
                {
                    label: 'Fadiga (ATL)',
                    data: historicoRecente.map(h => h.atl),
                    borderColor: '#F43F5E',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    type: 'bar',
                    label: 'Forma (TSB)',
                    data: historicoRecente.map(h => (h.ctl - h.atl)),
                    backgroundColor: (context) => {
                        const val = context.raw;
                        return val > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
                    },
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } }
            },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function atualizarTelasGlobais() {
    const hojeISO = new Date().toISOString().split('T')[0];
    const treinoHoje = app.state.plano.find(t => t.dataISO === hojeISO);
    const zonas = app.obterZonasKarvonen();
    const uiHoje = document.getElementById('ui-hoje');
    
    if (!treinoHoje) {
        uiHoje.innerHTML = `<div class="today-date">${formatarDataHoje()}</div><h2 class="today-type">Ciclo Concluído</h2><p class="today-desc">Jornada finalizada.</p>`;
    } else if (treinoHoje.concluido) {
        uiHoje.innerHTML = `<div class="today-date">${formatarDataHoje()}</div><h2 class="today-type">${treinoHoje.tipo}</h2><div class="today-done"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div><p class="today-desc">Sessão finalizada. Foco na recuperação.</p>`;
    } else if (treinoHoje.tipo === "Descanso") {
        uiHoje.innerHTML = `<div class="today-date">${formatarDataHoje()}</div><h2 class="today-type">Recovery</h2><div class="today-rest"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></div><p class="today-desc">O ganho de performance ocorre no repouso.</p>`;
    } else {
        const paceAlvo = zonas[treinoHoje.tipo]?.pace || '-';
        const fcAlvo = zonas[treinoHoje.tipo]?.fc || '-';
        const distCalculada = parseFloat((treinoHoje.distanciaBase * app.state.atleta.multiplicadorVolume).toFixed(1));
        
        let htmlEstrutura = '';
        if (treinoHoje.estrutura && treinoHoje.estrutura.length > 0) {
            htmlEstrutura = `<div class="workout-structure"><div class="workout-structure-title">Execução</div>` + 
                 treinoHoje.estrutura.map(bloco => `<div class="workout-block">${bloco}</div>`).join('') + `</div>`;
        }
        const tenisIdSugerido = app.obterTenisSugerido(treinoHoje.tipo);
        let nomeTenisSugerido = "Escolha um tênis";
        if(tenisIdSugerido) {
            const tFound = app.state.atleta.tenis.find(t => t.id === tenisIdSugerido);
            if(tFound) nomeTenisSugerido = tFound.nome;
        }
        let hintTenis = app.state.atleta.tenis.length > 0 
            ? `<div style="margin-bottom: 20px; font-size: 0.82rem; color: var(--brand-accent); font-weight: 700;">Tênis Recomendado: <span style="color: var(--text-primary); font-weight: 600;">${nomeTenisSugerido}</span></div>`
            : '';
            
        uiHoje.innerHTML = `
            <div class="today-date">${formatarDataHoje()}</div>
            <h2 class="today-type">${treinoHoje.tipo}</h2>
            <div class="today-distance">${distCalculada}<span>km</span></div>
            
            <div class="today-metrics">
                <div class="today-metrics-card"><div>Pace Alvo</div><strong>${paceAlvo}</strong></div>
                <div class="today-metrics-card"><div>Frequência Cardíaca</div><strong>${fcAlvo}</strong></div>
            </div>
            
            ${htmlEstrutura}
            ${hintTenis}
            
            <p class="today-desc" style="font-size:0.85rem;">"${treinoHoje.prescricao}"</p>
            <button class="btn-giant" onclick="abrirTreino(${treinoHoje.id}, '${treinoHoje.tipo}', ${distCalculada})">Registrar Treino</button>
        `;
    }

    const ctl = app.state.atleta.ctl;
    const atl = app.state.atleta.atl;
    document.getElementById('val-ctl').innerText = Math.round(ctl);
    document.getElementById('val-atl').innerText = Math.round(atl);
    
    const acwr = ctl > 0 ? (atl / ctl).toFixed(2) : (0).toFixed(2);
    const acwrEl = document.getElementById('val-acwr');
    acwrEl.innerText = acwr;
    acwrEl.classList.remove('positive', 'warning', 'danger');
    if (acwr <= 1.3) acwrEl.classList.add('positive');
    else if (acwr <= 1.5) acwrEl.classList.add('warning');
    else acwrEl.classList.add('danger');

    const tsb = Math.round(app.state.atleta.tsb);
    const tsbEl = document.getElementById('val-tsb');
    tsbEl.innerText = tsb > 0 ? `+${tsb}` : tsb;
    tsbEl.classList.remove('positive', 'negative', 'danger');
    if (tsb >= -15 && tsb <= 10) tsbEl.classList.add('positive'); 
    else if (tsb < -25) tsbEl.classList.add('danger'); 
    else tsbEl.classList.add('negative'); 

    // ==== ATUALIZAÇÃO DOM: ÍNDICE DE FOSTER ====
    const foster = app.calcularMonotoniaEFoster();
    const monoEl = document.getElementById('val-monotonia');
    if (monoEl) {
        monoEl.innerText = foster.monotonia > 0 ? foster.monotonia : '--';
        monoEl.classList.remove('positive', 'warning', 'danger');
        
        if (foster.monotonia > 2.0) monoEl.classList.add('danger');
        else if (foster.monotonia >= 1.5) monoEl.classList.add('warning');
        else if (foster.monotonia > 0) monoEl.classList.add('positive');
    }

    const uiGaragem = document.getElementById('ui-garagem');
    if (app.state.atleta.tenis.length === 0) {
        uiGaragem.innerHTML = '<p style="color: var(--text-tertiary); font-size: 0.85rem;">Adicione seus tênis para rastrear o desgaste.</p>';
    } else {
        const catMap = {
            'rodagem': '👟 Rodagem',
            'velocidade': '⚡ Velocidade',
            'versatil': '🔄 Versátil'
        };
        
        uiGaragem.innerHTML = app.state.atleta.tenis.map(t => `
            <div class="shoe-card">
                <div class="shoe-info">
                    <strong>${t.nome}</strong>
                    <span>${catMap[t.categoria] || t.categoria}</span>
                </div>
                <div class="shoe-km">
                    ${t.kmAcumulados.toFixed(1)}<span>KM</span>
                </div>
            </div>
        `).join('');
    }

    const uiHistorico = document.getElementById('ui-historico');
    if (app.state.treinosRealizados.length === 0) {
        uiHistorico.innerHTML = '<p style="color: var(--text-tertiary); font-size: 0.85rem;">Nenhum treino registrado ainda.</p>';
    } else {
        uiHistorico.innerHTML = [...app.state.treinosRealizados].reverse().slice(0, 10).map(t => {
            const [,m,d] = t.dataISO.split('-');
            let nomeTenisLog = "";
            if(t.tenisId) {
                const tr = app.state.atleta.tenis.find(x => x.id == t.tenisId);
                if(tr) nomeTenisLog = `<br><span style="font-size:0.75rem; color:var(--brand-accent);">👟 ${tr.nome}</span>`;
            }
            return `
            <div class="history-card">
                <div class="history-card-info">
                    <strong>${d}/${m}</strong> - ${t.dist}km <br>
                    <span>Carga Gerada: ${t.tss} TSS</span>
                    ${nomeTenisLog}
                </div>
                <button class="btn-icon-small" onclick="app.deletarTreino('${t.idReferencia}', '${t.dataISO}')">Excluir</button>
            </div>`;
        }).join('');
    }

    const feed = document.getElementById('feed-relatorios');
    feed.innerHTML = app.state.logs.slice(0, 10).map(log => `<div class="log-entry"><span class="log-date">${log.data}</span>${log.msg}</div>`).join('');

    const uiCalendario = document.getElementById('ui-calendario');
    uiCalendario.innerHTML = '';
    app.state.plano.filter(t => t.dataISO >= hojeISO).slice(0, 7).forEach(treino => {
        const ehHoje = treino.dataISO === hojeISO;
        const ehDescanso = treino.tipo === "Descanso";
        const [, m, d] = treino.dataISO.split('-');
        
        let html = `<div class="day-card ${ehHoje ? 'today' : ''} ${treino.concluido ? 'done' : ''}">
            <div class="day-info">
                <div class="day-date">${ehHoje ? 'HOJE' : `${d}/${m}`}</div>
                <div class="day-title">${treino.tipo}</div>
                ${!ehDescanso ? `<div class="day-details">Zonas: ${zonas[treino.tipo]?.fc || '-'}</div>` : ``}
            </div>`;
        if (treino.concluido) html += `<div><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></div>`;
        html += `</div>`;
        uiCalendario.innerHTML += html;
    });
}

window.abrirPlanoCompleto = function() {
    if(!app.state) return;
    const container = document.getElementById('container-plano-completo');
    container.innerHTML = '';
    
    let semanaAtualNum = 1;
    let htmlSemana = `<div class="week-group"><div class="week-header"><span>Semana ${semanaAtualNum}</span></div>`;
    
    app.state.plano.forEach((treino, index) => {
        const [, m, d] = treino.dataISO.split('-');
        if (index > 0 && index % 7 === 0) {
            semanaAtualNum++;
            htmlSemana += `</div><div class="week-group"><div class="week-header"><span>Semana ${semanaAtualNum}</span></div>`;
        }
        htmlSemana += `
            <div class="day-card ${treino.concluido ? 'done' : ''}" style="margin-bottom:6px; padding:12px 14px;">
                <div class="day-info">
                    <div class="day-date">${d}/${m}</div>
                    <div class="day-title" style="font-size: 0.9rem;">${treino.tipo}</div>
                </div>
            </div>`;
    });
    htmlSemana += `</div>`;
    container.innerHTML = htmlSemana;
    abrirModal('modal-plano');
}

document.getElementById('form-tenis').addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('input-tenis-nome').value;
    const cat = document.getElementById('input-tenis-cat').value;
    
    app.adicionarTenis(nome, cat);
    fecharModal('modal-tenis');
    e.target.reset();
    atualizarTelasGlobais();
});

document.getElementById('form-setup').addEventListener('submit', (e) => {
    e.preventDefault();
    const dias = Array.from(document.querySelectorAll('input[name="setup-dias"]:checked')).map(el => parseInt(el.value));
    if (dias.length < 2) return alert("Selecione pelo menos 2 dias.");
    
    app.initSetup({
        nome: document.getElementById('setup-nome').value, 
        idade: parseInt(document.getElementById('setup-idade').value),
        genero: document.getElementById('setup-genero').value,
        diasSelecionados: dias,
        distAlvo: parseFloat(document.getElementById('setup-dist-alvo').value),
        dataAlvo: document.getElementById('setup-data-alvo').value, 
        distAtual: parseFloat(document.getElementById('setup-dist-atual').value),
        tempoAtual: parseInt(document.getElementById('setup-tempo-atual').value), 
        volSemanal: parseFloat(document.getElementById('setup-vol-semanal').value),
        fcRepouso: parseInt(document.getElementById('setup-fc-repouso').value),
        fcMax: document.getElementById('setup-fc-max').value,
        tenisNome: document.getElementById('setup-tenis-nome').value,
        tenisCat: document.getElementById('setup-tenis-cat').value
    });
    renderizarTelas();
});

window.abrirModal = function(idModal) { document.getElementById(idModal).classList.add('active'); }
window.fecharModal = function(idModal) { document.getElementById(idModal).classList.remove('active'); }
window.fecharModaisFora = function(event, idModal) { if (event.target === document.getElementById(idModal)) fecharModal(idModal); }

window.abrirTreino = function(id, tipo, distCalculada) {
    abrirModal('modal-treino');
    document.getElementById('treino-id').value = id; 
    document.getElementById('input-dist').value = distCalculada;
    
    const selectTenis = document.getElementById('input-treino-tenis');
    selectTenis.innerHTML = '';
    if(app.state.atleta.tenis.length === 0) {
        selectTenis.innerHTML = '<option value="">Nenhum tênis cadastrado</option>';
    } else {
        const idSugerido = app.obterTenisSugerido(tipo);
        app.state.atleta.tenis.forEach(t => {
            const isSelected = (t.id === idSugerido) ? 'selected' : '';
            selectTenis.innerHTML += `<option value="${t.id}" ${isSelected}>${t.nome}</option>`;
        });
    }
}

document.getElementById('form-treino').addEventListener('submit', (e) => {
    e.preventDefault();
    app.processarTreino(
        document.getElementById('treino-id').value,
        parseFloat(document.getElementById('input-dist').value),
        parseInt(document.getElementById('input-tempo').value),
        parseInt(document.getElementById('input-fc').value),
        parseInt(document.getElementById('input-rpe').value),
        document.getElementById('input-treino-tenis').value
    );
    fecharModal('modal-treino');
    e.target.reset();
    atualizarTelasGlobais();
});

window.abrirConfig = function() {
    if (!app.state) return;
    document.getElementById('config-genero').value = app.state.atleta.genero;
    document.getElementById('config-fc-repouso').value = app.state.atleta.fcRepouso;
    document.getElementById('config-fc-max').value = app.state.atleta.fcMax;
    document.getElementById('config-pace-base').value = app._segundosParaPace(app.state.atleta.paceBaseSegundos);
    abrirModal('modal-config');
}

document.getElementById('form-config').addEventListener('submit', (e) => {
    e.preventDefault();
    app.state.atleta.genero = document.getElementById('config-genero').value;
    app.state.atleta.fcRepouso = parseInt(document.getElementById('config-fc-repouso').value);
    app.state.atleta.fcMax = parseInt(document.getElementById('config-fc-max').value);
    app.state.atleta.paceBaseSegundos = app._paceParaSegundos(document.getElementById('config-pace-base').value);
    
    app.state.logs.unshift({ data: new Date().toLocaleDateString('pt-BR'), msg: `Perfil Fisiológico atualizado. Zonas reajustadas.` });
    app.saveState();
    fecharModal('modal-config');
    atualizarTelasGlobais();
});

function resetarApp() {
    if(confirm("ATENÇÃO: Deseja destruir todo o seu histórico e recalibrar o motor?")) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

renderizarTelas();