/**
 * RUNFLOW | CORE ENGINE V4
 * - Arquitectura inmutable
 * - Internacionalización (i18n)
 * - Control de Calidad de Inputs (Validación)
 */

// ==========================================
// 1. DICCIONARIO I18N
// ==========================================
const i18n = {
    pt: {
        tituloApp: "Calibração do Motor", subtituloApp: "Insira suas métricas base para gerar o macrociclo.",
        logisticaMeta: "1. Logística e Meta", dataCorrida: "DATA DA CORRIDA", distancia: "DISTÂNCIA",
        diasSemana: "DIAS / SEMANA", dias3: "3 Dias", dias4: "4 Dias", dias5: "5 Dias",
        estadoAtual: "2. Estado Físico Atual", volumenSemanal: "VOLUMEN SEMANAL ATUAL (KM)",
        diaLongo: "DIA PREFERIDO TIRADA LONGA", domingo: "Domingo", sabado: "Sábado",
        btnCompilar: "Compilar Plano de Treinamento →", semana: "SEMANA", focusSemana: "FOCUS DA SEMANA",
        btnRegistrar: "Registrar Treino Executado", distReal: "DISTÂNCIA REAL (KM)", tempoReal: "TEMPO REAL (MIN)",
        rpe: "ESFORÇO PERCEBIDO (RPE 1-10)", btnProcessar: "Processar Carga Interna",
        navOntem: "← Ontem", navHoje: "Hoje", navAmanha: "Amanhã →", btnVerCiclo: "Ver Macrociclo Completo ⬆",
        tituloCiclo: "Macrociclo VDOT", btnExportar: "📄 Exportar Plano (PDF)", btnResetar: "Resetar Motor",
        erroValidacao: "Erro de Controle de Qualidade: Distância e Tempo devem ser maiores que zero para calcular a carga.",
        faltaDados: "Faltam dados críticos para compilação.",
        descansoTipo: "Descanso / Recuperação", descansoDetalle: "Dia livre. Se fizer atividade, cross-training Z1.",
        taperFase: "Redução drástica de volume para supercompensação.", peakFase: "Especificidade. Treinos ao ritmo alvo (VDOT).",
        buildFase: "Aumento do limiar de lactato e VO2Max.", baseFase: "Construção do motor aeróbico. Regra 80/20 em Z2."
    },
    es: {
        tituloApp: "Calibración del Motor", subtituloApp: "Ingresa tus métricas base para generar el macrociclo.",
        logisticaMeta: "1. Logística y Meta", dataCorrida: "FECHA DE LA CARRERA", distancia: "DISTANCIA",
        diasSemana: "DÍAS / SEMANA", dias3: "3 Días", dias4: "4 Días", dias5: "5 Días",
        estadoAtual: "2. Estado Físico Actual", volumenSemanal: "VOLUMEN SEMANAL ACTUAL (KM)",
        diaLongo: "DÍA PREFERIDO TIRADA LARGA", domingo: "Domingo", sabado: "Sábado",
        btnCompilar: "Compilar Plan de Entrenamiento →", semana: "SEMANA", focusSemana: "ENFOQUE SEMANAL",
        btnRegistrar: "Registrar Entrenamiento Ejecutado", distReal: "DISTANCIA REAL (KM)", tempoReal: "TIEMPO REAL (MIN)",
        rpe: "ESFUERZO PERCIBIDO (RPE 1-10)", btnProcessar: "Procesar Carga Interna",
        navOntem: "← Ayer", navHoje: "Hoy", navAmanha: "Mañana →", btnVerCiclo: "Ver Macrociclo Completo ⬆",
        tituloCiclo: "Macrociclo VDOT", btnExportar: "📄 Exportar Plan (PDF)", btnResetar: "Resetear Motor",
        erroValidacao: "Error de Control de Calidad: La distancia y el tiempo deben ser mayores a cero.",
        faltaDados: "Faltan datos críticos para la compilación.",
        descansoTipo: "Descanso / Recuperación", descansoDetalle: "Día libre. Si haces actividad, cross-training Z1.",
        taperFase: "Reducción drástica de volumen para supercompensación.", peakFase: "Especificidad. Entrenamientos a ritmo objetivo.",
        buildFase: "Aumento del umbral de lactato y VO2Max.", baseFase: "Construcción del motor aeróbico. Regla 80/20 estricta."
    },
    en: {
        tituloApp: "Engine Calibration", subtituloApp: "Enter your baseline metrics to generate the macrocycle.",
        logisticaMeta: "1. Logistics & Goal", dataCorrida: "RACE DATE", distancia: "DISTANCE",
        diasSemana: "DAYS / WEEK", dias3: "3 Days", dias4: "4 Days", dias5: "5 Days",
        estadoAtual: "2. Current Fitness", volumenSemanal: "CURRENT WEEKLY VOLUME (KM)",
        diaLongo: "PREFERRED LONG RUN DAY", domingo: "Sunday", sabado: "Saturday",
        btnCompilar: "Compile Training Plan →", semana: "WEEK", focusSemana: "WEEKLY FOCUS",
        btnRegistrar: "Log Completed Workout", distReal: "ACTUAL DISTANCE (KM)", tempoReal: "ACTUAL TIME (MIN)",
        rpe: "PERCEIVED EXERTION (RPE 1-10)", btnProcessar: "Process Internal Load",
        navOntem: "← Yesterday", navHoje: "Today", navAmanha: "Tomorrow →", btnVerCiclo: "View Full Macrocycle ⬆",
        tituloCiclo: "VDOT Macrocycle", btnExportar: "📄 Export Plan (PDF)", btnResetar: "Reset Engine",
        erroValidacao: "Quality Control Error: Distance and Time must be greater than zero to calculate load.",
        faltaDados: "Critical data missing for compilation.",
        descansoTipo: "Rest / Recovery", descansoDetalle: "Rest day. If active, Z1 cross-training only.",
        taperFase: "Drastic volume reduction for supercompensation.", peakFase: "Race specificity. VDOT target pace workouts.",
        buildFase: "Lactate threshold and VO2Max increase.", baseFase: "Aerobic engine building. Strict 80/20 in Z2."
    }
};

// ==========================================
// 2. ESTADO GLOBAL (STATE MANAGEMENT)
// ==========================================
const appState = {
    lang: 'pt',
    fechaVisualizada: new Date(),
    motorData: { meta: null, planoOriginal: [], planoVigente: [] }
};
appState.fechaVisualizada.setHours(0, 0, 0, 0);

function cambiarIdioma(lang) {
    appState.lang = lang;
    document.querySelectorAll('.lang-switcher button').forEach(btn => btn.classList.remove('lang-activa'));
    document.getElementById(`btn-lang-${lang}`).classList.add('lang-activa');
    
    // Actualizar DOM estático
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[lang][key]) {
            if (el.tagName === 'INPUT' && el.type === 'placeholder') el.placeholder = i18n[lang][key];
            else el.innerText = i18n[lang][key];
        }
    });

    if (appState.motorData.planoVigente.length > 0) renderizarVistaDiaria();
}

const formatarDataLocal = (dataObj) => {
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const dia = String(dataObj.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
};

// ==========================================
// 3. MOTOR DE CÁLCULO (MACROCICLO)
// ==========================================
function compilarPlanoDeTreinamento(fechaFinStr, diasPorSemana, distObj, volActual, diaLargo) {
    const planoGerado = [];
    const t = i18n[appState.lang]; // Referencia rápida al diccionario
    
    const partesFechaFin = fechaFinStr.split('-');
    const fechaCarrera = new Date(partesFechaFin[0], partesFechaFin[1] - 1, partesFechaFin[2]);
    fechaCarrera.setHours(0,0,0,0);

    let fechaIteradora = new Date();
    fechaIteradora.setHours(0, 0, 0, 0);

    const milisegundosPorSemana = 1000 * 3600 * 24 * 7;
    const semanasTotales = Math.max(1, Math.ceil((fechaCarrera.getTime() - fechaIteradora.getTime()) / milisegundosPorSemana));

    let volumenSemanalBase = parseFloat(volActual);
    const distancia = parseInt(distObj);
    let tiradaLargaActual = volumenSemanalBase * 0.3;

    while (fechaIteradora <= fechaCarrera) {
        const diasFaltantes = (fechaCarrera.getTime() - fechaIteradora.getTime()) / (1000 * 3600 * 24);
        const semanasFaltantes = Math.ceil(diasFaltantes / 7);
        const semanaNum = semanasTotales - semanasFaltantes + 1;

        let fase = ""; let resumenEjecutivo = "";
        
        if (semanasFaltantes <= (distancia >= 21 ? 2 : 1)) {
            fase = "Taper Phase"; resumenEjecutivo = t.taperFase;
        } else if (semanasFaltantes <= 4) {
            fase = "Peak Phase"; resumenEjecutivo = t.peakFase;
        } else if (semanasFaltantes <= semanasTotales * 0.6) {
            fase = "Build Phase"; resumenEjecutivo = t.buildFase;
        } else {
            fase = "Base Phase"; resumenEjecutivo = t.baseFase;
        }

        let isDeload = (semanaNum % 4 === 0 && fase !== "Taper Phase");
        let factorVolumen = isDeload ? 0.75 : 1.0; 
        let volSemanaActual = (volumenSemanalBase + (semanaNum * 1.5)) * factorVolumen;
        let kmTiradaLarga = (tiradaLargaActual + (semanaNum * 0.8)) * factorVolumen;

        if (fase === "Taper Phase") {
            volSemanaActual *= (distancia >= 21 && semanasFaltantes == 2) ? 0.6 : 0.4;
            kmTiradaLarga = distancia * 0.3;
        }

        const diaSemana = fechaIteradora.getDay();
        const fechaFormateada = formatarDataLocal(fechaIteradora);
        
        let entrenoDia = {
            id: fechaFormateada, fecha: fechaFormateada, semana: semanaNum, semanaTotal: semanasTotales,
            fase: fase, resumen: resumenEjecutivo,
            tipo: t.descansoTipo, metricaBase: "0", unidad: "KM", detalle: t.descansoDetalle,
            colorTema: "#95a5a6", extraHTML: "", status: "pendente", 
            dadosExecucao: { distReal: 0, tempoReal: 0, rpe: 0, cargaInterna: 0 }, flagAjuste: false
        };

        if (diaSemana == diaLargo) { 
            entrenoDia.tipo = "Long Run"; entrenoDia.metricaBase = kmTiradaLarga.toFixed(1);
            entrenoDia.colorTema = "#8e44ad"; entrenoDia.detalle = "Z2 (conversacional).";
        } else if (diaSemana === (diaLargo == 0 ? 3 : 2)) { 
            entrenoDia.tipo = "VO2 Max / Quality"; entrenoDia.metricaBase = "45"; entrenoDia.unidad = "MIN";
            entrenoDia.colorTema = "#e74c3c"; entrenoDia.detalle = "Warmup + Z4 Intervals + Cooldown.";
        } else if (diaSemana === (diaLargo == 0 ? 5 : 4) && diasPorSemana >= 3) { 
            entrenoDia.tipo = "Aerobic Z2"; entrenoDia.metricaBase = (volSemanaActual * 0.25).toFixed(1); entrenoDia.unidad = "KM";
            entrenoDia.colorTema = "#2980b9"; entrenoDia.detalle = "Engine maintenance. Keep RPE < 4/10.";
        } else if (diaSemana === (diaLargo == 0 ? 1 : 0) && diasPorSemana >= 4) { 
            entrenoDia.tipo = "Recovery + Strength"; entrenoDia.metricaBase = "30"; entrenoDia.unidad = "MIN";
            entrenoDia.colorTema = "#27ae60"; entrenoDia.detalle = "Light jog.";
            entrenoDia.extraHTML = `<strong>Strength Module:</strong><br>3x Bulgarian Split Squat (x8), RDL (x10), Plank (30s).`;
        }

        if (isDeload) entrenoDia.tipo += " [DELOAD]";

        if (fechaIteradora.getTime() === fechaCarrera.getTime()) {
            entrenoDia.tipo = `RACE DAY: ${distancia}K`; entrenoDia.metricaBase = distancia; entrenoDia.unidad = "KM";
            entrenoDia.detalle = "Execution day. Trust the process."; entrenoDia.colorTema = "#F5A623";
        }

        planoGerado.push(entrenoDia);
        fechaIteradora.setDate(fechaIteradora.getDate() + 1);
    }
    return planoGerado;
}

// ==========================================
// 4. CONTROLADORES UI Y VALIDACIÓN (QA)
// ==========================================
function inicializarApp() {
    vincularEventos();
    cambiarIdioma('pt'); // Default
    const dadosSalvos = localStorage.getItem('runflow_db');
    if (dadosSalvos) {
        appState.motorData = JSON.parse(dadosSalvos);
        alternarVistas('vista-entreno');
        renderizarVistaDiaria();
    } else { alternarVistas('vista-onboarding'); }
}

function alternarVistas(vistaId) {
    document.getElementById('vista-onboarding').classList.add('vista-oculta');
    document.getElementById('vista-entreno').classList.add('vista-oculta');
    document.getElementById(vistaId).classList.remove('vista-oculta');
}

function guardarPerfil() {
    const fecha = document.getElementById('input-fecha').value;
    const dist = document.getElementById('input-distancia').value;
    const dias = parseInt(document.getElementById('input-dias').value);
    const vol = document.getElementById('input-volumen').value;
    const diaLargo = parseInt(document.getElementById('input-dialargo').value);

    if (!fecha || vol === "") return alert(i18n[appState.lang].faltaDados);

    const arrayPlano = compilarPlanoDeTreinamento(fecha, dias, dist, vol, diaLargo);
    
    appState.motorData.meta = { dataCriacao: formatarDataLocal(new Date()), corridaAlvo: fecha };
    appState.motorData.planoOriginal = JSON.parse(JSON.stringify(arrayPlano));
    appState.motorData.planoVigente = JSON.parse(JSON.stringify(arrayPlano));

    localStorage.setItem('runflow_db', JSON.stringify(appState.motorData));
    alternarVistas('vista-entreno');
    renderizarVistaDiaria();
}

function renderizarVistaDiaria() {
    const bd = appState.motorData.planoVigente;
    const fechaStr = formatarDataLocal(appState.fechaVisualizada);
    const entreno = bd.find(e => e.id === fechaStr);

    const opcoesFecha = { weekday: 'long', day: 'numeric', month: 'short' };
    const localeMap = { pt: 'pt-BR', es: 'es-ES', en: 'en-US' };
    document.getElementById('fecha-hoy').innerText = appState.fechaVisualizada.toLocaleDateString(localeMap[appState.lang], opcoesFecha).toUpperCase();

    const domBento = document.getElementById('bento-hoy');
    const domModuloExtra = document.getElementById('modulo-extra');
    const domFeedbackPanel = document.getElementById('panel-rpe');
    const btnAbrirFeedback = document.getElementById('btn-abrir-feedback');

    if (entreno) {
        document.getElementById('semana-actual').innerText = entreno.semana;
        document.getElementById('semana-total').innerText = entreno.semanaTotal;
        document.getElementById('fase-actual').innerText = entreno.fase;
        document.getElementById('resumen-ejecutivo').innerText = entreno.resumen;
        document.getElementById('barra-progreso').style.width = `${(entreno.semana / entreno.semanaTotal) * 100}%`;

        document.getElementById('tipo-entreno').innerText = entreno.tipo;
        document.getElementById('metrica-entreno').innerHTML = `${entreno.metricaBase} <span class="unidad">${entreno.unidad}</span>`;
        
        if (entreno.flagAjuste) {
            document.getElementById('detalle-entreno').innerHTML = `<strong class="text-terracota">⚠️ DYNAMIC ADJUSTMENT:</strong> ${entreno.detalle}`;
            domBento.style.borderLeftColor = "#e74c3c";
        } else {
            document.getElementById('detalle-entreno').innerText = entreno.detalle;
            domBento.style.borderLeftColor = entreno.colorTema;
        }

        if (entreno.extraHTML) {
            domModuloExtra.classList.remove('vista-oculta'); domModuloExtra.innerHTML = entreno.extraHTML;
        } else { domModuloExtra.classList.add('vista-oculta'); }

        if (entreno.status === 'completado') {
            btnAbrirFeedback.classList.add('vista-oculta');
            domFeedbackPanel.classList.remove('vista-oculta');
            document.getElementById('input-dist-real').value = entreno.dadosExecucao.distReal;
            document.getElementById('input-dist-real').disabled = true;
            document.getElementById('input-tempo-real').value = entreno.dadosExecucao.tempoReal;
            document.getElementById('input-tempo-real').disabled = true;
            document.getElementById('input-rpe').value = entreno.dadosExecucao.rpe;
            document.getElementById('input-rpe').disabled = true;
            document.getElementById('valor-rpe').innerText = entreno.dadosExecucao.rpe;
            document.getElementById('btn-processar-feedback').classList.add('vista-oculta');
        } else {
            btnAbrirFeedback.classList.remove('vista-oculta');
            domFeedbackPanel.classList.add('vista-oculta');
            document.getElementById('input-dist-real').disabled = false; document.getElementById('input-dist-real').value = '';
            document.getElementById('input-tempo-real').disabled = false; document.getElementById('input-tempo-real').value = '';
            document.getElementById('input-rpe').disabled = false; document.getElementById('input-rpe').value = '5';
            document.getElementById('valor-rpe').innerText = '5';
            document.getElementById('btn-processar-feedback').classList.remove('vista-oculta');
        }
    } else {
        document.getElementById('tipo-entreno').innerText = "-";
        document.getElementById('detalle-entreno').innerText = "-";
        btnAbrirFeedback.classList.add('vista-oculta');
    }
    renderizarCajonPlan();
}

// Control de Calidad: Validación de Inputs antes de procesar ACWR
function processarFeedbackExecucao() {
    const fechaStr = formatarDataLocal(appState.fechaVisualizada);
    const index = appState.motorData.planoVigente.findIndex(e => e.id === fechaStr);

    if (index !== -1) {
        const distRealStr = document.getElementById('input-dist-real').value;
        const tempoRealStr = document.getElementById('input-tempo-real').value;
        const rpe = parseInt(document.getElementById('input-rpe').value);

        // Quality Control Gate
        if (!distRealStr || !tempoRealStr || parseFloat(distRealStr) <= 0 || parseInt(tempoRealStr) <= 0) {
            alert(i18n[appState.lang].erroValidacao);
            return; // Bloquea el guardado si falla la validación
        }

        const distReal = parseFloat(distRealStr);
        const tempoReal = parseInt(tempoRealStr);
        const cargaInterna = rpe * tempoReal; 

        appState.motorData.planoVigente[index].status = 'completado';
        appState.motorData.planoVigente[index].dadosExecucao = { distReal, tempoReal, rpe, cargaInterna };

        if (rpe >= 8 && tempoReal > 45) {
            for (let i = index + 1; i < index + 5 && i < appState.motorData.planoVigente.length; i++) {
                let proxTreino = appState.motorData.planoVigente[i];
                if (proxTreino.tipo.includes("VO2") || proxTreino.tipo.includes("Quality")) {
                    proxTreino.flagAjuste = true;
                    proxTreino.tipo = "Recovery Run (Substituted)";
                    proxTreino.detalle = "Fatigue Flag: High load detected. Intensity reduced to protect structural engine.";
                    proxTreino.colorTema = "#2980b9";
                    break; 
                }
            }
            alert("⚠️ High fatigue detected. Next quality session adjusted.");
        }

        localStorage.setItem('runflow_db', JSON.stringify(appState.motorData));
        renderizarVistaDiaria();
    }
}

// ==========================================
// 5. RENDER PDF Y EVENTOS
// ==========================================
function renderizarCajonPlan() {
    const contenedor = document.getElementById('contenedor-lista-plan');
    contenedor.innerHTML = '';
    
    appState.motorData.planoVigente.forEach(entreno => {
        const item = document.createElement('div');
        item.className = 'item-lista-pdf';
        
        let colorStatus = entreno.status === 'completado' ? 'var(--acento-sucesso)' : 'var(--texto-secundario)';
        let labelStatus = entreno.status === 'completado' ? `✔ ${entreno.dadosExecucao.distReal}km` : `${entreno.metricaBase} ${entreno.unidad}`;
            
        if (entreno.tipo.includes("Rest") || entreno.tipo.includes("Descanso")) {
            labelStatus = entreno.status === 'completado' ? labelStatus : "Rest";
        }
        
        item.innerHTML = `
            <div style="flex: 1; padding-right: 15px;">
                <strong>${entreno.fecha}</strong> <span class="badge-fase" style="font-size:0.6rem;">${entreno.fase.split(' ')[0]}</span><br>
                <span style="font-size: 0.9rem; font-weight: 600; color: ${entreno.flagAjuste ? 'var(--acento-perigo)' : 'inherit'};">${entreno.tipo}</span><br>
                <span style="font-size: 0.75rem; color: var(--texto-secundario); display: block; margin-top: 4px;">${entreno.detalle}</span>
            </div>
            <div style="font-weight: 700; color: ${colorStatus}; white-space: nowrap;">${labelStatus}</div>
        `;
        contenedor.appendChild(item);
    });
}

function exportarPDF() {
    const element = document.getElementById('contenedor-lista-plan');
    const contenedorPDF = document.createElement('div');
    contenedorPDF.style.padding = '30px'; contenedorPDF.style.backgroundColor = '#FFFFFF';
    contenedorPDF.style.color = '#2D2D2D'; contenedorPDF.style.fontFamily = 'sans-serif';
    
    const header = document.createElement('div');
    header.innerHTML = `<h2 style="margin-bottom: 5px; color: #C05746;">RunFlow Macrocycle</h2>
        <p style="margin-bottom: 25px; color: #7A7A7A; font-size: 0.9rem;">Target: ${appState.motorData.meta.corridaAlvo} | Generated: ${appState.motorData.meta.dataCriacao}</p>`;
    
    contenedorPDF.appendChild(header); contenedorPDF.appendChild(element.cloneNode(true));

    const opt = { margin: 10, filename: 'RunFlow_Plan.pdf', image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    html2pdf().set(opt).from(contenedorPDF).save();
}

function vincularEventos() {
    document.getElementById('btn-gerar-plano').addEventListener('click', guardarPerfil);
    document.getElementById('btn-nav-ayer').addEventListener('click', () => { appState.fechaVisualizada.setDate(appState.fechaVisualizada.getDate() - 1); renderizarVistaDiaria(); });
    document.getElementById('btn-nav-hoy').addEventListener('click', () => { appState.fechaVisualizada = new Date(); appState.fechaVisualizada.setHours(0,0,0,0); renderizarVistaDiaria(); });
    document.getElementById('btn-nav-manana').addEventListener('click', () => { appState.fechaVisualizada.setDate(appState.fechaVisualizada.getDate() + 1); renderizarVistaDiaria(); });
    
    document.getElementById('btn-abrir-feedback').addEventListener('click', () => {
        document.getElementById('btn-abrir-feedback').classList.add('vista-oculta');
        document.getElementById('panel-rpe').classList.remove('vista-oculta');
    });
    
    document.getElementById('input-rpe').addEventListener('input', (e) => { document.getElementById('valor-rpe').innerText = e.target.value; });
    document.getElementById('btn-processar-feedback').addEventListener('click', processarFeedbackExecucao);
    
    const toggleCajon = () => document.getElementById('cajon-historial').classList.toggle('cajon-abierto');
    document.getElementById('btn-toggle-cajon').addEventListener('click', toggleCajon);
    document.getElementById('btn-cerrar-cajon').addEventListener('click', toggleCajon);
    
    document.getElementById('btn-exportar-pdf').addEventListener('click', exportarPDF);
    document.getElementById('btn-reset-motor').addEventListener('click', () => {
        if(confirm(i18n[appState.lang].btnResetar + "?")) {
            localStorage.removeItem('runflow_db');
            appState.motorData = { meta: null, planoOriginal: [], planoVigente: [] };
            appState.fechaVisualizada = new Date(); appState.fechaVisualizada.setHours(0,0,0,0);
            toggleCajon(); alternarVistas('vista-onboarding');
        }
    });
}

document.addEventListener('DOMContentLoaded', inicializarApp);