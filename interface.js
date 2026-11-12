// Cada DIO tem 24 portas (24 fibras = 12 pares = 12 adaptadores duplos).
const PORTAS_DIO = 24;
const tipoFo = document.getElementById("tipo-fo");
const caracteristicaFo = document.getElementById("caracteristica-fo");
const backboneBody = document.getElementById("pavimentos-backbone");
const mhBody = document.getElementById("pavimentos-mh");
const caracteristicasPorTipo = {
	MM: ["OM4", "OM5", "OM3(obsoleto)", "OM2(obsoleto)", "OM1(obsoleto)"],
	SM: ["OS2", "OS1(obsoleto)"],
};
const pavimentosInput=document.getElementById("pavimentos");
function renderFloorRows() {
  const count = Math.max(1, parseInt(pavimentosInput.value, 10) || 1);
  const atual = backboneBody.querySelectorAll("tr").length;

  // Adiciona somente os pavimentos que ainda não existem.
  for (let i = atual; i < count; i++) {
    const label = "P" + (i + 1);

    const bbRow = document.createElement("tr");

    bbRow.innerHTML =
      "<td>" +
      label +
      "</td>" +
      '<td><input type="number" min="0" step="1" data-field="backbones" value="1" required></td>';

    backboneBody.appendChild(bbRow);

    const servico = "dados";

    const options = SERVICOS.map((item) => {
      const selected = item === servico ? " selected" : "";

      return (
        '<option value="' + item + '"' + selected + ">" + item + "</option>"
      );
    }).join("");

    const mhRow = document.createElement("tr");

    mhRow.innerHTML =
      "<td>" +
      label +
      "</td>" +
      '<td><input type="number" min="0" step="1" data-field="dados" value="0" required></td>' +
      '<td><input type="number" min="0" step="1" data-field="voz" value="0" required></td>' +
      '<td><input type="number" min="0" step="1" data-field="CFTV" value="0" required></td>' +
      '<td><input type="number" min="0" step="1" data-field="Wi-Fi" value="0" required></td>' +
      '<td><input type="number" min="0" step="1" data-field="outro" value="0" required></td>';

    mhBody.appendChild(mhRow);
  }

  // Remove somente os últimos pavimentos quando a quantidade diminui.
  while (backboneBody.querySelectorAll("tr").length > count) {
    backboneBody.lastElementChild.remove();
  }

  while (mhBody.querySelectorAll("tr").length > count) {
    mhBody.lastElementChild.remove();
  }
}
pavimentosInput.addEventListener("input", renderFloorRows);
pavimentosInput.addEventListener("change", renderFloorRows);
document.addEventListener("DOMContentLoaded", renderFloorRows);
function atualizarCaracteristicas() {
	const caracteristicas = caracteristicasPorTipo[tipoFo.value] || [];
	const valorAtual = caracteristicaFo.value;

	caracteristicaFo.replaceChildren(
		...caracteristicas.map((caracteristica) => {
			const option = document.createElement("option");
			option.value = caracteristica;
			option.textContent = caracteristica;
			return option;
		}),
	);

	caracteristicaFo.value = caracteristicas.includes(valorAtual)
		? valorAtual
		: caracteristicas[0];
}

tipoFo.addEventListener("change", atualizarCaracteristicas);
atualizarCaracteristicas();

function mostrarErroInput(input, mensagem) {
	const container = input.closest("label") || input.parentElement;
	if (!container) return;

	let wrapper = container.querySelector(".input-stack");
	if (!wrapper) {
		wrapper = document.createElement("div");
		wrapper.className = "input-stack";
		wrapper.style.display = "flex";
		wrapper.style.flexDirection = "column";
		wrapper.style.gap = "0.35rem";
		container.appendChild(wrapper);
		wrapper.appendChild(input);
	}

	let erro = wrapper.querySelector(".erro-validacao");
	if (!erro) {
		erro = document.createElement("div");
		erro.className = "erro-validacao";
		erro.style.color = "#b00020";
		erro.style.fontSize = "0.8rem";
		erro.style.fontWeight = "600";
		erro.style.display = "block";
		wrapper.insertBefore(erro, input);
	}

	if (mensagem) {
		erro.textContent = mensagem;
		erro.hidden = false;
		input.setAttribute("aria-invalid", "true");
		input.style.borderColor = "#b00020";
	} else {
		erro.remove();
		input.removeAttribute("aria-invalid");
		input.style.borderColor = "";
	}
}

function calcularMinimosBackbone() {
	const paresFo = Number(document.getElementById("pares-fo").value) || 0;
	const bbTbody = document.getElementById("pavimentos-backbone");
	const rows = bbTbody ? bbTbody.querySelectorAll("[data-field='backbones']") : [];
	const somaBackbones = Array.from(rows).reduce((total, input) => {
		return total + (Number(input.value) || 0);
	}, 0);

	const minDio = Math.ceil((paresFo * 2) / PORTAS_DIO) * somaBackbones * 2; // DIOs por ponta x 2 pontas
	return {
		minPigtail: paresFo * 4 * somaBackbones, // 2 fibras por par x 2 pontas
		minDio,
		minAdaptador: paresFo * 2 * somaBackbones, // adaptador duplo: 1 por par x 2 pontas
		minCordao: paresFo * 2 * somaBackbones, // cordão duplex: 1 por par x 2 pontas
		minBandeja: minDio, // 1 bandeja de emenda (24 fusões / 1U) por DIO
	};
}
function calcularMinimosMH(){
	const switchSEQ = Number(document.getElementById("seq-switch").value) || 0;
	const patchPanelSEQ = Number(document.getElementById("seq-patch-panel").value) || 0;
	const organizadorSEQ = Number(document.getElementById("seq-organizador").value) || 0;
	const roteadorSEQ = Number(document.getElementById("seq-roteadores").value) || 0;
	const nobreak2USeq = Number(document.getElementById("seq-nobreaks-2u").value) || 0;
	const nobreak3USeq = Number(document.getElementById("seq-nobreaks-3u").value) || 0;
	const bandeja1USeq = Number(document.getElementById("seq-bandeja-1u").value) || 0;
	const bandeja2USeq = Number(document.getElementById("seq-bandeja-2u").value) || 0;

	const switchSET = Number(document.getElementById("set-switch").value) || 0;
	const patchPanelSET = Number(document.getElementById("set-patch-panel").value) || 0;
	const organizadorSET = Number(document.getElementById("set-organizador").value) || 0;
	const nobreakSet = Number(document.getElementById("set-nobreaks").value) || 0;
	const bandejaSET = Number(document.getElementById("set-bandeja").value) || 0;

	// Ocupação em U no Rack SEQ (42U)
	const somaUSeq = patchPanelSEQ + organizadorSEQ + switchSEQ + roteadorSEQ + (nobreak2USeq * 2) + (nobreak3USeq * 3) + bandeja1USeq + (bandeja2USeq * 2);
	const minRackSEQ = somaUSeq > 0 ? Math.ceil(somaUSeq / 42) : 0;

	// Ocupação em U no Rack SET (12U)
	const somaUSET = patchPanelSET + organizadorSET + switchSET + nobreakSet + bandejaSET;
	const minRackSET = somaUSET > 0 ? Math.ceil(somaUSET / 12) : 0;

	return {
		minRackSET,
		minRackSEQ
	};
}
function validarEquipamentosMH() {
	const minimos=calcularMinimosMH();
	const inputs={
		rackSET: document.getElementById("set-rack"),
		rackSEQ: document.getElementById("seq-rack")
	}
	const regras = [
		{
			input:inputs.rackSET,
			valor: Number(inputs.rackSET.value) || 0,
			minimo: minimos.minRackSET,
			mensagem: `Quantidade mínima necessária de racks: ${minimos.minRackSET}.`
		},
		{
			input:inputs.rackSEQ,
			valor: Number(inputs.rackSEQ.value) || 0,
			minimo: minimos.minRackSEQ,
			mensagem: `Quantidade mínima necessária de racks: ${minimos.minRackSEQ}.`
		}
	]
	regras.forEach(({ input, valor, minimo, mensagem }) => {
		if (valor < minimo) {
			mostrarErroInput(input, mensagem);
		} else {
			mostrarErroInput(input, "");
		}
	});
}
function validarAcessoriosBackbone() {
	const minimos = calcularMinimosBackbone();
	const inputs = {
		pigtail: document.getElementById("acc-pigtail"),
		dio: document.getElementById("acc-dio"),
		adaptador: document.getElementById("acc-adaptador"),
		cordao: document.getElementById("acc-cordao"),
		bandeja: document.getElementById("acc-bandeja"),
	};
	const regras = [
		{
			input: inputs.pigtail,
			valor: Number(inputs.pigtail.value) || 0,
			minimo: minimos.minPigtail,
			mensagem: `Quantidade mínima necessária de pigtails: ${minimos.minPigtail}.`,
		},
		{
			input: inputs.dio,
			valor: Number(inputs.dio.value) || 0,
			minimo: minimos.minDio,
			mensagem: `Quantidade mínima necessária de DIOs de 24 portas: ${minimos.minDio}.`,
		},
		{
			input: inputs.adaptador,
			valor: Number(inputs.adaptador.value) || 0,
			minimo: minimos.minAdaptador,
			mensagem: `Quantidade mínima necessária de adaptadores ópticos duplos: ${minimos.minAdaptador}.`,
		},
		{
			input: inputs.cordao,
			valor: Number(inputs.cordao.value) || 0,
			minimo: minimos.minCordao,
			mensagem: `Quantidade mínima necessária de cordões ópticos duplex: ${minimos.minCordao}.`,
		},
		{
			input: inputs.bandeja,
			valor: Number(inputs.bandeja.value) || 0,
			minimo: minimos.minBandeja,
			mensagem: `Quantidade mínima necessária de bandejas de emenda: ${minimos.minBandeja}.`,
		},
	];

	regras.forEach(({ input, valor, minimo, mensagem }) => {
		if (input) {
			if (valor < minimo) {
				mostrarErroInput(input, mensagem);
			} else {
				mostrarErroInput(input, "");
			}
		}
	});
}

const camposValidacaoBackbone = [
	"pares-fo",
	"acc-pigtail",
	"acc-dio",
	"acc-adaptador",
	"acc-cordao",
	"acc-bandeja",
];

camposValidacaoBackbone.forEach((id) => {
	const campo = document.getElementById(id);
	if (!campo) return;

	campo.addEventListener("input", validarAcessoriosBackbone);
	campo.addEventListener("change", validarAcessoriosBackbone);
});

document.addEventListener("DOMContentLoaded", () => {
	const backboneBody = document.getElementById("pavimentos-backbone");
	if (backboneBody) {
		backboneBody.addEventListener("input", validarAcessoriosBackbone);
		backboneBody.addEventListener("change", validarAcessoriosBackbone);
	}
	validarAcessoriosBackbone();
});
const camposValidacaoMH = [
	"seq-switch",
	"seq-patch-panel",
	"seq-organizador",
	"seq-roteadores",
	"seq-rack",
	"seq-nobreaks-2u",
	"seq-nobreaks-3u",
	"seq-bandeja-1u",
	"seq-bandeja-2u",
	"set-switch",
	"set-patch-panel",
	"set-organizador",
	"set-rack",
	"set-nobreaks",
	"set-bandeja"
];
camposValidacaoMH.forEach((id) => {
	const campo=document.getElementById(id);
	if (!campo) return;

	campo.addEventListener("input", validarEquipamentosMH);
	campo.addEventListener("change", validarEquipamentosMH);
});
document.addEventListener("DOMContentLoaded", () => {
	validarEquipamentosMH();
});

// ===== Backbone primário (entre prédios) =====
const tipoFoPri = document.getElementById("tipo-fo-pri");
const caracteristicaFoPri = document.getElementById("caracteristica-fo-pri");
const bbPrimario = document.getElementById("bb-primario");
const blocoBbPrimario = document.getElementById("bloco-bb-primario");

function atualizarCaracteristicasPrimario() {
	const caracteristicas = caracteristicasPorTipo[tipoFoPri.value] || [];
	const valorAtual = caracteristicaFoPri.value;

	caracteristicaFoPri.replaceChildren(
		...caracteristicas.map((caracteristica) => {
			const option = document.createElement("option");
			option.value = caracteristica;
			option.textContent = caracteristica;
			return option;
		}),
	);

	caracteristicaFoPri.value = caracteristicas.includes(valorAtual)
		? valorAtual
		: caracteristicas[0];
}
tipoFoPri.addEventListener("change", atualizarCaracteristicasPrimario);
atualizarCaracteristicasPrimario();

function alternarBackbonePrimario() {
	blocoBbPrimario.hidden = !bbPrimario.checked;
}
bbPrimario.addEventListener("change", alternarBackbonePrimario);
alternarBackbonePrimario();

function calcularMinimosBackbonePrimario() {
	const pares = Number(document.getElementById("pares-fo-pri").value) || 0;
	const qtd = Number(document.getElementById("qtd-bb-pri").value) || 0;

	const minDio = Math.ceil((pares * 2) / PORTAS_DIO) * qtd * 2; // DIOs por ponta x 2 pontas
	return {
		minPigtail: pares * 4 * qtd, // 2 fibras por par x 2 pontas
		minDio,
		minAdaptador: pares * 2 * qtd, // adaptador duplo: 1 por par x 2 pontas
		minCordao: pares * 2 * qtd, // cordão duplex: 1 por par x 2 pontas
		minBandeja: minDio, // 1 bandeja de emenda por DIO
	};
}

function validarAcessoriosBackbonePrimario() {
	const minimos = calcularMinimosBackbonePrimario();
	const inputs = {
		pigtail: document.getElementById("acc-pri-pigtail"),
		dio: document.getElementById("acc-pri-dio"),
		adaptador: document.getElementById("acc-pri-adaptador"),
		cordao: document.getElementById("acc-pri-cordao"),
		bandeja: document.getElementById("acc-pri-bandeja"),
	};
	const regras = [
		{
			input: inputs.pigtail,
			valor: Number(inputs.pigtail.value) || 0,
			minimo: minimos.minPigtail,
			mensagem: `Quantidade mínima necessária de pigtails: ${minimos.minPigtail}.`,
		},
		{
			input: inputs.dio,
			valor: Number(inputs.dio.value) || 0,
			minimo: minimos.minDio,
			mensagem: `Quantidade mínima necessária de DIOs de 24 portas: ${minimos.minDio}.`,
		},
		{
			input: inputs.adaptador,
			valor: Number(inputs.adaptador.value) || 0,
			minimo: minimos.minAdaptador,
			mensagem: `Quantidade mínima necessária de adaptadores ópticos duplos: ${minimos.minAdaptador}.`,
		},
		{
			input: inputs.cordao,
			valor: Number(inputs.cordao.value) || 0,
			minimo: minimos.minCordao,
			mensagem: `Quantidade mínima necessária de cordões ópticos duplex: ${minimos.minCordao}.`,
		},
		{
			input: inputs.bandeja,
			valor: Number(inputs.bandeja.value) || 0,
			minimo: minimos.minBandeja,
			mensagem: `Quantidade mínima necessária de bandejas de emenda: ${minimos.minBandeja}.`,
		},
	];

	regras.forEach(({ input, valor, minimo, mensagem }) => {
		if (input) {
			mostrarErroInput(input, valor < minimo ? mensagem : "");
		}
	});
}

["pares-fo-pri", "qtd-bb-pri", "acc-pri-pigtail", "acc-pri-dio", "acc-pri-adaptador", "acc-pri-cordao", "acc-pri-bandeja"].forEach((id) => {
	const campo = document.getElementById(id);
	if (!campo) return;
	campo.addEventListener("input", validarAcessoriosBackbonePrimario);
	campo.addEventListener("change", validarAcessoriosBackbonePrimario);
});
document.addEventListener("DOMContentLoaded", validarAcessoriosBackbonePrimario);


// ===== Patch panels e switches mínimos (SEQ + SET) =====
// Premissa oficial Prof. Adelson: Cada ponto de telecom possui 2 pontos de rede / cabos UTP.
// Patch panels e switches têm 24 portas cada.
function totalPontosTelecom() {
	const inputs = mhBody.querySelectorAll("input[data-field]");
	return Array.from(inputs).reduce((total, input) => total + (Number(input.value) || 0), 0);
}

function validarPortasMH() {
	const totalPts = totalPontosTelecom();
	const totalPortas = totalPts * 2; // 2 portas de rede por ponto de telecom
	const minimo = Math.ceil(totalPortas / 24) || 1;
	const regras = [
		{ ids: ["seq-patch-panel", "set-patch-panel"], nome: "patch panels" },
		{ ids: ["seq-switch", "set-switch"], nome: "switches" },
	];

	regras.forEach(({ ids, nome }) => {
		const inputs = ids.map((id) => document.getElementById(id)).filter(Boolean);
		const total = inputs.reduce((soma, input) => soma + (Number(input.value) || 0), 0);
		const mensagem = total < minimo
			? `Mínimo total (SEQ + SET): ${minimo} ${nome} de 24 portas (${totalPortas} portas de rede para ${totalPts} pontos de telecom).`
			: "";
		inputs.forEach((input) => mostrarErroInput(input, mensagem));
	});
}

["seq-patch-panel", "set-patch-panel", "seq-switch", "set-switch"].forEach((id) => {
	const campo = document.getElementById(id);
	if (!campo) return;
	campo.addEventListener("input", validarPortasMH);
	campo.addEventListener("change", validarPortasMH);
});
mhBody.addEventListener("input", () => {
	validarPortasMH();
	preencherValoresRecomendados();
});
mhBody.addEventListener("change", () => {
	validarPortasMH();
	preencherValoresRecomendados();
});
pavimentosInput.addEventListener("input", () => {
	validarPortasMH();
	preencherValoresRecomendados();
});
pavimentosInput.addEventListener("change", () => {
	validarPortasMH();
	preencherValoresRecomendados();
});
document.addEventListener("DOMContentLoaded", validarPortasMH);

// ===== Alternância Dinâmica de Escopo (Apenas MH / Apenas Backbone / Ambos) =====
const fieldsetBackbone = document.getElementById("fieldset-backbone");
const fieldsetMH = document.getElementById("fieldset-mh");
const escopoRadios = document.querySelectorAll("input[name='escopo']");

function alternarEscopo() {
	const checked = document.querySelector("input[name='escopo']:checked");
	const escopo = checked ? checked.value : "ambos";

	if (fieldsetBackbone) {
		const ativoBB = escopo === "backbone" || escopo === "ambos";
		fieldsetBackbone.hidden = !ativoBB;
		fieldsetBackbone.querySelectorAll("input, select").forEach((el) => {
			if (!ativoBB) {
				el.dataset.wasRequired = el.required ? "true" : "false";
				el.required = false;
				mostrarErroInput(el, "");
			} else if (el.dataset.wasRequired === "true") {
				el.required = true;
			}
		});
	}

	if (fieldsetMH) {
		const ativoMH = escopo === "mh" || escopo === "ambos";
		fieldsetMH.hidden = !ativoMH;
		fieldsetMH.querySelectorAll("input, select").forEach((el) => {
			if (!ativoMH) {
				el.dataset.wasRequired = el.required ? "true" : "false";
				el.required = false;
				mostrarErroInput(el, "");
			} else if (el.dataset.wasRequired === "true") {
				el.required = true;
			}
		});
	}
}

escopoRadios.forEach((radio) => {
	radio.addEventListener("change", alternarEscopo);
});
document.addEventListener("DOMContentLoaded", alternarEscopo);

// ===== Função de Preenchimento Automático dos Valores Recomendados =====
function preencherValoresRecomendados() {
	// 1. Backbone secundário
	const minimosBB = calcularMinimosBackbone();
	const setVal = (id, val) => {
		const el = document.getElementById(id);
		if (el) el.value = val;
	};

	setVal("acc-dio", minimosBB.minDio);
	setVal("acc-bandeja", minimosBB.minBandeja);
	setVal("acc-pigtail", minimosBB.minPigtail);
	setVal("acc-adaptador", minimosBB.minAdaptador);
	setVal("acc-cordao", minimosBB.minCordao);

	// 2. Backbone primário (se marcado)
	if (bbPrimario && bbPrimario.checked) {
		const minimosPri = calcularMinimosBackbonePrimario();
		setVal("acc-pri-dio", minimosPri.minDio);
		setVal("acc-pri-bandeja", minimosPri.minBandeja);
		setVal("acc-pri-pigtail", minimosPri.minPigtail);
		setVal("acc-pri-adaptador", minimosPri.minAdaptador);
		setVal("acc-pri-cordao", minimosPri.minCordao);
	}

	// 3. Malha Horizontal (SEQ e SET)
	const totalPts = totalPontosTelecom();
	const totalPortas = totalPts * 2; // 2 portas de rede por ponto de telecom
	const pavimentosCount = Math.max(1, parseInt(pavimentosInput.value, 10) || 1);
	const blocos24 = Math.ceil(totalPortas / 24) || 1;

	// Roteador 1U na SEQ
	setVal("seq-roteadores", 1);

	// Distribuição balanceada de switches e patch panels
	const setSwitches = Math.max(1, Math.min(blocos24, pavimentosCount));
	const seqSwitches = Math.max(1, (blocos24 - setSwitches) + 1); // +1 switch core para ER

	setVal("set-switch", setSwitches);
	setVal("set-patch-panel", setSwitches);
	setVal("set-organizador", setSwitches);
	setVal("set-patch-cords", Math.max(setSwitches * 24, totalPortas));
	setVal("set-nobreaks", pavimentosCount);
	setVal("set-bandeja", pavimentosCount);

	setVal("seq-switch", seqSwitches);
	setVal("seq-patch-panel", Math.max(1, blocos24 - setSwitches || 1));
	setVal("seq-organizador", seqSwitches);
	setVal("seq-patch-cords", seqSwitches * 24);
	setVal("seq-nobreaks-2u", 1);
	setVal("seq-nobreaks-3u", 0);
	setVal("seq-bandeja-1u", 1);
	setVal("seq-bandeja-2u", 0);

	// Dimensionamento de Racks
	const minimosMH = calcularMinimosMH();
	setVal("set-rack", Math.max(pavimentosCount, minimosMH.minRackSET || 1));
	setVal("seq-rack", Math.max(1, minimosMH.minRackSEQ || 1));

	// Revalida tudo para limpar avisos
	validarAcessoriosBackbone();
	if (bbPrimario && bbPrimario.checked) validarAcessoriosBackbonePrimario();
	validarEquipamentosMH();
	validarPortasMH();
}

const btnPreencher = document.getElementById("btn-preencher-recomendados");
if (btnPreencher) {
	btnPreencher.addEventListener("click", preencherValoresRecomendados);
}

// Ao alternar o backbone primário, se for marcado, garantir validação
bbPrimario.addEventListener("change", () => {
	alternarBackbonePrimario();
	if (bbPrimario.checked) {
		validarAcessoriosBackbonePrimario();
	}
});

// ===== Inicialização e Redefinição para Padrão dos Quantitativos ao Reiniciar a Página =====
function reiniciarPadroes() {
	const form = document.getElementById("form-calculadora");
	if (form) form.reset();

	pavimentosInput.value = "1";
	
	// Reseta seleção de escopo para "ambos"
	const radioAmbos = document.querySelector("input[name='escopo'][value='ambos']");
	if (radioAmbos) radioAmbos.checked = true;

	// Reseta backbone primario para falso
	if (bbPrimario) {
		bbPrimario.checked = false;
		alternarBackbonePrimario();
	}

	// Reseta tipo de fibra e características
	tipoFo.value = "MM";
	atualizarCaracteristicas();
	caracteristicaFo.value = "OM4";
	const medBb = document.getElementById("medida-bb");
	if (medBb) medBb.value = "30";
	const parFo = document.getElementById("pares-fo");
	if (parFo) parFo.value = "12";
	if (document.getElementById("tipo-emenda-bb")) {
		document.getElementById("tipo-emenda-bb").value = "fusao";
	}

	// Reseta Malha Horizontal
	const catMh = document.getElementById("categoria-mh");
	if (catMh) catMh.value = "Cat6";
	const medMh = document.getElementById("medida-mh");
	if (medMh) medMh.value = "15";

	// Renderiza 1 andar limpo
	renderFloorRows();

	// Limpa pontos da MH para o padrão inicial
	const firstMhRow = mhBody.querySelector("tr");
	if (firstMhRow) {
		firstMhRow.querySelectorAll("input[data-field]").forEach(inp => inp.value = "0");
	}
	const firstBbRow = backboneBody.querySelector("tr");
	if (firstBbRow) {
		firstBbRow.querySelectorAll("input[data-field]").forEach(inp => inp.value = "1");
	}

	// Atualiza escopo
	alternarEscopo();

	// Preenche os quantitativos recomendados padrão
	preencherValoresRecomendados();

	// Limpa mensagens e bordas de erro
	document.querySelectorAll(".erro-validacao").forEach(el => el.remove());
	document.querySelectorAll("[aria-invalid]").forEach(el => {
		el.removeAttribute("aria-invalid");
		el.style.borderColor = "";
	});

	// Limpa resultado anterior se houver
	const resultadoDiv = document.getElementById("planilha-resultado");
	if (resultadoDiv) resultadoDiv.innerHTML = "";
	const btnExp = document.getElementById("btn-exportar");
	if (btnExp) btnExp.disabled = true;
}

window.addEventListener("pageshow", () => {
	reiniciarPadroes();
	setTimeout(reiniciarPadroes, 50);
});
document.addEventListener("DOMContentLoaded", () => {
	reiniciarPadroes();
	setTimeout(reiniciarPadroes, 50);
});
