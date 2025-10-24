interface DevizData {
  numarInmatriculare: string
  date: string
  data: {
    materiale: Array<{ material: string; cantitate: number; pret: number }>
    lucrari: Array<{ lucrare: string; pret: number }>
    marcaAuto?: string
    modelAuto?: string
    motorizare?: string
    anFabricatie?: string
    kilometri?: string
    serieSasiu?: string
    dataIntrare?: string
    numeProprietar?: string
    numarTelefon?: string
    includeTVA?: boolean
  }
}

interface IstoricData {
  numarInmatriculare: string
  entries: Array<{
    date: string
    data: {
      materiale: Array<{ material: string; cantitate: number; pret: number }>
      lucrari: Array<{ lucrare: string; pret: number }>
      marcaAuto?: string
      modelAuto?: string
      motorizare?: string
      anFabricatie?: string
      kilometri?: string
      serieSasiu?: string
      dataIntrare?: string
      numeProprietar?: string
      numarTelefon?: string
      includeTVA?: boolean
    }
  }>
}

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Comandă Service Auto</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 10px;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 9pt;
      color: black;
      background: transparent;
      margin: 10px;
    }

    .header {
      border: 2px solid black;
      padding: 5px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .header-left h1 {
      font-size: 20pt;
      font-weight: bold;
      margin: 0;
    }

    .header-left p {
      font-size: 10pt;
      margin: 2px 0 0 0;
    }

    .header-right {
      text-align: right;
      font-size: 9pt;
      line-height: 1.4;
    }

    .order-info {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      font-size: 9pt;
    }

    .section-title {
      background: transparent;
      border: 2px solid black;
      border-collapse: collapse;
      padding: 3px 8px;
      font-weight: bold;
      font-size: 10pt;
      margin-top: 8px;
    }

    .vehicle-info {
      border: 2px solid black;
      border-top: none;
      border-collapse: collapse;
      padding: 5px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2px 20px;
      font-size: 9pt;
    }

    .vehicle-info div {
      padding: 2px 0;
    }

    .vehicle-info strong {
      font-weight: bold;
    }

    table {
      width: 100%;
      border: 2px solid black;
      border-top: none;
      border-right: none;
      border-collapse: collapse;
      margin-top: 0;
      font-size: 9pt;
    }

    table th {
      border: 2px solid black;
      border-top: none;
      border-bottom: 2px solid black;
      border-collapse: collapse;
      padding: 3px 8px;
      text-align: left;
      font-weight: bold;
      background: transparent;
    }

    table th.center {
      text-align: center;
    }

    table th.right {
      text-align: right;
    }

    table td {
      border: 1px solid black;
      border-right: 2px solid black;
      border-collapse: collapse;
      padding: 3px 8px;
      background: transparent;
      font-size: 8pt;
    }

    table td.center {
      text-align: center;
    }

    table td.right {
      text-align: right;
    }

    .totals-section {
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      gap: 20px;
    }

    .totals-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .totals-right {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 350px;
    }

    .total-row {
      display: flex;
      border: 2px solid black;
      font-size: 9pt;
    }
    
    .total-row-right .total-value-right:last-of-type {
      border-left: 2px solid black;
    }

    .total-row.grand {
      border: 2px solid black;
      font-weight: bold;
      font-size: 10pt;
    }

    .total-label {
      flex: 1;
      padding: 3px 8px;
      border-right: 2px solid black;
    }

    .total-value {
      padding: 3px 8px;
      text-align: right;
      min-width: 80px;
    }

    .total-row-right {
      display: flex;
      border: 2px solid black;
      font-size: 9pt;
    }

    .total-row-right.grand {
      border: 2px solid black;
      font-weight: bold;
      font-size: 10pt;
    }

    .total-label-right {
      flex: 1;
      padding: 3px 8px;
      font-weight: bold;
    }

    .total-value-right {
      padding: 3px 8px;
      text-align: right;
      min-width: 100px;
    }

    .total-currency {
      padding: 3px 8px;
      min-width: 60px;
      font-weight: bold;
      border-left: 2px solid black;
    }

    .signatures {
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .warranty-box {
      border: 2px solid black;
      padding: 5px;
      margin-top: 10px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .warranty-title {
      font-weight: bold;
      margin-bottom: 6px;
      font-size: 9pt;
    }

    .warranty-text {
      font-size: 7pt;
      line-height: 1;
      margin-bottom: 4px;
    }

    .warranty-text ul {
      margin: 4px 0 4px 20px;
    }

    .warranty-text li {
      margin: 3px 0;
    }

    .client-section {
      margin-top: 8px;
      font-size: 8pt;
    }

    .note-section {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid black;
      font-size: 8pt;
      font-weight: bold;
    }

    @media print {
      body {
        margin: 10px;
      }
      
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      <h1>EXTREME SERVICE</h1>
      <p>Tel: 0753 767 116</p>
    </div>
    <div class="header-right">
      J12/199/2008<br>
      RO23091377<br>
      Str. Al. Vlahuță<br>
      Nr. 30-23, Cluj-Napoca
    </div>
  </div>

  <div class="order-info">
    <span>Comandă nr:______________</span>
    <span>Data:_________/_________/_________</span>
  </div>

  <div class="section-title">INFORMAȚII VEHICUL</div>
  <div class="vehicle-info">
    <div>Număr înmatriculare: <strong>{{numarInmatriculare}}</strong></div>
    <div>Marcă Auto: <strong>{{marcaAuto}}</strong></div>
    <div>Model Auto: <strong>{{modelAuto}}</strong></div>
    <div>Motorizare: <strong>{{motorizare}}</strong></div>
    <div>An fabricație: <strong>{{anFabricatie}}</strong></div>
    <div>Kilometri: <strong>{{kilometri}}</strong></div>
    <div>Serie șasiu: <strong>{{serieSasiu}}</strong></div>
    <div>Data intrare service: <strong>{{dataIntrare}}</strong></div>
    <div>Nume proprietar: <strong>{{numeProprietar}}</strong></div>
    <div>Număr telefon: <strong>{{numarTelefon}}</strong></div>
  </div>

  <div class="section-title">DETALIERE MATERIALE</div>
  <table>
    <thead>
      {{materialeTableHeader}}
    </thead>
    <tbody>
      {{materialeRows}}
    </tbody>
  </table>

  <div class="section-title" style="margin-top: 10px;">DETALIERE MANOPERĂ</div>
  <table>
    <thead>
      {{lucrariTableHeader}}
    </thead>
    <tbody>
      {{lucrariRows}}
    </tbody>
  </table>

  {{totalsSection}}

  <div class="signatures">
    <span><strong>Verificat reparație: Suciu Dan</strong></span>
    <span>Semnătură: ______________________</span>
  </div>

  <div style="margin-top: 8px; font-size: 8pt;">
    Am preluat vehiculul cu lucrările executate conform foii de comandă și cu inventarul complet.
  </div>
  <div style="margin-top: 4px; font-size: 8pt;">
    <strong>Semnătură client: ______________________</strong>
  </div>

  <div class="warranty-box">
    <div class="warranty-title">CERTIFICAT DE CALITATE ȘI GARANȚIE:</div>
    <div class="warranty-text">
      Unitatea noastră garantează lucrările de reparații executate după cum urmează:
      <ul>
        <li>3 luni de la data recepției vehiculului dacă lucrarea de reparații nu a necesitat înlocuiri de piese sau dacă lucrarea s-a executat cu piesa clientului.</li>
        <li>24 luni pentru piesele furnizate de unitate, conform legii nr.449/2003.</li>
      </ul>
    </div>
    <div class="note-section">
      Notă: Unitatea noastră nu este răspunzătoare pentru obiectele personale lăsate în autovehicul.<br>
      Garanția este condiționată de utilizarea în exploatare a autovehiculului conform prescripțiilor constructorului.
    </div>
  </div>

</body>
</html>
`

export function generateDevizHTML(data: DevizData): string {
  const materiale = data.data?.materiale || []
  const lucrari = data.data?.lucrari || []
  const includeTVA = data.data?.includeTVA !== false // Default to true if not specified

  const totalMateriale = materiale.reduce((sum, item) => sum + item.pret, 0)
  const totalLucrari = lucrari.reduce((sum, item) => sum + item.pret, 0)
  const pretTotal = totalMateriale + totalLucrari
  const tvaTotal = pretTotal * 0.21
  const grandTotal = includeTVA ? pretTotal + tvaTotal : pretTotal

  let materialeRows = ""
  materiale.forEach((item) => {
    const tva = item.pret * 0.21
    if (includeTVA) {
      materialeRows += `
      <tr>
        <td>${item.material}</td>
        <td class="center">${item.cantitate}</td>
        <td class="right">${item.pret.toFixed(2)}</td>
        <td class="right">${tva.toFixed(2)}</td>
      </tr>`
    } else {
      materialeRows += `
      <tr>
        <td>${item.material}</td>
        <td class="center">${item.cantitate}</td>
        <td class="right">${item.pret.toFixed(2)}</td>
      </tr>`
    }
  })

  let lucrariRows = ""
  lucrari.forEach((item) => {
    const tva = item.pret * 0.21
    if (includeTVA) {
      lucrariRows += `
      <tr>
        <td>${item.lucrare}</td>
        <td class="right">${item.pret.toFixed(2)}</td>
        <td class="right">${tva.toFixed(2)}</td>
      </tr>`
    } else {
      lucrariRows += `
      <tr>
        <td>${item.lucrare}</td>
        <td class="right">${item.pret.toFixed(2)}</td>
      </tr>`
    }
  })

  const materialeTableHeader = includeTVA
    ? `<tr>
        <th style="width: 70%;">MATERIALE</th>
        <th class="center" style="width: 6%;">CANT</th>
        <th class="right" style="width: 12%;">PREȚ</th>
        <th class="right" style="width: 12%;">TVA</th>
      </tr>`
    : `<tr>
        <th style="width: 76%;">MATERIALE</th>
        <th class="center" style="width: 12%;">CANT</th>
        <th class="right" style="width: 12%;">PREȚ</th>
      </tr>`

  const lucrariTableHeader = includeTVA
    ? `<tr>
        <th style="width: 76%;">LUCRĂRI</th>
        <th class="right" style="width: 12%;">PREȚ</th>
        <th class="right" style="width: 12%;">TVA</th>
      </tr>`
    : `<tr>
        <th style="width: 88%;">LUCRĂRI</th>
        <th class="right" style="width: 12%;">PREȚ</th>
      </tr>`

  const totalsSection = includeTVA
    ? `<div class="totals-section">
      <div class="totals-left">
        <div class="total-row">
          <div class="total-label">Total materiale:</div>
          <div class="total-value">${totalMateriale.toFixed(2)}</div>
        </div>
        <div class="total-row">
          <div class="total-label">Total manoperă:</div>
          <div class="total-value">${totalLucrari.toFixed(2)}</div>
        </div>
      </div>

      <div class="totals-right">
        <div class="total-row-right">
          <div class="total-label-right">PREȚ</div>
          <div class="total-value-right">${pretTotal.toFixed(2)}</div>
          <div class="total-currency">TVA</div>
          <div class="total-value-right">${tvaTotal.toFixed(2)}</div>
        </div>
        <div class="total-row-right grand">
          <div class="total-label-right">TOTAL</div>
          <div class="total-value-right" colspan="3">${grandTotal.toFixed(2)}</div>
        </div>
      </div>
    </div>`
    : `<div class="totals-section">
      <div class="totals-left">
        <div class="total-row">
          <div class="total-label">Total materiale:</div>
          <div class="total-value">${totalMateriale.toFixed(2)}</div>
        </div>
        <div class="total-row">
          <div class="total-label">Total manoperă:</div>
          <div class="total-value">${totalLucrari.toFixed(2)}</div>
        </div>
      </div>

      <div class="totals-right">
        <div class="total-row-right grand">
          <div class="total-label-right">TOTAL</div>
          <div class="total-value-right">${grandTotal.toFixed(2)}</div>
        </div>
      </div>
    </div>`

  const fullHTML = HTML_TEMPLATE.replace("{{materialeTableHeader}}", materialeTableHeader)
    .replace("{{materialeRows}}", materialeRows)
    .replace("{{lucrariTableHeader}}", lucrariTableHeader)
    .replace("{{lucrariRows}}", lucrariRows)
    .replace("{{totalsSection}}", totalsSection)
    .replace("{{numarInmatriculare}}", data.numarInmatriculare || "")
    .replace("{{marcaAuto}}", data.data?.marcaAuto || "")
    .replace("{{modelAuto}}", data.data?.modelAuto || "")
    .replace("{{motorizare}}", data.data?.motorizare || "")
    .replace("{{anFabricatie}}", data.data?.anFabricatie || "")
    .replace("{{kilometri}}", data.data?.kilometri || "")
    .replace("{{serieSasiu}}", data.data?.serieSasiu || "")
    .replace("{{dataIntrare}}", data.data?.dataIntrare || data.date || "")
    .replace("{{numeProprietar}}", data.data?.numeProprietar || "")
    .replace("{{numarTelefon}}", data.data?.numarTelefon || "")

  return fullHTML
}

export function generateIstoricHTML(data: IstoricData): string {
  let allEntriesHTML = ""

  data.entries.forEach((entry, index) => {
    const materiale = entry.data?.materiale || []
    const lucrari = entry.data?.lucrari || []
    const includeTVA = entry.data?.includeTVA !== false // Default to true if not specified

    const totalMateriale = materiale.reduce((sum, item) => sum + item.pret, 0)
    const totalLucrari = lucrari.reduce((sum, item) => sum + item.pret, 0)
    const pretTotal = totalMateriale + totalLucrari
    const tvaTotal = pretTotal * 0.21
    const grandTotal = includeTVA ? pretTotal + tvaTotal : pretTotal

    let materialeRows = ""
    materiale.forEach((item) => {
      const tva = item.pret * 0.21
      if (includeTVA) {
        materialeRows += `
        <tr>
          <td>${item.material}</td>
          <td class="center">${item.cantitate}</td>
          <td class="right">${item.pret.toFixed(2)}</td>
          <td class="right">${tva.toFixed(2)}</td>
        </tr>`
      } else {
        materialeRows += `
        <tr>
          <td>${item.material}</td>
          <td class="center">${item.cantitate}</td>
          <td class="right">${item.pret.toFixed(2)}</td>
        </tr>`
      }
    })

    let lucrariRows = ""
    lucrari.forEach((item) => {
      const tva = item.pret * 0.21
      if (includeTVA) {
        lucrariRows += `
        <tr>
          <td>${item.lucrare}</td>
          <td class="right">${item.pret.toFixed(2)}</td>
          <td class="right">${tva.toFixed(2)}</td>
        </tr>`
      } else {
        lucrariRows += `
        <tr>
          <td>${item.lucrare}</td>
          <td class="right">${item.pret.toFixed(2)}</td>
        </tr>`
      }
    })

    const materialeTableHeader = includeTVA
      ? `<tr>
          <th style="width: 70%;">MATERIALE</th>
          <th class="center" style="width: 6%;">CANT</th>
          <th class="right" style="width: 12%;">PREȚ</th>
          <th class="right" style="width: 12%;">TVA</th>
        </tr>`
      : `<tr>
          <th style="width: 76%;">MATERIALE</th>
          <th class="center" style="width: 12%;">CANT</th>
          <th class="right" style="width: 12%;">PREȚ</th>
        </tr>`

    const lucrariTableHeader = includeTVA
      ? `<tr>
          <th style="width: 76%;">LUCRĂRI</th>
          <th class="right" style="width: 12%;">PREȚ</th>
          <th class="right" style="width: 12%;">TVA</th>
        </tr>`
      : `<tr>
          <th style="width: 88%;">LUCRĂRI</th>
          <th class="right" style="width: 12%;">PREȚ</th>
        </tr>`

    const totalsSection = includeTVA
      ? `<div class="totals-section">
        <div class="totals-left">
          <div class="total-row">
            <div class="total-label">Total materiale:</div>
            <div class="total-value">${totalMateriale.toFixed(2)}</div>
          </div>
          <div class="total-row">
            <div class="total-label">Total manoperă:</div>
            <div class="total-value">${totalLucrari.toFixed(2)}</div>
          </div>
        </div>

        <div class="totals-right">
          <div class="total-row-right">
            <div class="total-label-right">PREȚ</div>
            <div class="total-value-right">${pretTotal.toFixed(2)}</div>
            <div class="total-currency">TVA</div>
            <div class="total-value-right">${tvaTotal.toFixed(2)}</div>
          </div>
          <div class="total-row-right grand">
            <div class="total-label-right">TOTAL</div>
            <div class="total-value-right" colspan="3">${grandTotal.toFixed(2)}</div>
          </div>
        </div>
      </div>`
      : `<div class="totals-section">
        <div class="totals-left">
          <div class="total-row">
            <div class="total-label">Total materiale:</div>
            <div class="total-value">${totalMateriale.toFixed(2)}</div>
          </div>
          <div class="total-row">
            <div class="total-label">Total manoperă:</div>
            <div class="total-value">${totalLucrari.toFixed(2)}</div>
          </div>
        </div>

        <div class="totals-right">
          <div class="total-row-right grand">
            <div class="total-label-right">TOTAL</div>
            <div class="total-value-right">${grandTotal.toFixed(2)}</div>
          </div>
        </div>
      </div>`

    const entryHTML = `
    ${index > 0 ? '<div class="page-break"></div>' : ""}
    
    <div class="header">
      <div class="header-left">
        <h1>EXTREME SERVICE</h1>
        <p>Tel: 0753 767 116</p>
      </div>
      <div class="header-right">
        J12/199/2008<br>
        RO23091377<br>
        Str. Al. Vlahuță<br>
        Nr. 30-23, Cluj-Napoca
      </div>
    </div>

    <div class="order-info">
      <span>Comandă nr:______________</span>
      <span><strong>Data: ${entry.date}</strong></span>
    </div>

    <div class="section-title">INFORMAȚII VEHICUL</div>
    <div class="vehicle-info">
      <div>Număr înmatriculare: <strong>${data.numarInmatriculare || ""}</strong></div>
      <div>Marcă Auto: <strong>${entry.data?.marcaAuto || ""}</strong></div>
      <div>Model Auto: <strong>${entry.data?.modelAuto || ""}</strong></div>
      <div>Motorizare: <strong>${entry.data?.motorizare || ""}</strong></div>
      <div>An fabricație: <strong>${entry.data?.anFabricatie || ""}</strong></div>
      <div>Kilometri: <strong>${entry.data?.kilometri || ""}</strong></div>
      <div>Serie șasiu: <strong>${entry.data?.serieSasiu || ""}</strong></div>
      <div>Data intrare service: <strong>${entry.data?.dataIntrare || entry.date || ""}</strong></div>
      <div>Nume proprietar: <strong>${entry.data?.numeProprietar || ""}</strong></div>
      <div>Număr telefon: <strong>${entry.data?.numarTelefon || ""}</strong></div>
    </div>

    <div class="section-title">DETALIERE MATERIALE</div>
    <table>
      <thead>
        ${materialeTableHeader}
      </thead>
      <tbody>
        ${materialeRows}
      </tbody>
    </table>

    <div class="section-title" style="margin-top: 10px;">DETALIERE MANOPERĂ</div>
    <table>
      <thead>
        ${lucrariTableHeader}
      </thead>
      <tbody>
        ${lucrariRows}
      </tbody>
    </table>

    ${totalsSection}

    <div class="signatures">
      <span><strong>Verificat reparație: Suciu Dan</strong></span>
      <span>Semnătură: ______________________</span>
    </div>

    <div style="margin-top: 8px; font-size: 8pt;">
      Am preluat vehiculul cu lucrările executate conform foii de comandă și cu inventarul complet.
    </div>
    <div style="margin-top: 4px; font-size: 8pt;">
      <strong>Semnătură client: ______________________</strong>
    </div>

    <div class="warranty-box">
      <div class="warranty-title">CERTIFICAT DE CALITATE ȘI GARANȚIE:</div>
      <div class="warranty-text">
        Unitatea noastră garantează lucrările de reparații executate după cum urmează:
        <ul>
          <li>3 luni de la data recepției vehiculului dacă lucrarea de reparații nu a necesitat înlocuiri de piese sau dacă lucrarea s-a executat cu piesa clientului.</li>
          <li>24 luni pentru piesele furnizate de unitate, conform legii nr.449/2003.</li>
        </ul>
      </div>
      <div class="note-section">
        Notă: Unitatea noastră nu este răspunzătoare pentru obiectele personale lăsate în autovehicul.<br>
        Garanția este condiționată de utilizarea în exploatare a autovehiculului conform prescripțiilor constructorului.
      </div>
    </div>
    `

    allEntriesHTML += entryHTML
  })

  const fullHTML = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Istoric Service Auto - ${data.numarInmatriculare}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 10px;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 9pt;
      color: black;
      background: transparent;
      margin: 10px;
    }

    .header {
      border: 2px solid black;
      padding: 5px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .header-left h1 {
      font-size: 20pt;
      font-weight: bold;
      margin: 0;
    }

    .header-left p {
      font-size: 10pt;
      margin: 2px 0 0 0;
    }

    .header-right {
      text-align: right;
      font-size: 9pt;
      line-height: 1.4;
    }

    .order-info {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      font-size: 9pt;
    }

    .section-title {
      background: transparent;
      border: 2px solid black;
      border-collapse: collapse;
      padding: 3px 8px;
      font-weight: bold;
      font-size: 10pt;
      margin-top: 8px;
    }

    .vehicle-info {
      border: 2px solid black;
      border-top: none;
      border-collapse: collapse;
      padding: 5px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2px 20px;
      font-size: 9pt;
    }

    .vehicle-info div {
      padding: 2px 0;
    }

    .vehicle-info strong {
      font-weight: bold;
    }

    table {
      width: 100%;
      border: 2px solid black;
      border-right: none;
      border-top: none;
      border-collapse: collapse;
      margin-top: 0;
      font-size: 9pt;
    }

    table th {
      border: 2px solid black;
      border-top: none;
      border-bottom: 2px solid black;
      border-collapse: collapse;
      padding: 3px 8px;
      text-align: left;
      font-weight: bold;
      background: transparent;
    }

    table th.center {
      text-align: center;
    }

    table th.right {
      text-align: right;
    }

    table td {
      border: 1px solid black;
      border-right: 2px solid black;
      border-collapse: collapse;
      padding: 3px 8px;
      background: transparent;
      font-size: 8pt;
    }

    table td.center {
      text-align: center;
    }

    table td.right {
      text-align: right;
    }

    .totals-section {
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      gap: 20px;
    }

    .totals-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .totals-right {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 350px;
    }

    .total-row {
      display: flex;
      border: 2px solid black;
      font-size: 9pt;
    }

    .total-row-right .total-value-right:last-of-type {
      border-left: 2px solid black;
    }


    .total-row.grand {
      border: 2px solid black;
      font-weight: bold;
      font-size: 10pt;
    }

    .total-label {
      flex: 1;
      padding: 3px 8px;
      border-right: 2px solid black;
    }

    .total-value {
      padding: 3px 8px;
      text-align: right;
      min-width: 80px;
    }

    .total-row-right {
      display: flex;
      border: 2px solid black;
      font-size: 9pt;
    }

    .total-row-right.grand {
      border: 2px solid black;
      font-weight: bold;
      font-size: 10pt;
    }

    .total-label-right {
      flex: 1;
      padding: 3px 8px;
      font-weight: bold;
    }

    .total-value-right {
      padding: 3px 8px;
      text-align: right;
      min-width: 100px;
    }

    .total-currency {
      padding: 3px 8px;
      min-width: 60px;
      font-weight: bold;
      border-left: 2px solid black;
    }

    .signatures {
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .warranty-box {
      border: 2px solid black;
      padding: 5px;
      margin-top: 10px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .warranty-title {
      font-weight: bold;
      margin-bottom: 6px;
      font-size: 9pt;
    }

    .warranty-text {
      font-size: 7pt;
      line-height: 1;
      margin-bottom: 4px;
    }

    .warranty-text ul {
      margin: 4px 0 4px 20px;
    }

    .warranty-text li {
      margin: 3px 0;
    }

    .client-section {
      margin-top: 8px;
      font-size: 8pt;
    }

    .note-section {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid black;
      font-size: 8pt;
      font-weight: bold;
    }

    .page-break {
      page-break-before: always;
    }

    @media print {
      body {
        margin: 10px;
      }
    }
  </style>
</head>
<body>
${allEntriesHTML}
</body>
</html>
`

  return fullHTML
}
