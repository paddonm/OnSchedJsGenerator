import { addElementToRoot }   from "../../utils/RootHelpers"
import { ConfigBookingFlow }  from '../../utils/BookingFlows'
import { createOuterHtml, 
         createDownloadLink } from "../../utils/DownloadHelpers"


export const mountGenerateFile = (target) => {
  addElementToRoot('main-export', target, 'A')
    .then(elExport => {
      elExport.innerText = 'export'
      
      const filename = `${ConfigBookingFlow.title}.html`
      const file = createOuterHtml(ConfigBookingFlow)
      
      // activeEls.forEach(activeEl => {
      //   console.log(activeEl.id, data.elements.filter(e => e.name === activeEl.id)[0])
      // })

      elExport.download = filename
      elExport.href = 'data:html;charset=utf-8,hi%2Cfile'
      elExport.innerText = `${ConfigBookingFlow.title} export`

      createDownloadLink(`#main-export`, file, filename)
    })
}
