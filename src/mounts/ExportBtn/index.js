import { addElementToRoot, rootId } from "../../utils/RootHelpers"
import { ConfigBookingFlow }        from '../../utils/BookingFlows'
import { createOuterHtml, 
         createDownloadLink }       from "../../utils/DownloadHelpers"


export const mountExportBtn = (target = rootId) => {
  addElementToRoot('exportBtn', target, 'A')
    .then(elExport => {
      const filename = `${ConfigBookingFlow.title}.html`
      const file = createOuterHtml()
      
      elExport.download = filename
      elExport.className = 'export-btn'
      elExport.innerText = 'Create Booking Flow'
      elExport.href = 'data:html;charset=utf-8,hi%2Cfile'
      
      createDownloadLink(`#exportBtn`, file, filename)
    }).catch(error => console.log('err', error))
}
