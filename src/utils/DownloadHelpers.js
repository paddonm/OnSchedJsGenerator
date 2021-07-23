import { setState, state } from "./AppState"
import { client } from "./AuthUtils"


export const createOuterHtml = () => {
  var availabilityStep = state.steps.length ? state.steps.filter(prevSteps => prevSteps.name === 'availability')[0] : {}
  const otherSteps = state.steps.filter(prevSteps => prevSteps.name !== 'availability')

  Object.keys(state.availabilityConfig)
    .map(config => {
      availabilityStep.params[config] = state.availabilityConfig[config]
    })
    
  let sorted = state.steps.sort((a, b) => a.step > b.step ? 1 : -1)

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Flow | Powered by OnSched</title>

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
          let next = sorted.length > idx + 1 ? sorted[idx + 1] : null
          let updateParams = ''
          let nextMount = next ? `${next.name}.mount("${next.name}");` : ''
        
          updateParams = `${sorted.map((sortedEl, i) => {
            let elName = el.name === 'availability' ? 'availability' : el.name.slice(0, -1)

            if (sorted.length > i + 1)
              return `${sorted[i + 1].name}Params.${elName}Id = e.detail.${elName}Id;
          `
            else 
              return ''
          }).join(" ")}`

          return `
          el${el.name}.addEventListener("${evt.name}", e => {
            ${evt.name.includes('click') ? `el${el.name}.innerHTML = '';
            ${next ? `${updateParams}
            ${nextMount}` : ''}` : ''}
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
