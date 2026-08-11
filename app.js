const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;

function applyTheme(themeName) {
    body.setAttribute('data-theme', themeName);
    localStorage.setItem('stridia_theme', themeName);
}
const savedTheme = localStorage.getItem('stridia_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(savedTheme);

themeToggleBtn.addEventListener('click', () => {
    applyTheme(body.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
});

const STORAGE_KEY = 'stridia_app_v2';

class RunningCoach {
    constructor() { 
        this.state = this.loadState(); 
        if (this.state) {
            this.recalcularLinhaDoTempo();
        }
    }

    loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error("Erro ao ler LocalStorage", e);
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

        const tempoSemanalHoras = (volSemanal * (paceAtualSegundos / 60)) / 60;
        const tssSemanal = tempoSemanalHoras * Math.pow(0.75, 2) * 100;
        const ctlInicial = tssSemanal / 7; 

        let dias = dadosForm.diasSelecionados;
        dias.sort((a,b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)); 
        
        const dayLongao = dias[dias.length - 1]; 
        let dayTempo = dias[0]; 
        if(dias.length >= 3) {
            dayTempo = dias[Math.floor((dias.length - 1) / 2)];
        }
        
        const diasRegen = dias.filter(d => d !== dayLongao && d !== dayTempo);
        const dataHojeISO = new Date().toISOString().split('T')[0];

        this.state = {
            atleta: {
                nome: dadosForm.nome, idade: dadosForm.idade, genero: dadosForm.genero,
                fcMax: fcMaxCalc, fcRepouso: dadosForm.fcRepouso, 
                paceBaseSegundos: paceAtualSegundos, 
                distanciaAtualMax: distAtualSegura,
                volumeSemanalBase: volSemanal, 
                dataInicioISO: dataHojeISO,
                ctlInicial: ctlInicial,
                ctl: ctlInicial, atl: ctlInicial * 1.2, tsb: ctlInicial - (ctlInicial * 1.2),
                multiplicadorVolume: 1.0, 
                historicoCTL: [],
                ultimaAtualizacaoISO: dataHojeISO,
                diasTreino: { longao: dayLongao, tempo: dayTempo, regen: diasRegen }
            },
            prova: { distancia: dadosForm.distAlvo, dataStr: dadosForm.dataAlvo },
            plano: [], treinosRealizados: [], logs: []
        };

        this.state.logs.push({ data: new Date().toLocaleDateString('pt-BR'), msg: `Configuração concluída. Fisiologia e baseline de carga adaptadas usando Volume Semanal.` });
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
        let maxLongao = this.state.prova.distancia * 0.9;
        if (this.state.prova.distancia >= 42.2) maxLongao = 34; 

        for (let i = 0; i <= diasTotais; i++) {
            let dataTreino = new Date(dataInicio);
            dataTreino.setDate(dataInicio.getDate() + i);
            const diaSemana = dataTreino.getDay() === 0 ? 7 : dataTreino.getDay();
            const diaSemanaNormal = dataTreino.getDay();
            
            const semanasParaProva = Math.ceil((diasTotais - i) / 7);
            const numeroSemanaAtual = Math.floor(i / 7);
            const ehDeload = (numeroSemanaAtual % 4 === 3);

            let fatorEvolucao = Math.pow(1.05, numeroSemanaAtual);
            let volSemanalAtual = Math.min(volSemanalBase * fatorEvolucao, capSemanalAbsoluto);

            if (ehDeload) volSemanalAtual *= 0.75;
            if (semanasParaProva === 2) volSemanalAtual *= 0.6;
            if (semanasParaProva === 1) volSemanalAtual *= 0.4;

            let tipo = "Descanso", distancia = 0, prescricao = "";

            if (i === diasTotais) {
                tipo = "PROVA ALVO"; distancia = this.state.prova.distancia; prescricao = "O trabalho está feito. Confie no polimento e execute.";
            } else if ((diaSemanaNormal === longao || diaSemana === longao) && i !== diasTotais) { 
                tipo = "Longão";
                distancia = Math.min(volSemanalAtual * 0.45, maxLongao); 
                
                if (semanasParaProva <= 2) {
                    prescricao = "Tapering (Polimento). Redução drástica para supercompensação (pico de TSB).";
                } else if (ehDeload) {
                    prescricao = "Semana Regenerativa (Deload). Absorção sistêmica de carga acumulada.";
                } else {
                    prescricao = "Construção aeróbica (LISS). Segure o ritmo na Z2 rígida.";
                }
            } else if (diaSemanaNormal === tempo || diaSemana === tempo) { 
                tipo = "Tempo Run"; 
                distancia = Math.max(4, volSemanalAtual * 0.20); 
                prescricao = "Limiar de Lactato. Desconforto controlado e sustentável na Z3-Z4.";
            } else if (regen.includes(diaSemanaNormal) || regen.includes(diaSemana)) { 
                tipo = "Regenerativo"; 
                distancia = Math.max(3, (volSemanalAtual * 0.35) / numRegen); 
                prescricao = "Active Recovery puro. Z1, flushing do ácido lático sem gerar estresse celular.";
            }

            this.state.plano.push({
                id: idCounter++, dataISO: dataTreino.toISOString().split('T')[0],
                tipo: tipo, distanciaBase: parseFloat(distancia.toFixed(1)), 
                prescricao: prescricao, concluido: false
            });
        }
    }

    _segundosParaPace(seg) {
        const m = Math.floor(seg / 60); const s = Math.round(seg % 60); return `${m}:${s < 10 ? '0' : ''}${s}/km`;
    }

    obterZonasDinamicas() {
        const base = this.state.atleta.paceBaseSegundos;
        return {
            "Regenerativo": { pace: this._segundosParaPace(base * 1.30), fc: "Z1-Z2 (Mto Leve)" },
            "Longão": { pace: this._segundosParaPace(base * 1.15), fc: "Z2 (Leve)" },
            "Tempo Run": { pace: this._segundosParaPace(base * 0.98), fc: "Z3-Z4 (Forte)" },
            "PROVA ALVO": { pace: this._segundosParaPace(base * 1.02), fc: "Z4-Máx" }
        };
    }

    obterTenisSugerido(tipoTreino) {
        switch (tipoTreino) {
            case "Longão":
            case "PROVA ALVO":
                return "ASICS Novablast 6 (Máximo amortecimento e conforto)";
            case "Tempo Run":
                return "On Cloudsurfer Next (Rocker ágil e maior firmeza no limiar)";
            case "Regenerativo":
                return "On Cloudsurfer Next ou Novablast 6 (Escolha do atleta)";
            default:
                return "Opção à sua escolha";
        }
    }

    processarTreino(treinoId, distReal, tempoMin, fcMedia, rpe) {
        const treino = this.state.plano.find(t => t.id === parseInt(treinoId));
        if(!treino) return;

        treino.concluido = true;
        treino.resultado = { dist: distReal, tempo: tempoMin, fc: fcMedia, rpe: rpe };

        let logMsg = `[${treino.tipo}] ${distReal}km concluídos em ${tempoMin}min. `;

        if (!isNaN(fcMedia) && fcMedia > this.state.atleta.fcMax) {
            this.state.atleta.fcMax = fcMedia;
            logMsg += `PICO DETECTADO: Nova FC Máxima (${fcMedia} bpm). `;
        }

        let tss = 0;
        if (!isNaN(fcMedia) && fcMedia > 0) {
            const hrr = this.state.atleta.fcMax - this.state.atleta.fcRepouso;
            const hrRatio = Math.max(0.1, Math.min(1, (fcMedia - this.state.atleta.fcRepouso) / hrr));
            const ifFactor = hrRatio / 0.85; 
            tss = (tempoMin / 60) * Math.pow(ifFactor, 2) * 100;
        } else {
            const ifFactor = Math.max(0.4, rpe / 7.5);
            tss = (tempoMin / 60) * Math.pow(ifFactor, 2) * 100;
            logMsg += `(Usado sRPE ${rpe}/10). `;
        }
        
        tss = Math.round(tss);
        logMsg += `Carga gerada (TSS): ${tss}.`;

        this.state.treinosRealizados.push({
            idReferencia: treino.id,
            dataISO: treino.dataISO,
            tss: tss,
            dist: distReal
        });

        this.recalcularLinhaDoTempo();

        const acwr = this.state.atleta.ctl > 0 ? (this.state.atleta.atl / this.state.atleta.ctl) : 0;
        
        if (acwr > 1.5 && this.state.atleta.multiplicadorVolume > 0.8) {
            logMsg += ` 🚨 ALERTA: Zona de perigo de lesão (ACWR > 1.5). Reduzindo provisoriamente o volume base em 15% para preservação.`;
            this.state.atleta.multiplicadorVolume *= 0.85; 
        } else if (acwr < 1.3 && this.state.atleta.multiplicadorVolume < 1.0) {
            this.state.atleta.multiplicadorVolume = 1.0;
        }

        this.state.logs.unshift({ data: new Date().toLocaleDateString('pt-BR'), msg: logMsg });
        this.saveState();
    }
    
    getDistanciaSugerida(treinoBase) {
        if (treinoBase.tipo === "Descanso" || treinoBase.tipo === "PROVA ALVO") return treinoBase.distanciaBase;
        return parseFloat((treinoBase.distanciaBase * this.state.atleta.multiplicadorVolume).toFixed(1));
    }
}

const app = new RunningCoach();

function formatarDataHoje() {
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const d = new Date(); return `${dias[d.getDay()]}, ${d.getDate()} ${meses[d.getMonth()]}`;
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
}

function atualizarTelasGlobais() {
    const hojeISO = new Date().toISOString().split('T')[0];
    const treinoHoje = app.state.plano.find(t => t.dataISO === hojeISO);
    const zonas = app.obterZonasDinamicas();
    const uiHoje = document.getElementById('ui-hoje');
    
    if (!treinoHoje) {
        uiHoje.innerHTML = `<div class="today-date">${formatarDataHoje()}</div><h2 class="today-type">Ciclo Concluído</h2><p class="today-desc">Sua jornada de treinos chegou ao fim.</p>`;
    } else if (treinoHoje.concluido) {
        uiHoje.innerHTML = `<div class="today-date">${formatarDataHoje()}</div><h2 class="today-type">${treinoHoje.tipo}</h2><div class="today-done"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div><p class="today-desc">Sessão finalizada. Foco na recuperação e síntese proteica.</p>`;
    } else if (treinoHoje.tipo === "Descanso") {
        uiHoje.innerHTML = `<div class="today-date">${formatarDataHoje()}</div><h2 class="today-type">Recovery</h2><div class="today-rest"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></div><p class="today-desc">O ganho de performance ocorre durante o repouso. Mantenha a disciplina.</p>`;
    } else {
        const paceAlvo = zonas[treinoHoje.tipo]?.pace || '-';
        const fcAlvo = zonas[treinoHoje.tipo]?.fc || '-';
        const distCalculada = app.getDistanciaSugerida(treinoHoje);
        const tenisRecomendado = app.obterTenisSugerido(treinoHoje.tipo);
        
        uiHoje.innerHTML = `
            <div class="today-date">${formatarDataHoje()}</div>
            <h2 class="today-type">${treinoHoje.tipo}</h2>
            <div class="today-distance">${distCalculada}<span>km</span></div>
            <div class="today-metrics">
                <div class="today-metrics-card"><div>Pace Target</div><strong>${paceAlvo}</strong></div>
                <div class="today-metrics-card"><div>Zona FC</div><strong>${fcAlvo}</strong></div>
            </div>
            <div style="margin-bottom: 20px; font-size: 0.82rem; color: var(--brand-accent); font-weight: 700;">
                👟 Tênis Recomendado: <span style="color: var(--text-primary); font-weight: 600;">${tenisRecomendado}</span>
            </div>
            <p class="today-desc">"${treinoHoje.prescricao}"</p>
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
    acwrEl.classList.remove('positive', 'negative', 'danger');
    
    let acwrLabel = "";
    if (acwr < 0.8) { acwrEl.classList.add('negative'); acwrLabel = "Sub-carga"; }
    else if (acwr <= 1.3) { acwrEl.classList.add('positive'); acwrLabel = "Seguro"; }
    else if (acwr <= 1.5) { acwrEl.classList.add('negative'); acwrLabel = "Atenção"; }
    else { acwrEl.classList.add('danger'); acwrLabel = "Perigo"; }
    document.getElementById('label-acwr').innerText = acwrLabel;

    const tsb = Math.round(app.state.atleta.tsb);
    const tsbEl = document.getElementById('val-tsb');
    tsbEl.innerText = tsb > 0 ? `+${tsb}` : tsb;
    tsbEl.classList.remove('positive', 'negative', 'danger');
    if (tsb >= -15 && tsb <= 10) tsbEl.classList.add('positive'); 
    else if (tsb < -25) tsbEl.classList.add('danger'); 
    else tsbEl.classList.add('negative'); 

    const feed = document.getElementById('feed-relatorios');
    feed.innerHTML = app.state.logs.length === 0 ? '<p style="color: var(--text-tertiary); font-size: 0.85rem;">Aguardando os primeiros dados (TSS)...</p>' 
        : app.state.logs.slice(0, 15).map(log => `<div class="log-entry"><span class="log-date">${log.data}</span>${log.msg}</div>`).join('');

    const uiCalendario = document.getElementById('ui-calendario');
    uiCalendario.innerHTML = '';
    app.state.plano.filter(t => t.dataISO >= hojeISO).slice(0, 7).forEach(treino => {
        const ehHoje = treino.dataISO === hojeISO;
        const ehDescanso = treino.tipo === "Descanso";
        const [y, m, d] = treino.dataISO.split('-'); 
        const distCalculada = app.getDistanciaSugerida(treino);
        const tenisRecomendado = app.obterTenisSugerido(treino.tipo);
        
        let html = `<div class="day-card ${ehHoje ? 'today' : ''} ${treino.concluido ? 'done' : ''}">
            <div class="day-info">
                <div class="day-date">${ehHoje ? 'HOJE' : `${d}/${m}`}</div>
                <div class="day-title">${treino.tipo} ${!ehDescanso ? `• ${distCalculada}km` : ''}</div>
                ${!ehDescanso ? `<div class="day-details">Pace: ${zonas[treino.tipo]?.pace || '-'} | 👟 ${tenisRecomendado.split(' (')[0]}</div>` : `<div class="day-details">Recuperação celular.</div>`}
            </div>`;
        if (treino.concluido) html += `<div><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>`;
        html += `</div>`;
        uiCalendario.innerHTML += html;
    });
}

window.abrirPlanoCompleto = function() {
    if(!app.state || !app.state.plano) return;
    const container = document.getElementById('container-plano-completo');
    const zonas = app.obterZonasDinamicas();
    container.innerHTML = '';

    let semanaAtualNum = 1;
    let htmlSemana = `<div class="week-group"><div class="week-header"><span>Semana ${semanaAtualNum}</span></div>`;

    app.state.plano.forEach((treino, index) => {
        const [y, m, d] = treino.dataISO.split('-');
        const ehDescanso = treino.tipo === "Descanso";
        const distCalculada = app.getDistanciaSugerida(treino);
        const tenisRecomendado = app.obterTenisSugerido(treino.tipo);

        if (index > 0 && index % 7 === 0) {
            semanaAtualNum++;
            htmlSemana += `</div><div class="week-group"><div class="week-header"><span>Semana ${semanaAtualNum} ${semanaAtualNum % 4 === 0 ? '(DELOAD)' : ''}</span></div>`;
        }

        htmlSemana += `
            <div class="day-card ${treino.concluido ? 'done' : ''}" style="margin-bottom:6px; padding:12px 14px;">
                <div class="day-info">
                    <div class="day-date">${d}/${m}</div>
                    <div class="day-title" style="font-size: 0.9rem;">${treino.tipo} ${!ehDescanso ? `• ${distCalculada}km` : ''}</div>
                    ${!ehDescanso ? `<div class="day-details" style="font-size:0.75rem;">Pace: ${zonas[treino.tipo]?.pace || '-'} | 👟 ${tenisRecomendado.split(' (')[0]}</div>` : ''}
                </div>
                ${treino.concluido ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
            </div>
        `;
    });

    htmlSemana += `</div>`;
    container.innerHTML = htmlSemana;
    abrirModal('modal-plano');
}

document.getElementById('form-setup').addEventListener('submit', (e) => {
    e.preventDefault();
    const checkboxes = document.querySelectorAll('input[name="setup-dias"]:checked');
    const diasSelecionados = Array.from(checkboxes).map(el => parseInt(el.value));
    
    if (diasSelecionados.length < 2) {
        alert("Selecione pelo menos 2 dias para intercalar intensidade e volume.");
        return;
    }

    app.initSetup({
        nome: document.getElementById('setup-nome').value, 
        idade: parseInt(document.getElementById('setup-idade').value),
        genero: document.getElementById('setup-genero').value,
        diasSelecionados: diasSelecionados,
        distAlvo: parseFloat(document.getElementById('setup-dist-alvo').value),
        dataAlvo: document.getElementById('setup-data-alvo').value, 
        distAtual: parseFloat(document.getElementById('setup-dist-atual').value),
        tempoAtual: parseInt(document.getElementById('setup-tempo-atual').value), 
        volSemanal: parseFloat(document.getElementById('setup-vol-semanal').value),
        fcRepouso: parseInt(document.getElementById('setup-fc-repouso').value),
        fcMax: document.getElementById('setup-fc-max').value
    });
    renderizarTelas();
});

window.abrirModal = function(idModal) { document.getElementById(idModal).classList.add('active'); }
window.fecharModal = function(idModal) { document.getElementById(idModal).classList.remove('active'); }
window.fecharModaisFora = function(event, idModal) { if (event.target === document.getElementById(idModal)) fecharModal(idModal); }

window.abrirTreino = function(id, tipo, distCalculada) {
    abrirModal('modal-treino');
    document.getElementById('treino-id').value = id; 
    document.getElementById('input-tipo').value = tipo; 
    document.getElementById('input-dist').value = distCalculada;
    document.getElementById('input-tempo').value = ''; 
    document.getElementById('input-fc').value = ''; 
    document.getElementById('input-rpe').value = '6';
}

document.getElementById('form-treino').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('treino-id').value;
    const dist = parseFloat(document.getElementById('input-dist').value);
    const tempo = parseInt(document.getElementById('input-tempo').value);
    const fc = parseInt(document.getElementById('input-fc').value);
    const rpe = parseInt(document.getElementById('input-rpe').value);

    app.processarTreino(id, dist, tempo, fc, rpe);
    fecharModal('modal-treino');
    e.target.reset();
    atualizarTelasGlobais();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.abrirConfig = function() {
    if (!app.state) return;
    document.getElementById('config-genero').value = app.state.atleta.genero;
    document.getElementById('config-fc-repouso').value = app.state.atleta.fcRepouso;
    document.getElementById('config-fc-max').value = app.state.atleta.fcMax;
    document.getElementById('config-pace-base').value = app.state.atleta.paceBaseSegundos;
    abrirModal('modal-config');
}

document.getElementById('form-config').addEventListener('submit', (e) => {
    e.preventDefault();
    app.state.atleta.genero = document.getElementById('config-genero').value;
    app.state.atleta.fcRepouso = parseInt(document.getElementById('config-fc-repouso').value);
    app.state.atleta.fcMax = parseInt(document.getElementById('config-fc-max').value);
    app.state.atleta.paceBaseSegundos = parseInt(document.getElementById('config-pace-base').value);
    
    app.state.logs.unshift({ data: new Date().toLocaleDateString('pt-BR'), msg: `⚙️ Perfil fisiológico atualizado. Zonas reajustadas.` });
    app.saveState(); fecharModal('modal-config'); atualizarTelasGlobais();
});

function resetarApp() {
    if(confirm("ATENÇÃO: Deseja destruir todo o seu histórico e recalibrar o motor do zero?")) { 
        localStorage.removeItem(STORAGE_KEY); location.reload(); 
    }
}

renderizarTelas();