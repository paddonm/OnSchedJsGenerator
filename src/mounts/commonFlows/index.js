import { addElementToRoot }     from '../../utils/RootHelpers'
import { FeaturedBookingFlows } from '../../utils/BookingFlows'
import { createOuterHtml, 
         createDownloadLink }   from '../../utils/DownloadHelpers'

export const mountCommonFlows = (target) => {
  FeaturedBookingFlows.map((flow, idx) => {
    addElementToRoot(`bookingFileExport${idx}`, target, 'A')
      .then(elExport => {
        const filename = `${flow.title}file.html`
        const file = createOuterHtml(flow)

        elExport.download = filename
        elExport.href = 'data:html;charset=utf-8,hi%2Cfile'
        elExport.innerText = `${flow.title} export`

        createDownloadLink(`#bookingFileExport${idx}`, file, filename)
      })
  })
}
