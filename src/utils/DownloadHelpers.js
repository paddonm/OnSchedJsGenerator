import { client } from "./AuthUtils"


export const createOuterHtml = data => {
//console.log(data.elements.filter(elem => elem.step === 2)[0])

const activeIds = []
document.querySelectorAll('.booking-steps .active').forEach(activeEl => activeIds.push(activeEl.id))

let filtered = data.elements.filter(filteredObj => activeIds.includes(filteredObj.name))
let sorted = filtered.sort((a, b) => a.step > b.step ? 1 : -1)
sorted.push({
  step: 4,
  name: 'availability',
  params: { roundRobin: activeIds.includes('roundRobin') ? 1 : 0 },
  options: {},
  events: [{ name: 'getAvailability', action: e => {console.log('resources', e.detail)} }]
})

return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title} Booking Flow | Powered by OnSched</title>

      <!-- OnSchedJs Installation -->
      <script type="text/javascript" src="https://js.onsched.com/0.1.0-beta/"></script>
    </head>
    <body>
      <!-- OnSched Elements -->
      ${sorted.map(el =>
        `<div id="${el.name}"></div>
     `).join(" ")}

      <!-- OnSchedJs Javascript -->
      <script>
        // Initialize OnSched with clientId and environment 
        var onsched = OnSched("${client.id}", "${client.env}");
        
        // Get instance of elements to use for creating elements
        var elements = onsched.elements();
      ${sorted.map((el, idx) => `
        var ${el.name}Params  = ${el.params ? JSON.stringify(el.params) : '{}'};
        var ${el.name}Options = ${el.options ? JSON.stringify(el.options) : '{}'};
        var el${el.name}     = document.getElementById("${el.name}");
        var ${el.name}       = elements.create("${el.name}", ${el.name}Params, ${el.name}Options);
        
      ${el.events.map(evt => {
        let next = sorted.length > idx ? sorted[idx + 1] : null
        let nextMount = next ? `${next.name}.mount("${next.name}");` : ''

        return `
        el${el.name}.addEventListener("${evt.name}", e => {
          ${evt.name.includes('click') ? `el${el.name}.innerHTML = '';
          ${sorted.map(sortedEl => `Object.assign(${sortedEl.name}Params, e.detail)
           `).join(" ")}
          ${nextMount}` : ''}
        });
      `}).join(" ")}
        ${idx === 0 ? `${el.name}.mount("${el.name}");` : ''}`).join(" ")}
      </script>
    </body>
  </html>
  `
}

export const createDownloadLink = (anchorSelector, code, fileName) => {
  let target = document.querySelector(anchorSelector);

  if(window.navigator.msSaveOrOpenBlob) {
    var fileData = [code];
    blobObject = new Blob(fileData);
    target.onclick = () => window.navigator.msSaveOrOpenBlob(blobObject, fileName);
  } else {
    var url = "data:html;charset=utf-8," + encodeURIComponent(code);
    target.download = fileName;
    target.href = url;
  }
}
