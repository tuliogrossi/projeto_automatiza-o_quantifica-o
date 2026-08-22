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
      '<td><input type="number" min="0" step="1" data-field="backbones" value="0" required></td>';

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
	const rows = document.querySelectorAll("#pavimentos-backbone [data-field='backbones']");
	const somaBackbones = Array.from(rows).reduce((total, input) => {
		return total + (Number(input.value) || 0);
	}, 0);

	return {
		minPigtail: paresFo * 2,
		minDio: somaBackbones * 2,
		minAdaptador: paresFo * 2,
	};
}
function calcularMinimosMH(){
	const switchSEQ=Number(document.getElementById("seq-switch").value) || 0;
	const patchPanelSEQ=Number(document.getElementById("seq-patch-panel").value) || 0;
	const organizadorSEQ=Number(document.getElementById("seq-organizador").value) || 0;
	const switchSET=Number(document.getElementById("set-switch").value) || 0;
	const patchPanelSET=Number(document.getElementById("set-patch-panel").value) || 0;
	const organizadorSET=Number(document.getElementById("set-organizador").value) || 0;
	const nobreakSet=Number(document.getElementById("set-nobreaks").value) || 0;
	const nobreak2USeq=Number(document.getElementById("seq-nobreaks-2u").value) || 0;
	const nobreak3USeq=Number(document.getElementById("seq-nobreaks-3u").value) || 0;
	const minRackSEQ=Math.ceil((patchPanelSEQ+organizadorSEQ+switchSEQ+nobreak2USeq*2+nobreak3USeq*3)/42);
	const minRackSET=Math.ceil((patchPanelSET+organizadorSET+switchSET+nobreakSet)/12);

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
			mensagem: `Quantidade mínima necessária de DIOs: ${minimos.minDio}.`,
		},
		{
			input: inputs.adaptador,
			valor: Number(inputs.adaptador.value) || 0,
			minimo: minimos.minAdaptador,
			mensagem: `Quantidade mínima necessária de adaptadores ópticos: ${minimos.minAdaptador}.`,
		},
	];

	regras.forEach(({ input, valor, minimo, mensagem }) => {
		if (valor < minimo) {
			mostrarErroInput(input, mensagem);
		} else {
			mostrarErroInput(input, "");
		}
	});
}

const camposValidacaoBackbone = [
	"pares-fo",
	"acc-pigtail",
	"acc-dio",
	"acc-adaptador",
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
	"seq-rack",
	"set-switch",
	"set-patch-panel",
	"set-organizador",
	"set-rack",
	"seq-nobreaks-2u",
	"seq-nobreaks-3u",
	"set-nobreak"
]
camposValidacaoMH.forEach((id) => {
	const campo=document.getElementById(id);
	if (!campo) return;

	campo.addEventListener("input", validarEquipamentosMH);
	campo.addEventListener("change", validarEquipamentosMH);
});
document.addEventListener("DOMContentLoaded", () => {
	validarEquipamentosMH();
});