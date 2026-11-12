const form = document.getElementById("form-calculadora");
const resultado = document.getElementById("planilha-resultado");
const btnExportar = document.getElementById("btn-exportar");

const SERVICOS = ["dados", "voz", "CFTV", "Wi-Fi", "outro"];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

// Coeficientes de atenuação padrão (dB/km) conforme ISO/IEC 11801 e ANSI/TIA-568
function obterAtenuacaoFibra(tipo, caracteristica) {
  const carac = (caracteristica || "").toUpperCase();
  if (tipo === "SM") {
    if (carac.includes("OS1")) return 1.0;
    return 0.4; // OS2 típico em 1310 nm
  }
  // MM
  if (carac.includes("OM1")) return 3.5;
  return 3.0; // OM2, OM3, OM4, OM5 típico em 850 nm
}

function calcularPerdaOptica(comprimentoMetros, tipoFibra, caracFibra, tipoEmenda) {
  const atenuacaoKm = obterAtenuacaoFibra(tipoFibra, caracFibra);
  const perdaCabo = (comprimentoMetros / 1000) * atenuacaoKm;

  // Perda de conectores SC: 0,5 dB por conector (2 conectores nas duas pontas)
  const perdaConectorUnit = 0.5;
  const qtdConectores = 2;
  const perdaConectores = qtdConectores * perdaConectorUnit;

  // Perda de emenda: Fusão = 0,2 dB / Mecânica = 0,4 dB (2 emendas de pigtail nas duas pontas)
  const perdaEmendaUnit = tipoEmenda === "mecanica" ? 0.4 : 0.2;
  const qtdEmendas = 2;
  const perdaEmendas = qtdEmendas * perdaEmendaUnit;

  // Margem de segurança de projeto (reserva para manutenção/envelhecimento)
  const margemProjeto = 3.0;

  const perdaTotal = perdaCabo + perdaConectores + perdaEmendas + margemProjeto;
  const budgetTransceiver = 8.0; // Budget óptico típico de transceivers Ethernet
  const saldoBudget = budgetTransceiver - perdaTotal;
  const aprovado = saldoBudget >= 0;

  return {
    comprimentoMetros,
    atenuacaoKm,
    perdaCabo: Number(perdaCabo.toFixed(3)),
    perdaConectorUnit,
    qtdConectores,
    perdaConectores: Number(perdaConectores.toFixed(2)),
    perdaEmendaUnit,
    tipoEmenda,
    qtdEmendas,
    perdaEmendas: Number(perdaEmendas.toFixed(2)),
    margemProjeto: Number(margemProjeto.toFixed(1)),
    perdaTotal: Number(perdaTotal.toFixed(2)),
    budgetTransceiver: Number(budgetTransceiver.toFixed(1)),
    saldoBudget: Number(saldoBudget.toFixed(2)),
    aprovado
  };
}

function calcularBackbone() {
  const pavimentosBackbone = readFloorValues(
    document.getElementById("pavimentos-backbone"),
    ["backbones"],
  );
  const medidaLance = Number(document.getElementById("medida-bb").value) || 0;
  const paresFO = Number(document.getElementById("pares-fo").value) || 0;
  const tipoFibra = document.getElementById("tipo-fo").value;
  const caracteristicaFibra = document.getElementById("caracteristica-fo").value.replace(/\(obsoleto\)/g, "").trim();
  const tipoEmenda = document.getElementById("tipo-emenda-bb") ? document.getElementById("tipo-emenda-bb").value : "fusao";

  const pavimentosDetalhados = pavimentosBackbone.map((floor, idx) => {
    const lances = parseInt(floor.backbones, 10) || 0;
    const metrosLance = Math.ceil(lances * medidaLance * 1.2);
    return {
      andar: `P${idx + 1}`,
      lances,
      metrosLance
    };
  });

  const somaBackbones = pavimentosDetalhados.reduce((sum, floor) => sum + floor.lances, 0);
  const qtdCabos = Math.ceil(somaBackbones * medidaLance * 1.2);

  const pigtail = Number(document.getElementById("acc-pigtail").value) || 0;
  const dio = Number(document.getElementById("acc-dio").value) || 0;
  const adaptador = Number(document.getElementById("acc-adaptador").value) || 0;
  const bandejaEmenda = Number(document.getElementById("acc-bandeja").value) || 0;
  const cordaoOptico = Number(document.getElementById("acc-cordao").value) || 0;
  const roloAbracadeiras = Math.ceil((qtdCabos * 0.15) / 5) || 1;

  const orcamentoPerda = calcularPerdaOptica(medidaLance, tipoFibra, caracteristicaFibra, tipoEmenda);

  return {
    qtdCabos,
    somaBackbones,
    medidaLance,
    pavimentosDetalhados,
    pigtail,
    dio,
    adaptador,
    bandejaEmenda,
    cordaoOptico,
    tipoEmenda,
    fibra: {
      especificacao: tipoFibra,
      caracteristica: caracteristicaFibra,
      pares: paresFO
    },
    misc: {
      roloAbracadeiras
    },
    orcamentoPerda
  };
}

function calcularBackbonePrimario() {
  const qtdBackbones = Number(document.getElementById("qtd-bb-pri").value) || 0;
  const medida = Number(document.getElementById("medida-bb-pri").value) || 0;
  const pares = Number(document.getElementById("pares-fo-pri").value) || 0;
  const tipoFibra = document.getElementById("tipo-fo-pri").value;
  const caracteristicaFibra = document.getElementById("caracteristica-fo-pri").value.replace(/\(obsoleto\)/g, "").trim();
  const tipoEmenda = document.getElementById("tipo-emenda-pri") ? document.getElementById("tipo-emenda-pri").value : "fusao";

  const orcamentoPerda = calcularPerdaOptica(medida, tipoFibra, caracteristicaFibra, tipoEmenda);

  return {
    qtdCabos: Math.ceil(qtdBackbones * medida * 1.2),
    qtdBackbones,
    medida,
    pigtail: Number(document.getElementById("acc-pri-pigtail").value) || 0,
    dio: Number(document.getElementById("acc-pri-dio").value) || 0,
    adaptador: Number(document.getElementById("acc-pri-adaptador").value) || 0,
    bandejaEmenda: Number(document.getElementById("acc-pri-bandeja").value) || 0,
    cordaoOptico: Number(document.getElementById("acc-pri-cordao").value) || 0,
    tipoEmenda,
    fibra: {
      especificacao: tipoFibra,
      caracteristica: caracteristicaFibra,
      pares
    },
    orcamentoPerda
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

  const totaisServicos = { dados: 0, voz: 0, cftv: 0, wifi: 0, outro: 0 };

  const pavimentosMH = pavimentosMHInput.map((pavimento, idx) => {
    const dados = Number(pavimento["dados"]) || 0;
    const voz = Number(pavimento["voz"]) || 0;
    const cftv = Number(pavimento["CFTV"]) || 0;
    const wifi = Number(pavimento["Wi-Fi"]) || 0;
    const outro = Number(pavimento["outro"]) || 0;

    totaisServicos.dados += dados;
    totaisServicos.voz += voz;
    totaisServicos.cftv += cftv;
    totaisServicos.wifi += wifi;
    totaisServicos.outro += outro;

    const pontosTelecom = dados + voz + cftv + wifi + outro;
    // Premissa oficial: cada ponto de telecom possui 2 pontos de rede (2 cabos permanentes com 20% de folga: 2 * 1.20 = 2.4)
    const qtdCabo = Math.ceil(pontosTelecom * medidaMH * 2.4);

    return {
      andar: `P${idx + 1}`,
      dados,
      voz,
      cftv,
      wifi,
      outro,
      pontosTelecom,
      qtdCabo
    };
  });

  const pontosTelecomTotal = pavimentosMH.reduce((sum, p) => sum + p.pontosTelecom, 0);
  const metrosTotal = pavimentosMH.reduce((sum, p) => sum + p.qtdCabo, 0);
  const qtdCaboTotal = {
    metros: metrosTotal,
    caixas: Math.ceil(metrosTotal / 305)
  };

  // 2 cabos flexíveis por ponto de telecom (1 por tomada RJ-45)
  const patchCable = pontosTelecomTotal * 2;
  const rackSeq = Number(document.getElementById("seq-rack").value) || 0;
  const patchPanelSeq = Number(document.getElementById("seq-patch-panel").value) || 0;
  const organizadorSeq = Number(document.getElementById("seq-organizador").value) || 0;
  const patchCordSeq = Number(document.getElementById("seq-patch-cords").value) || 0;
  const switchSeq = Number(document.getElementById("seq-switch").value) || 0;
  const roteadorSeq = Number(document.getElementById("seq-roteadores").value) || 0;
  const nobreak2USeq = Number(document.getElementById("seq-nobreaks-2u").value) || 0;
  const nobreak3USeq = Number(document.getElementById("seq-nobreaks-3u").value) || 0;
  const bandeja1USeq = Number(document.getElementById("seq-bandeja-1u").value) || 0;
  const bandeja2USeq = Number(document.getElementById("seq-bandeja-2u").value) || 0;

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
  const nobreakSet = Number(document.getElementById("set-nobreaks").value) || 0;
  const bandejaSet = Number(document.getElementById("set-bandeja").value) || 0;

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

  // Premissa oficial Prof. Adelson: 3 etiquetas por ponto (1 no espelho e 1 em cada cabo permanente)
  const etiqueta = pontosTelecomTotal * 3;
  const espelho = pontosTelecomTotal; // 1 espelho duplo por ponto de telecom
  const keystone = pontosTelecomTotal * 2; // 2 tomadas RJ-45 por ponto
  const misc = {
    etiqueta,
    espelho,
    keystone
  };

  return {
    categoriaCabo,
    medidaMH,
    pavimentosMH,
    totaisServicos,
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

  let miscHtml = `<h3>Miscelânea e Consumíveis</h3>
  <table id="tabelaMisc">
    <thead>
      <tr>
        <th></th>
        <th>Descrição</th>
        <th>Quantidade</th>
        <th>Unidade</th>
      </tr>
    </thead>
    <tbody>`;
  let miscCont = 0;

  if (escopo === "backbone" || escopo === "ambos") {
    const dadosBackbone = calcularBackbone();
    const primarioAtivo = document.getElementById("bb-primario").checked;

    // 1. Tabela de Lances do Backbone Secundário por Andar
    let htmlLances = `<h3>Backbone Secundário — Distribuição por Pavimento</h3>
    <table id="tabelaBackbonePavimentos">
      <thead>
        <tr>
          <th>Pavimento</th>
          <th>Lances de Backbone</th>
          <th>Pares de FO</th>
          <th>Comprimento Médio (m)</th>
          <th>Total de Cabo com Folga 20% (m)</th>
        </tr>
      </thead>
      <tbody>`;
    dadosBackbone.pavimentosDetalhados.forEach((p) => {
      htmlLances += `<tr>
        <td>${p.andar}</td>
        <td>${p.lances}</td>
        <td>${dadosBackbone.fibra.pares} pares</td>
        <td>${dadosBackbone.medidaLance} m</td>
        <td>${p.metrosLance} m</td>
      </tr>`;
    });
    htmlLances += `<tr style="font-weight: bold; background: #e9f1fa;">
      <td>TOTAL GERAL</td>
      <td>${dadosBackbone.somaBackbones} lances</td>
      <td>${dadosBackbone.fibra.pares} pares (${dadosBackbone.fibra.pares * 2} fibras)</td>
      <td>-</td>
      <td>${dadosBackbone.qtdCabos} m</td>
    </tr></tbody></table>`;
    planilha.innerHTML += htmlLances;

    // 2. Tabela de Materiais do Backbone Secundário
    let html = `<h3>${primarioAtivo ? "Materiais do Backbone Secundário (Vertical / Interno)" : "Materiais do Backbone Óptico"}</h3>
    <table id="tabelaBackbone">
      <thead>
        <tr><th></th><th>Descrição</th><th>Quantidade</th><th>Unidade</th></tr>
      </thead>
      <tbody>`;
    let cont = 0;
    if (dadosBackbone.qtdCabos > 0) {
      cont++;
      html += `<tr><td>${cont}</td><td>Cabo óptico (${dadosBackbone.fibra.especificacao} ${dadosBackbone.fibra.caracteristica}) - ${dadosBackbone.fibra.pares} pares (com 20% de folga)</td><td>${dadosBackbone.qtdCabos}</td><td>m</td></tr>`;
    }
    if (dadosBackbone.dio > 0) {
      cont++;
      html += `<tr><td>${cont}</td><td>DIO 24 portas (1U)</td><td>${dadosBackbone.dio}</td><td>un.</td></tr>`;
    }
    if (dadosBackbone.bandejaEmenda > 0) {
      cont++;
      html += `<tr><td>${cont}</td><td>Bandeja de emenda óptica (1U - 24 fusões)</td><td>${dadosBackbone.bandejaEmenda}</td><td>un.</td></tr>`;
    }
    if (dadosBackbone.adaptador > 0) {
      cont++;
      html += `<tr><td>${cont}</td><td>Adaptador óptico duplo</td><td>${dadosBackbone.adaptador}</td><td>un.</td></tr>`;
    }
    if (dadosBackbone.pigtail > 0) {
      cont++;
      html += `<tr><td>${cont}</td><td>Pigtail conectorizado SC (${dadosBackbone.fibra.especificacao} ${dadosBackbone.fibra.caracteristica})</td><td>${dadosBackbone.pigtail}</td><td>un.</td></tr>`;
    }
    if (dadosBackbone.cordaoOptico > 0) {
      cont++;
      html += `<tr><td>${cont}</td><td>Cordão óptico duplex</td><td>${dadosBackbone.cordaoOptico}</td><td>un.</td></tr>`;
    }
    html += `</tbody></table>`;
    planilha.innerHTML += html;

    // 3. Tabela de Orçamento de Perda Óptica do Backbone Secundário
    const pOpt = dadosBackbone.orcamentoPerda;
    let htmlPerda = `<h3>Orçamento de Perda Óptica (Power Budget) — Backbone Secundário</h3>
    <table id="tabelaPerdaBackbone">
      <thead>
        <tr><th>Parâmetro</th><th>Valor de Referência / Quantidade</th><th>Atenuação Estimada (dB)</th></tr>
      </thead>
      <tbody>
        <tr><td>Lance de Fibra (${dadosBackbone.fibra.especificacao} ${dadosBackbone.fibra.caracteristica})</td><td>${pOpt.comprimentoMetros} m @ ${pOpt.atenuacaoKm} dB/km</td><td>${pOpt.perdaCabo} dB</td></tr>
        <tr><td>Conexões Conectorizadas no DIO (Pigtails e Cordões SC)</td><td>${pOpt.qtdConectores} conexões @ ${pOpt.perdaConectorUnit} dB/conector</td><td>${pOpt.perdaConectores} dB</td></tr>
        <tr><td>Emendas Ópticas de Terminação (${pOpt.tipoEmenda === "fusao" ? "Fusão por Arco Voltaico" : "Emenda Mecânica"})</td><td>${pOpt.qtdEmendas} emendas de pigtails @ ${pOpt.perdaEmendaUnit} dB/emenda</td><td>${pOpt.perdaEmendas} dB</td></tr>
        <tr><td>Margem de Segurança de Projeto</td><td>Norma de engenharia / degradação</td><td>${pOpt.margemProjeto} dB</td></tr>
        <tr style="font-weight: bold; background: #e9f1fa;"><td>ATENUAÇÃO TOTAL ESTIMADA</td><td>Soma das perdas do canal</td><td>${pOpt.perdaTotal} dB</td></tr>
        <tr><td>Budget Óptico do Transceiver</td><td>Margem típica de equipamento</td><td>${pOpt.budgetTransceiver} dB</td></tr>
        <tr style="font-weight: bold; background: ${pOpt.aprovado ? "#e6f4ea" : "#fce8e6"}; color: ${pOpt.aprovado ? "#137333" : "#c5221f"};">
          <td>STATUS DO ENLACE ÓPTICO</td>
          <td>${pOpt.aprovado ? "VIÁVEL / APROVADO (Margem de segurança mantida)" : "ALERTA: Perda estimada excede o budget"}</td>
          <td>Saldo: ${pOpt.saldoBudget} dB</td>
        </tr>
      </tbody>
    </table>
    <div class="nota-tecnica">
      <strong>Critério de Conectores e Emendas:</strong> Os pigtails e cordões ópticos já vêm conectorizados de fábrica (conector SC), dispensando conectores avulsos na compra. As emendas ocorrem exclusivamente nas terminações de cada lance de fibra nos DIOs (fusão do pigtail à fibra do cabo). Redes locais prediais utilizam lances contínuos sem emendas intermediárias de rota.
    </div>`;
    planilha.innerHTML += htmlPerda;

    // 4. Se tiver Backbone Primário (entre prédios)
    if (primarioAtivo) {
      const p = calcularBackbonePrimario();
      let htmlP = `<h3>Backbone Primário (Interligação entre Prédios — Ponto a Ponto Completo)</h3>
      <p style="text-align: center; color: var(--muted); font-size: 0.88rem; margin: -0.25rem 0 1rem;">Quantifica os cabos e todos os acessórios ponto a ponto de ambas as extremidades (edificação local e edificação remota).</p>
      <table id="tabelaBackbonePrimario">
        <thead>
          <tr><th></th><th>Descrição</th><th>Quantidade</th><th>Unidade</th></tr>
        </thead>
        <tbody>`;
      let contP = 0;
      if (p.qtdCabos > 0) {
        contP++;
        htmlP += `<tr><td>${contP}</td><td>Cabo óptico primário (${p.fibra.especificacao} ${p.fibra.caracteristica}) - ${p.fibra.pares} pares (com 20% folga)</td><td>${p.qtdCabos}</td><td>m</td></tr>`;
      }
      if (p.dio > 0) {
        contP++;
        htmlP += `<tr><td>${contP}</td><td>DIO 24 portas (1U)</td><td>${p.dio}</td><td>un.</td></tr>`;
      }
      if (p.bandejaEmenda > 0) {
        contP++;
        htmlP += `<tr><td>${contP}</td><td>Bandeja de emenda óptica (1U - 24 fusões)</td><td>${p.bandejaEmenda}</td><td>un.</td></tr>`;
      }
      if (p.adaptador > 0) {
        contP++;
        htmlP += `<tr><td>${contP}</td><td>Adaptador óptico duplo</td><td>${p.adaptador}</td><td>un.</td></tr>`;
      }
      if (p.pigtail > 0) {
        contP++;
        htmlP += `<tr><td>${contP}</td><td>Pigtail conectorizado SC (${p.fibra.especificacao} ${p.fibra.caracteristica})</td><td>${p.pigtail}</td><td>un.</td></tr>`;
      }
      if (p.cordaoOptico > 0) {
        contP++;
        htmlP += `<tr><td>${contP}</td><td>Cordão óptico duplex</td><td>${p.cordaoOptico}</td><td>un.</td></tr>`;
      }
      htmlP += `</tbody></table>`;
      planilha.innerHTML += htmlP;

      // Orçamento de perda do Primário
      const pOptPri = p.orcamentoPerda;
      let htmlPerdaPri = `<h3>Orçamento de Perda Óptica (Power Budget) — Backbone Primário</h3>
      <table id="tabelaPerdaBackbonePrimario">
        <thead>
          <tr><th>Parâmetro</th><th>Valor de Referência / Quantidade</th><th>Atenuação Estimada (dB)</th></tr>
        </thead>
        <tbody>
          <tr><td>Lance Primário (${p.fibra.especificacao} ${p.fibra.caracteristica})</td><td>${pOptPri.comprimentoMetros} m @ ${pOptPri.atenuacaoKm} dB/km</td><td>${pOptPri.perdaCabo} dB</td></tr>
          <tr><td>Conexões Conectorizadas no DIO (Pigtails e Cordões SC)</td><td>${pOptPri.qtdConectores} conexões @ ${pOptPri.perdaConectorUnit} dB/conector</td><td>${pOptPri.perdaConectores} dB</td></tr>
          <tr><td>Emendas Ópticas de Terminação (${pOptPri.tipoEmenda === "fusao" ? "Fusão por Arco Voltaico" : "Emenda Mecânica"})</td><td>${pOptPri.qtdEmendas} emendas de pigtails @ ${pOptPri.perdaEmendaUnit} dB/emenda</td><td>${pOptPri.perdaEmendas} dB</td></tr>
          <tr><td>Margem de Segurança de Projeto</td><td>Norma de engenharia / degradação</td><td>${pOptPri.margemProjeto} dB</td></tr>
          <tr style="font-weight: bold; background: #e9f1fa;"><td>ATENUAÇÃO TOTAL ESTIMADA</td><td>Soma das perdas do enlace primário</td><td>${pOptPri.perdaTotal} dB</td></tr>
          <tr><td>Budget Óptico do Transceiver</td><td>Margem típica de equipamento</td><td>${pOptPri.budgetTransceiver} dB</td></tr>
          <tr style="font-weight: bold; background: ${pOptPri.aprovado ? "#e6f4ea" : "#fce8e6"}; color: ${pOptPri.aprovado ? "#137333" : "#c5221f"};">
            <td>STATUS DO ENLACE PRIMÁRIO</td>
            <td>${pOptPri.aprovado ? "VIÁVEL / APROVADO (Margem de segurança mantida)" : "ALERTA: Perda estimada excede o budget"}</td>
            <td>Saldo: ${pOptPri.saldoBudget} dB</td>
          </tr>
        </tbody>
      </table>`;
      planilha.innerHTML += htmlPerdaPri;
    }

    if (dadosBackbone.misc.roloAbracadeiras > 0) {
      miscCont++;
      miscHtml += `<tr><td>${miscCont}</td><td>Rolo de abraçadeiras dupla face (5 metros)</td><td>${dadosBackbone.misc.roloAbracadeiras}</td><td>un.</td></tr>`;
    }
  }

  if (escopo === "mh" || escopo === "ambos") {
    const dadosMH = calcularMH();

    // 1. Tabela Detalhada de Pontos por Pavimento e Serviço
    let htmlPontos = `<h3>Malha Horizontal — Detalhamento de Pontos por Serviço e Pavimento</h3>
    <table id="tabelaMHPavimentos">
      <thead>
        <tr>
          <th>Pavimento</th>
          <th>Dados</th>
          <th>Voz</th>
          <th>CFTV</th>
          <th>Wi-Fi</th>
          <th>Outro</th>
          <th>Total Pontos</th>
          <th>Cabo ${dadosMH.categoriaCabo} (m)</th>
        </tr>
      </thead>
      <tbody>`;
    dadosMH.pavimentosMH.forEach((p) => {
      htmlPontos += `<tr>
        <td>${p.andar}</td>
        <td>${p.dados}</td>
        <td>${p.voz}</td>
        <td>${p.cftv}</td>
        <td>${p.wifi}</td>
        <td>${p.outro}</td>
        <td>${p.pontosTelecom}</td>
        <td>${p.qtdCabo} m</td>
      </tr>`;
    });
    htmlPontos += `<tr style="font-weight: bold; background: #e9f1fa;">
      <td>TOTAL GERAL</td>
      <td>${dadosMH.totaisServicos.dados}</td>
      <td>${dadosMH.totaisServicos.voz}</td>
      <td>${dadosMH.totaisServicos.cftv}</td>
      <td>${dadosMH.totaisServicos.wifi}</td>
      <td>${dadosMH.totaisServicos.outro}</td>
      <td>${dadosMH.pontosTelecomTotal} pontos</td>
      <td>${dadosMH.qtdCaboTotal.metros} m</td>
    </tr></tbody></table>`;
    planilha.innerHTML += htmlPontos;

    // 2. Tabela de Quantificação de Cabos e Materiais de MH
    let html = `<h3>Quantificação de Cabos da Malha Horizontal</h3>
    <table id="tabelaMH">
      <thead><tr><th></th><th>Descrição</th><th>Quantidade</th><th>Unidade</th></tr></thead>
      <tbody>`;
    let cont = 0;
    if (dadosMH.qtdCaboTotal.metros > 0) {
      for (let i = 0; i < dadosMH.pavimentosMH.length; i++) {
        cont++;
        html += `<tr><td>${cont}</td><td>Cabo UTP ${dadosMH.categoriaCabo} no pavimento ${i + 1} (${dadosMH.pavimentosMH[i].pontosTelecom * 2} lances com 20% folga)</td><td>${dadosMH.pavimentosMH[i].qtdCabo}</td><td>m</td></tr>`;
      }
      cont++;
      html += `<tr style="font-weight: 600;"><td>${cont}</td><td>Cabo UTP ${dadosMH.categoriaCabo} Total (${dadosMH.qtdCaboTotal.metros} m)</td><td>${dadosMH.qtdCaboTotal.caixas}</td><td>cx (305 m)</td></tr>`;
    }
    if (dadosMH.patchCable > 0) {
      cont++;
      html += `<tr><td>${cont}</td><td>Patch Cable RJ45 flexível (Área de Trabalho — 2 por ponto de telecom)</td><td>${dadosMH.patchCable}</td><td>un. (1.5m)</td></tr>`;
    }
    html += `</tbody></table>
    <div class="nota-tecnica">
      <strong>Memória de Cálculo da MH:</strong> Conforme diretriz do projeto (Prof. Adelson), cada ponto de telecomunicação é composto por 2 pontos de rede (2 lances de cabo permanente com 20% de folga: 2 x 1.20 = 2.4x distância básica). Para a identificação, quantificam-se 3 etiquetas por ponto de telecomunicação (1 no espelho duplo e 1 em cada cabo permanente).
    </div>`;
    planilha.innerHTML += html;

    // 3. Equipamentos SEQ
    if (
      dadosMH.seq.organizador > 0 ||
      dadosMH.seq.patchCords > 0 ||
      dadosMH.seq.rack > 0 ||
      dadosMH.seq.switchs > 0 ||
      dadosMH.seq.patchPanel > 0 ||
      dadosMH.seq.roteador > 0 ||
      dadosMH.seq.nobreak2U > 0 ||
      dadosMH.seq.nobreak3U > 0
    ) {
      cont = 0;
      html = `<h4>Equipamentos da Sala de Equipamentos (SEQ)</h4>
      <table id="tabelaSEQ"><thead><tr><th></th><th>Descrição</th><th>Quantidade</th><th>Unidade</th></tr></thead><tbody>`;
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
      if (dadosMH.seq.organizador > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Organizador de cabos (1U)</td><td>${dadosMH.seq.organizador}</td><td>un.</td></tr>`;
      }
      if (dadosMH.seq.patchCords > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Patch Cord RJ45 ${dadosMH.categoriaCabo} (1.5m)</td><td>${dadosMH.seq.patchCords}</td><td>un.</td></tr>`;
      }
      if (dadosMH.seq.roteador > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Roteador (1U)</td><td>${dadosMH.seq.roteador}</td><td>un.</td></tr>`;
      }
      if (dadosMH.seq.nobreak2U > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Nobreak (2U)</td><td>${dadosMH.seq.nobreak2U}</td><td>un.</td></tr>`;
      }
      if (dadosMH.seq.nobreak3U > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Nobreak (3U)</td><td>${dadosMH.seq.nobreak3U}</td><td>un.</td></tr>`;
      }
      html += `</tbody></table>`;
      planilha.innerHTML += html;
    }

    // 4. Equipamentos SET
    if (
      dadosMH.set.organizador > 0 ||
      dadosMH.set.patchCords > 0 ||
      dadosMH.set.rack > 0 ||
      dadosMH.set.switchs > 0 ||
      dadosMH.set.patchPanel > 0 ||
      dadosMH.set.nobreak > 0
    ) {
      html = `<h4>Equipamentos da Sala de Telecomunicações (SET)</h4>
      <table id="tabelaSET"><thead><tr><th></th><th>Descrição</th><th>Quantidade</th><th>Unidade</th></tr></thead><tbody>`;
      cont = 0;
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
      if (dadosMH.set.organizador > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Organizador de cabos (1U)</td><td>${dadosMH.set.organizador}</td><td>un.</td></tr>`;
      }
      if (dadosMH.set.patchCords > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Patch Cord RJ45 ${dadosMH.categoriaCabo} (1.5m)</td><td>${dadosMH.set.patchCords}</td><td>un.</td></tr>`;
      }
      if (dadosMH.set.nobreak > 0) {
        cont++;
        html += `<tr><td>${cont}</td><td>Nobreak (1U)</td><td>${dadosMH.set.nobreak}</td><td>un.</td></tr>`;
      }
      html += `</tbody></table>`;
      planilha.innerHTML += html;
    }

    // 5. Miscelânea MH
    if (dadosMH.misc.etiqueta > 0) {
      miscCont++;
      miscHtml += `<tr><td>${miscCont}</td><td>Pacote com 50 etiquetas de identificação (${dadosMH.misc.etiqueta} etiquetas: 3 por ponto)</td><td>${Math.ceil(dadosMH.misc.etiqueta / 50)}</td><td>pct (50 un)</td></tr>`;
    }
    if (dadosMH.misc.espelho > 0) {
      miscCont++;
      miscHtml += `<tr><td>${miscCont}</td><td>Espelho RJ45 duplo (Área de Trabalho — 1 por ponto)</td><td>${dadosMH.misc.espelho}</td><td>un.</td></tr>`;
    }
    if (dadosMH.misc.keystone > 0) {
      miscCont++;
      miscHtml += `<tr><td>${miscCont}</td><td>Conector Keystone RJ45 fêmea ${dadosMH.categoriaCabo} (2 por ponto)</td><td>${dadosMH.misc.keystone}</td><td>un.</td></tr>`;
    }
    const bandejas1U = dadosMH.set.misc.bandeja + dadosMH.seq.misc.bandeja1u;
    if (bandejas1U > 0) {
      miscCont++;
      miscHtml += `<tr><td>${miscCont}</td><td>Bandeja fixa para rack (1U)</td><td>${bandejas1U}</td><td>un.</td></tr>`;
    }
    if (dadosMH.seq.misc.bandeja2u > 0) {
      miscCont++;
      miscHtml += `<tr><td>${miscCont}</td><td>Bandeja fixa para rack (2U)</td><td>${dadosMH.seq.misc.bandeja2u}</td><td>un.</td></tr>`;
    }
  }

  if (miscCont > 0) {
    miscHtml += `</tbody></table>`;
    planilha.innerHTML += miscHtml;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderPlanilha();
  btnExportar.disabled = false;
  resultado.scrollIntoView({ behavior: "smooth" });
});

btnExportar.addEventListener("click", () => {
  let csv = [];

  const tConfig = [
    { id: "tabelaBackbonePavimentos", title: "Backbone Secundário - Distribuição por Pavimento" },
    { id: "tabelaBackbone", title: "Materiais do Backbone Secundário" },
    { id: "tabelaPerdaBackbone", title: "Orçamento de Perda Óptica (Power Budget) - Backbone Secundário" },
    { id: "tabelaBackbonePrimario", title: "Backbone Primário (Interligação entre Prédios)" },
    { id: "tabelaPerdaBackbonePrimario", title: "Orçamento de Perda Óptica (Power Budget) - Backbone Primário" },
    { id: "tabelaMHPavimentos", title: "Malha Horizontal - Detalhamento de Pontos por Serviço e Pavimento" },
    { id: "tabelaMH", title: "Quantificação de Cabos da Malha Horizontal" },
    { id: "tabelaSEQ", title: "Equipamentos da Sala de Equipamentos (SEQ)" },
    { id: "tabelaSET", title: "Equipamentos da Sala de Telecomunicações (SET)" },
    { id: "tabelaMisc", title: "Miscelânea e Consumíveis" }
  ];

  tConfig.forEach((config) => {
    let table = document.getElementById(config.id);
    if (!table) return;

    if (csv.length > 0) {
      csv.push("");
      csv.push("");
    }
    const h = table.previousElementSibling;
    const titulo = h && /^H[34]$/.test(h.tagName) ? h.innerText : config.title;
    csv.push('"' + titulo.replace(/"/g, '""') + '"');

    table.querySelectorAll("tr").forEach((row) => {
      let rowData = [];
      row.querySelectorAll("td, th").forEach((col) => {
        let text = col.innerText.replace(/"/g, '""').trim();
        rowData.push('"' + text + '"');
      });
      csv.push(rowData.join(";"));
    });
  });

  let blob = new Blob(["\uFEFF" + csv.join("\n")], { type: "text/csv;charset=utf-8;" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "planilha_quantificacao_materiais.csv";
  link.click();
  URL.revokeObjectURL(link.href);
});
