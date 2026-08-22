const form = document.getElementById("form-calculadora");
const resultado = document.getElementById("planilha-resultado");
const btnExportar=document.getElementById("btn-exportar");

const SERVICOS = ["dados", "voz", "CFTV", "Wi-Fi", "outro"];
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function numberValue(id) {
  const el = document.getElementById(id);
  return el.value === "" ? "" : el.value;
}

function readFloorValues(tbody, fields) {
  const rows = [];
  tbody.querySelectorAll("tr").forEach((tr) => {
    const item = {};
    fields.forEach((field) => {
      const input = tr.querySelector(`[data-field="${field}"]`);
      item[field] = input ? input.value : "";
    });
    rows.push(item);
  });
  return rows;
}

function calcularBackbone() {
  const pavimentosBackbone = readFloorValues(
    document.getElementById("pavimentos-backbone"),
    ["backbones"],
  );
  const medidaLance = Number(document.getElementById("medida-bb").value) || 0;
  const paresFO = Number(document.getElementById("pares-fo").value) || 0;
  const tipoFibra = document.getElementById("tipo-fo").value;
  const caracteristicaFibra = document.getElementById("caracteristica-fo").value;
  const somaBackbones = pavimentosBackbone.reduce(
    (sum, floor) => sum + (parseInt(floor.backbones, 10) || 0),
    0,
  );
  const qtdCabos = somaBackbones * medidaLance * 1.2;
  const pigtail = Number(document.getElementById("acc-pigtail").value) || 0;
  const dio = Number(document.getElementById("acc-dio").value) || 0;
  const adaptador = Number(document.getElementById("acc-adaptador").value) || 0;
  const bandejaEmenda = Number(document.getElementById("acc-bandeja").value) || 0;
  const cordaoOptico = Number(document.getElementById("acc-cordao").value) || 0;
  const conectorOptico = Number(document.getElementById("acc-conector").value) || 0;
  const roloAbracadeiras=Math.ceil(qtdCabos*0.15);
  return {
    qtdCabos,
    pigtail,
    dio,
    adaptador,
    fibra: {
      especificacao: tipoFibra,
      caracteristica: caracteristicaFibra,
      pares: paresFO
    },
    bandejaEmenda,
    cordaoOptico,
    conectorOptico,
    misc: {
      roloAbracadeiras
    }
  };
}
function calcularMH() {
  const pavimentosMHInput = readFloorValues(document.getElementById("pavimentos-mh"), [
    "dados",
    "voz",
    "CFTV",
    "Wi-Fi",
    "outro",
  ]);
  const medidaMH = Number(document.getElementById("medida-mh").value) || 0;
  const categoriaCabo = document.getElementById("categoria-mh").value;
  const pavimentosMH = pavimentosMHInput.map((pavimento) => {
    const pontosTelecom = Number(pavimento["dados"]) + Number(pavimento["voz"]) + Number(pavimento["CFTV"]) + Number(pavimento["Wi-Fi"]) + Number(pavimento["outro"]);
    return {
      pontosTelecom,
      qtdCabo: Math.ceil(pontosTelecom * medidaMH * 2.4)
    };
  });


  const pontosTelecomTotal = pavimentosMH.reduce(
    (sum, pavimento) => { return sum + pavimento.pontosTelecom },
    0,
  );
  const qtdCaboTotal = {
    metros: Math.ceil(pontosTelecomTotal * medidaMH * 2.4),
    caixas: Math.ceil(pontosTelecomTotal * medidaMH * 2.4 / 305)
  };
  const patchCable = pontosTelecomTotal;
  const rackSeq = Number(document.getElementById("seq-rack").value) || 0;
  const patchPanelSeq = Number(document.getElementById("seq-patch-panel").value) || 0;
  const organizadorSeq = Number(document.getElementById("seq-organizador").value) || 0;
  const patchCordSeq = Number(document.getElementById("seq-patch-cords").value) || 0;
  const switchSeq = Number(document.getElementById("seq-switch").value) || 0;
  const roteadorSeq = Number(document.getElementById("seq-roteadores").value) || 0;
  const nobreak2USeq=Number(document.getElementById("seq-nobreaks-2u").value) || 0;
  const nobreak3USeq=Number(document.getElementById("seq-nobreaks-3u").value) || 0;
  const bandeja1USeq=Number(document.getElementById("seq-bandeja-1u").value) || 0;
  const bandeja2USeq=Number(document.getElementById("seq-bandeja-2u").value) || 0;
  const seq = {
    rack: rackSeq,
    patchPanel: patchPanelSeq,
    organizador: organizadorSeq,
    patchCords: patchCordSeq,
    switchs: switchSeq,
    roteador: roteadorSeq,
    nobreak2U: nobreak2USeq,
    nobreak3U: nobreak3USeq,
    misc: {
      bandeja1u: bandeja1USeq,
      bandeja2u: bandeja2USeq
    }
  };
  const rackSet = Number(document.getElementById("set-rack").value) || 0;
  const patchPanelSet = Number(document.getElementById("set-patch-panel").value) || 0;
  const organizadorSet = Number(document.getElementById("set-organizador").value) || 0;
  const patchCordSet = Number(document.getElementById("set-patch-cords").value) || 0;
  const switchSet = Number(document.getElementById("set-switch").value) || 0;
  const nobreakSet=Number(document.getElementById("set-nobreaks").value) || 0;
  const bandejaSet=Number(document.getElementById("set-bandeja").value) || 0;
  const set = {
    rack: rackSet,
    patchPanel: patchPanelSet,
    organizador: organizadorSet,
    patchCords: patchCordSet,
    switchs: switchSet,
    nobreak: nobreakSet,
    misc: {
      bandeja: bandejaSet
    }
  };
  const etiqueta = pontosTelecomTotal * 3;
  const espelho = pontosTelecomTotal;
  const misc = {
    etiqueta,
    espelho
  }
  return {
    categoriaCabo,
    pavimentosMH,
    pontosTelecomTotal,
    qtdCaboTotal,
    patchCable,
    seq,
    set,
    misc
  };
}
function renderPlanilha() {
  const escopo = document.querySelector("input[name='escopo']:checked").value;
  const planilha = document.getElementById("planilha-resultado");
  planilha.innerHTML = "";
  let miscHtml=`<h3>Miscelânea</h3>
  <table id="tabelaMisc">
    <thead>
      <tr>
        <th></th>
        <th>descrição</th>
        <th>quantidade</th>
        <th>unidade</th>
      </tr>
    </thead>
    <tbody>
`;
let miscCont=0;
  if (escopo === "backbone" || escopo === "ambos") {
    const dadosBackbone = calcularBackbone();
    let html = `<h3>Backbone</h3><table id="tabelaBackbone">
      <thead>
      <tr><th></th><th>descrição</th><th>quantidade</th><th>unidade</th></tr>
      </thead>
      <tbody>`;
    let cont = 0;
    if (dadosBackbone.adaptador > 0) {
      cont++;
      html += `<tr><td>${cont}</td><td>Adaptador óptico</td><td>${dadosBackbone.adaptador}</td><td>un.</td></tr>`;
    }
    if (dadosBackbone.pigtail > 0) {
      cont++;
      html += `<tr><td>${cont}</td><td>Pigtail</td><td>${dadosBackbone.pigtail}</td><td>un.</td></tr>`;
    }
    if (dadosBackbone.dio > 0) {
      cont++;
      html += `<tr><td>${cont}</td><td>DIO</td><td>${dadosBackbone.dio}</td><td>un.</td></tr>`;
    }
    if (dadosBackbone.quantidadeCabos > 0) {
      cont++;
      html += `<tr><td>${cont}</td><td>FO(${dadosBackbone.fibra.caracteristica}-${dadosBackbone.fibra.especificacao})(${dadosBackbone.fibra.pares} pares)(com 20% de folga)</td><td>${dadosBackbone.qtdCabos}</td><td>m</td></tr>`;
    }
    if (dadosBackbone.bandejaEmenda > 0) {
      cont++;
      html += `<tr><td>${cont}</td><td>Bandeja de Emenda</td><td>${dadosBackbone.bandejaEmenda}</td><td>un.</td></tr>`;
    }
    if (dadosBackbone.conectorOptico > 0) {
      cont++;
      html += `<tr><td>${cont}</td><td>Conector Óptico</td><td>${dadosBackbone.conectorOptico}</td><td>un.</td></tr>`;
    }
    if (dadosBackbone.cordaoOptico > 0) {
      cont++;
      html += `<tr><td>${cont}</td><td>Cordão Óptico</td><td>${dadosBackbone.cordaoOptico}</td><td>un.</td></tr>`;
    }
    html += `</tbody></table>`;
    planilha.innerHTML += html;
    if(dadosBackbone.misc.roloAbracadeiras>0){
      miscCont++;
      miscHtml+=`<tr><td>${miscCont}</td><td>Rolo de abraçadeiras dupla face 5 metros</td><td>${dadosBackbone.misc.roloAbracadeiras}</td><td>un.</td></tr>`;
    }
  }
  if (escopo === "mh" || escopo === "ambos") {
    const dadosMH = calcularMH();
    let html = `<h3>Malha Horizontal</h3><table id="tabelaMH">
      <thead><tr><th></th><th>descrição</th><th>quantidade</th><th>unidade</th></tr></thead>
      <tbody>`;
    let cont = 0;
    if (dadosMH.qtdCaboTotal.metros > 0) {
      for (let i = 0; i < dadosMH.pavimentosMH.length; i++) {
        html += `<tr><td></td><td>cabo ${dadosMH.categoriaCabo} no pavimento ${i + 1}</td><td>${dadosMH.pavimentosMH[i].qtdCabo}</td><td>m</td></tr>`;
      }
      cont++;
      html += `<tr><td>${cont}</td><td>cabo ${dadosMH.categoriaCabo} Total</td><td>${dadosMH.qtdCaboTotal.metros}(${dadosMH.qtdCaboTotal.caixas} caixas)</td><td>cx(305m)</td></tr>`;
    }
    if (dadosMH.patchCable > 0) {
      cont++;
      html += `<tr><td>${cont}</td><td>Patch Cable RJ45</td><td>${Math.ceil(dadosMH.patchCable / 1.5)}</td><td>1.5m</td></tr>`;
    }
    html += `</tbody></table>`;
    planilha.innerHTML += html;
    if (dadosMH.seq.organizador > 0 || dadosMH.seq.patchCords > 0 || dadosMH.seq.rack > 0 || dadosMH.seq.switchs > 0 || dadosMH.seq.patchPanel > 0) {
      cont=0;
      html = `<h4>Equipamentos SEQ</h4><table id="tabelaSEQ"><thead><tr><th></th><th>descrição</th><th>quantidade</th><th>unidade</th></tr></thead><tbody>`;
      if (dadosMH.seq.organizador > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Organizador de cabos</td><td>${dadosMH.seq.organizador}</td><td>un.</td></tr>`;
      }
      if (dadosMH.seq.patchCords > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Patch Cord RJ45 ${dadosMH.categoriaCabo}</td><td>${Math.ceil(dadosMH.seq.patchCords / 1.5)}</td><td>1.5m</td></tr>`;
      }
      if (dadosMH.seq.rack > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Rack 42U aberto</td><td>${dadosMH.seq.rack}</td><td>un.</td></tr>`;
      }
      if (dadosMH.seq.switchs > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Switch 24 portas</td><td>${dadosMH.seq.switchs}</td><td>un.</td></tr>`;
      }
      if (dadosMH.seq.patchPanel > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Patch Panel 24 portas</td><td>${dadosMH.seq.patchPanel}</td><td>un.</td></tr>`;
      }
      if (dadosMH.seq.roteador > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Roteador</td><td>${dadosMH.seq.roteador}</td><td>un.</td></tr>`;
      }
      if(dadosMH.seq.nobreak2U>0){
        cont++;
        html+=`<tr><td>${cont}</td><td>Nobreak 2U</td><td>${dadosMH.seq.nobreak2U}</td><td>un.</td></tr>`;
      }
      if(dadosMH.seq.nobreak3U>0){
        cont++;
        html+=`<tr><td>${cont}</td><td>Nobreak 3U</td><td>${dadosMH.seq.nobreak3U}</td><td>un.</td></tr>`;
      }
      html += `</tbody></table>`;
      planilha.innerHTML += html;
    }
    if (dadosMH.set.organizador > 0 || dadosMH.set.patchCords > 0 || dadosMH.set.rack > 0 || dadosMH.set.switchs > 0 || dadosMH.set.patchPanel > 0) {
      html = `<h4>Equipamentos SET</h4><table id="tabelaSET"><thead><tr><th></th><th>descrição</th><th>quantidade</th><th>unidade</th></tr></thead><tbody>`;
      cont=0;
      if (dadosMH.set.organizador > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Organizador de cabos</td><td>${dadosMH.set.organizador}</td><td>un.</td></tr>`;
      }
      if (dadosMH.set.patchCords > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Patch Cord RJ45 ${dadosMH.categoriaCabo}</td><td>${Math.ceil(dadosMH.set.patchCords / 1.5)}</td><td>1.5m</td></tr>`;
      }
      if (dadosMH.set.rack > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Rack 12U aberto</td><td>${dadosMH.set.rack}</td><td>un.</td></tr>`;
      }
      if (dadosMH.set.switchs > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Switch 24 portas</td><td>${dadosMH.set.switchs}</td><td>un.</td></tr>`;
      }
      if (dadosMH.set.patchPanel > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Patch Panel 24 portas</td><td>${dadosMH.set.patchPanel}</td><td>un.</td></tr>`;
      }
      if(dadosMH.set.nobreak>0){
        cont++;
        html += `<tr><td>${cont}</td><td>Nobreak 1U</td><td>${dadosMH.set.nobreak}</td><td>un.</td></tr>`;
      }
      html += `</tbody></table>`;
      planilha.innerHTML += html;
    }
    if(dadosMH.misc.etiqueta>0){
      miscCont++;
      miscHtml += `<tr><td>${miscCont}</td><td>pacote 50 etiquetas</td><td>${Math.ceil(dadosMH.misc.etiqueta/50)}</td><td>un.</td></tr>`;
    }
    if(dadosMH.misc.espelho>0){
      miscCont++;
      miscHtml += `<tr><td>${miscCont}</td><td>Espelho RJ45 duplo </td><td>${dadosMH.misc.espelho}</td><td>un.</td></tr>`;
    }
    let bandejas=dadosMH.set.misc.bandeja+dadosMH.seq.misc.bandeja1u;
    if(bandejas>0){
      miscCont++;
      miscHtml += `<tr><td>${miscCont}</td><td>Bandeja 1U</td><td>${bandejas}</td><td>un.</td></tr>`;
    }
    if(dadosMH.seq.misc.bandeja2u>0){
      miscCont++;
      miscHtml+=`<tr><td>${miscCont}</td><td>Bandeja 2U</td><td>${dadosMH.seq.misc.bandeja2u}</td><td>un.</td></tr>`;
    }
  }
  miscHtml+=`</tbody></table>`;
  planilha.innerHTML+=miscHtml;
}
form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderPlanilha();
    btnExportar.disabled=false;
});
btnExportar.addEventListener("click", () =>{
    let csv = [];
    
    // Configuração das tabelas que estão na sua página
    const tConfig = [
        { id: "tabelaBackbone", title: "Backbone" },
        { id: "tabelaMH", title: "Malha Horizontal" },
        { id: "tabelaSEQ", title: "Equipamentos SEQ" },
        { id: "tabelaSET", title: "Equipamentos SET" },
        { id: "tabelaMisc", title: "Miscelânea" }
    ];

    tConfig.forEach((config, index) => {
        let table = document.getElementById(config.id);
        if (!table) return;

        if (index > 0) csv.push("", ""); // Linhas em branco de separação
        csv.push('"' + config.title + '"', ""); // Título da tabela

        table.querySelectorAll("tr").forEach(row => {
            let rowData = [];
            row.querySelectorAll("td, th").forEach(col => {
                let text = col.innerText.replace(/"/g, '""');
                rowData.push('"' + text + '"');
            });
            csv.push(rowData.join(";"));
        });
    });
    let blob = new Blob(["\uFEFF" + csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "planilha_quantificacao.csv";
    link.click(); 
    URL.revokeObjectURL(link.href);
});