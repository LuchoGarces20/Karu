let fechaVisualizada = new Date();
fechaVisualizada.setHours(0, 0, 0, 0);

// ==========================================
// 1. MOTOR DE CÁLCULO (MACROCICLO)
// ==========================================
function generarPlanDeEntrenamiento(fechaFinStr, diasPorSemana, distObj, volActual, diaLargo) {
    const plan = [];
    let fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);
    const fechaCarrera = new Date(fechaFinStr + 'T00:00:00');

    const milisegundosPorSemana = 1000 * 3600 * 24 * 7;
    const semanasTotales = Math.max(1, Math.ceil((fechaCarrera.getTime() - fechaActual.getTime()) / milisegundosPorSemana));

    // Variables de Estado Inicial
    let volumenSemanalBase = parseFloat(volActual);
    const distancia = parseInt(distObj);
    let tiradaLargaActual = volumenSemanalBase * 0.3; // 30% del volumen inicial

    while (fechaActual <= fechaCarrera) {
        const diasFaltantes = (fechaCarrera.getTime() - fechaActual.getTime()) / (1000 * 3600 * 24);
        const semanasFaltantes = Math.ceil(diasFaltantes / 7);
        const semanaNum = semanasTotales - semanasFaltantes + 1;

        // A. DETERMINAR FASE DEL MACROCICLO
        let fase = "";
        let resumenEjecutivo = "";
        
        if (semanasFaltantes <= (distancia >= 21 ? 2 : 1)) {
            fase = "Taper Phase";
            resumenEjecutivo = "Reducción drástica de volumen para supercompensación. Mantén la intensidad pero acorta las sesiones. Llegarás fresco a la línea de salida.";
        } else if (semanasFaltantes <= 4) {
            fase = "Peak Phase";
            resumenEjecutivo = "Especificidad de carrera. Entrenamientos orientados al ritmo objetivo (VDOT). Alta exigencia neuromuscular.";
        } else if (semanasFaltantes <= semanasTotales * 0.6) {
            fase = "Build Phase";
            resumenEjecutivo = "Introducción de sesiones de calidad Z3/Z4. Aumento del umbral de lactato y VO2Max manteniendo la base aeróbica.";
        } else {
            fase = "Base Phase";
            resumenEjecutivo = "Construcción del motor aeróbico. Regla 80/20 estricta. Volumen en Z2 para adaptación mitocondrial y fuerza estructural.";
        }

        // B. REGLAS DE SOBRECARGA Y DELOAD (Progresión Segura)
        let isDeload = (semanaNum % 4 === 0 && fase !== "Taper Phase");
        let factorVolumen = isDeload ? 0.75 : 1.0; // Corta 25% en semana de descarga
        
        // Aumenta 5-10% semanal (simplificado a un cálculo lineal sobre la base)
        let volSemanaActual = (volumenSemanalBase + (semanaNum * 1.5)) * factorVolumen;
        let kmTiradaLarga = (tiradaLargaActual + (semanaNum * 0.8)) * factorVolumen;

        if (fase === "Taper Phase") {
            volSemanaActual *= (distancia >= 21 && semanasFaltantes == 2) ? 0.6 : 0.4;
            kmTiradaLarga = distancia * 0.3;
        }

        // C. MICRO-CICLO DIARIO
        const diaSemana = fechaActual.getDay();
        const fechaFormateada = fechaActual.toISOString().split('T')[0];
        
        let entrenoDia = {
            fecha: fechaFormateada, semana: semanaNum, semanaTotal: semanasTotales,
            fase: fase, resumen: resumenEjecutivo,
            tipo: "Descanso / Recuperación", metrica: "0", unidad: "KM",
            detalle: "Día libre. Adaptación celular en proceso. Si haces actividad, que sea cross-training sin impacto (Z1).",
            colorTema: "#95a5a6", extraHTML: "", completado: false, rpe: 0, sueno: 0, dolor: 0, flag: false
        };

        // Lógica de Asignación de Días
        if (diaSemana == diaLargo) { 
            entrenoDia.tipo = "Tirada Larga (Long Run)";
            entrenoDia.metrica = kmTiradaLarga.toFixed(1);
            entrenoDia.colorTema = "#8e44ad";
            entrenoDia.detalle = fase === "Peak Phase" ? `Primer 70% en Z2, último 30% a ritmo de carrera (${distancia}K).` : `Estrictamente Z2 (conversacional). Representa el 30% de tu volumen semanal.`;
            if (kmTiradaLarga > 12) {
                entrenoDia.extraHTML = `<strong>Nutrición Intra-entreno:</strong> Consumir 30-45g de carbohidratos cada 45 min. Hidratación constante.`;
            }
        } 
        else if (diaSemana === (diaLargo == 0 ? 3 : 2)) { // Calidad 1 (Separado de la tirada larga)
            entrenoDia.tipo = fase === "Base Phase" ? "Rodaje Base + Rectas" : "VO2 Max / Intervalos";
            entrenoDia.metrica = "40-50"; entrenoDia.unidad = "MIN";
            entrenoDia.colorTema = "#e74c3c";
            entrenoDia.detalle = fase === "Base Phase" 
                ? "40 min Z2 + 6x100m progresivos al final para reclutamiento de fibras rápidas."
                : "Calentamiento 15m + 5x1000m en Z4 (Rec: 2m trote) + Enfriamiento 10m. Foco en mecánica de carrera bajo fatiga.";
        }
        else if (diaSemana === (diaLargo == 0 ? 5 : 4) && diasPorSemana >= 3) { // Base
            entrenoDia.tipo = "Rodaje Aeróbico (Z2)";
            entrenoDia.metrica = (volSemanaActual * 0.25).toFixed(1); entrenoDia.unidad = "KM";
            entrenoDia.colorTema = "#2980b9";
            entrenoDia.detalle = "Mantenimiento del motor aeróbico. Si el RPE es mayor a 4/10, reduce el ritmo inmediatamente.";
        }
        else if (diaSemana === (diaLargo == 0 ? 1 : 0) && diasPorSemana >= 4) { // Recuperación + Fuerza
            entrenoDia.tipo = "Recuperación Activa + Fuerza";
            entrenoDia.metrica = "30"; entrenoDia.unidad = "MIN";
            entrenoDia.colorTema = "#27ae60";
            entrenoDia.detalle = "Trote muy suave o bicicleta estática.";
            entrenoDia.extraHTML = `<strong>Strength Module (Adaptación Anatómica):</strong><br>3 series de: Sentadilla Búlgara (x8/pierna), Peso Muerto Rumano (x10), Plancha Copenhague (30s).`;
        }

        if (isDeload) entrenoDia.tipo += " [SEMANA DELOAD]";

        if (fechaActual.getTime() === fechaCarrera.getTime()) {
            entrenoDia.tipo = `RACE DAY: ${distancia}K`;
            entrenoDia.metrica = distancia; entrenoDia.unidad = "KM";
            entrenoDia.detalle = "Día de ejecución. Calienta bien, sigue tu estrategia de VDOT y confía en el proceso.";
            entrenoDia.colorTema = "#F5A623";
            entrenoDia.extraHTML = "";
        }

        plan.push(entrenoDia);
        fechaActual.setDate(fechaActual.getDate() + 1);
    }
    return plan;
}

// ==========================================
// 2. UI Y LÓGICA DE EVENTOS
// ==========================================
function guardarPerfil() {
    const fecha = document.getElementById('input-fecha').value;
    const dist = document.getElementById('input-distancia').value;
    const dias = parseInt(document.getElementById('input-dias').value);
    const vol = document.getElementById('input-volumen').value;
    const diaLargo = parseInt(document.getElementById('input-dialargo').value);

    if (!fecha || vol === "") return alert("Faltan datos críticos para el cálculo.");

    const planGenerado = generarPlanDeEntrenamiento(fecha, dias, dist, vol, diaLargo);
    localStorage.setItem('planCorredorV2', JSON.stringify(planGenerado));
    verificarUsuario();
}

function verificarUsuario() {
    const datos = localStorage.getItem('planCorredorV2');
    if (datos) {
        document.getElementById('vista-onboarding').classList.replace('vista-activa', 'vista-oculta');
        document.getElementById('vista-entreno').classList.replace('vista-oculta', 'vista-activa');
        mostrarEntrenamiento();
    } else {
        document.getElementById('vista-onboarding').classList.replace('vista-oculta', 'vista-activa');
        document.getElementById('vista-entreno').classList.replace('vista-activa', 'vista-oculta');
    }
}

function mostrarEntrenamiento() {
    const baseDeDatos = JSON.parse(localStorage.getItem('planCorredorV2'));
    if (!baseDeDatos) return;

    const fechaStr = fechaVisualizada.toISOString().split('T')[0];
    const entreno = baseDeDatos.find(e => e.fecha === fechaStr);

    const opciones = { weekday: 'long', day: 'numeric', month: 'short' };
    document.getElementById('fecha-hoy').innerText = fechaVisualizada.toLocaleDateString('es-ES', opciones).toUpperCase();

    const bentoHoy = document.getElementById('bento-hoy');
    const moduloExtra = document.getElementById('modulo-extra');
    const seccionFeedback = document.getElementById('seccion-feedback');
    const panelRpe = document.getElementById('panel-rpe');
    const btnCompletar = document.getElementById('btn-completar');

    if (entreno) {
        document.getElementById('semana-actual').innerText = entreno.semana;
        document.getElementById('semana-total').innerText = entreno.semanaTotal;
        document.getElementById('fase-actual').innerText = entreno.fase;
        document.getElementById('resumen-ejecutivo').innerText = entreno.resumen;
        document.querySelector('.barra-llena').style.width = `${(entreno.semana / entreno.semanaTotal) * 100}%`;

        document.getElementById('tipo-entreno').innerText = entreno.tipo;
        document.getElementById('metrica-entreno').innerHTML = `${entreno.metrica} <span class="unidad">${entreno.unidad}</span>`;
        
        // Dynamic Adjustment Feedback Alert
        if (entreno.flag) {
            document.getElementById('detalle-entreno').innerHTML = `<strong>⚠️ AJUSTE DINÁMICO APLICADO:</strong> ${entreno.detalle}`;
            bentoHoy.style.borderLeftColor = "#e74c3c";
        } else {
            document.getElementById('detalle-entreno').innerText = entreno.detalle;
            bentoHoy.style.borderLeftColor = entreno.colorTema;
        }

        if (entreno.extraHTML) {
            moduloExtra.style.display = 'block';
            moduloExtra.innerHTML = entreno.extraHTML;
        } else {
            moduloExtra.style.display = 'none';
        }

        if (entreno.completado) {
            btnCompletar.style.display = 'none';
            panelRpe.style.display = 'block';
            document.getElementById('input-rpe').value = entreno.rpe;
            document.getElementById('valor-rpe').innerText = entreno.rpe;
            document.getElementById('input-sueno').value = entreno.sueno;
            document.getElementById('valor-sueno').innerText = entreno.sueno;
            document.getElementById('input-dolor').value = entreno.dolor;
            document.getElementById('valor-dolor').innerText = entreno.dolor;
        } else {
            btnCompletar.style.display = 'block';
            panelRpe.style.display = 'none';
        }
    }
    renderizarCajon(baseDeDatos);
}

function cambiarDia(offset) { fechaVisualizada.setDate(fechaVisualizada.getDate() + offset); mostrarEntrenamiento(); }
function irAHoy() { fechaVisualizada = new Date(); fechaVisualizada.setHours(0, 0, 0, 0); mostrarEntrenamiento(); }
function abrirFeedback() { document.getElementById('btn-completar').style.display = 'none'; document.getElementById('panel-rpe').style.display = 'block'; }
function actualizarDisplay(id, valor) { document.getElementById(id).innerText = valor; }

// ==========================================
// 3. PROTOCOLO DE AJUSTE DINÁMICO (RPE LOOP)
// ==========================================
function guardarFeedback() {
    let bd = JSON.parse(localStorage.getItem('planCorredorV2'));
    const fechaStr = fechaVisualizada.toISOString().split('T')[0];
    const index = bd.findIndex(e => e.fecha === fechaStr);

    if (index !== -1) {
        const dolor = parseInt(document.getElementById('input-dolor').value);
        const sueno = parseInt(document.getElementById('input-sueno').value);
        
        bd[index].completado = true;
        bd[index].rpe = document.getElementById('input-rpe').value;
        bd[index].sueno = sueno;
        bd[index].dolor = dolor;

        // ACWR ENGINE: Modificar el próximo entrenamiento exigente si hay banderas rojas
        if (dolor >= 4 || sueno < 5) {
            for (let i = index + 1; i < index + 4 && i < bd.length; i++) {
                if (bd[i].tipo !== "Descanso / Recuperación") {
                    bd[i].flag = true;
                    if (dolor >= 4) {
                        bd[i].tipo = "Cross-Training Obligatorio";
                        bd[i].detalle = "Red Flag detectada (Dolor > 3). Reemplaza esta sesión por bicicleta o natación sin impacto.";
                    } else if (sueno < 5) {
                        bd[i].tipo = "Rodaje Z1 de Recuperación";
                        bd[i].detalle = "Fatigue Flag detectada (Sueño deficiente). Volumen reducido y prohibida la alta intensidad hoy.";
                    }
                    break; 
                }
            }
            alert("⚠️ El motor ha detectado fatiga/dolor. Se ha ajustado dinámicamente tu próxima sesión para prevenir lesiones.");
        } else {
            alert("Datos fisiológicos guardados. ¡Buen trabajo!");
        }

        localStorage.setItem('planCorredorV2', JSON.stringify(bd));
        mostrarEntrenamiento();
    }
}

function toggleCajon() { document.getElementById('cajon-historial').classList.toggle('cajon-abierto'); }
function borrarPlan() {
    if(confirm("¿Purgar base de datos y recalibrar motor?")) {
        localStorage.removeItem('planCorredorV2');
        fechaVisualizada = new Date();
        verificarUsuario();
        toggleCajon();
    }
}

function renderizarCajon(bd) {
    const contenedor = document.getElementById('contenedor-lista-plan');
    contenedor.innerHTML = '';
    bd.forEach(entreno => {
        if(entreno.tipo === "Descanso / Recuperación" && !entreno.completado) return; 
        const item = document.createElement('div');
        item.style.padding = "10px"; item.style.borderBottom = "1px solid #EAEAEA"; item.style.display = "flex"; item.style.justifyContent = "space-between";
        let estado = entreno.completado ? `<span style="color:#27ae60;">Done</span>` : `<span style="color:#ccc;">-</span>`;
        item.innerHTML = `<div><strong>${entreno.fecha}</strong> <span class="badge-fase" style="font-size:0.6rem;">${entreno.fase.split(' ')[0]}</span><br><span style="font-size: 0.85rem;">${entreno.tipo}</span></div><div>${estado}</div>`;
        contenedor.appendChild(item);
    });
}

verificarUsuario();