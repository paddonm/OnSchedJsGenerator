import { addElementToRoot }  from '../../utils/RootHelpers'
import { mountBookingSteps } from '../bookingFlowSteps'
import { mountGenerateFile } from '../generateFile'
import { mountCommonFlows }  from '../commonFlows'

export const mountHome = () => {
  addElementToRoot('home')
    .then(() => {
      // mountCommonFlows('home')
      mountBookingSteps('home')
      mountGenerateFile('home')
    })
}
