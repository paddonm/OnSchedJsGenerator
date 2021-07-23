import { rootId, addElementToRoot } from '../../utils/RootHelpers'
import { mountBookingSteps }        from '../BookingFlowSteps'
import { mountExportBtn }           from '../ExportBtn'
import { mountWarnings }            from '../Warnings'
//import { mountCommonFlows }         from '../CommonFlows'


export const mountHome = () => {
  addElementToRoot(rootId)
    .then(() => {
      // mountCommonFlows(rootId)
      mountBookingSteps(rootId)
      mountWarnings(rootId)
      mountExportBtn(rootId)
    })
    .catch(error => console.log('err', error))
}
