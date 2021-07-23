import { mountExportBtn }  from "../mounts/ExportBtn"
import { mountWarnings }   from "../mounts/Warnings"
import { warningTypes }    from '../utils/WarningUtils'
import { setState, state } from "./AppState"


const stepExists = step => state.steps.filter(s => s.name === step).length

const stepsUpdate = () => {
  let warnings = state.warnings
                
  if (stepExists('resources')) {
    if (state.availabilityConfig.roundRobin) {
      warnings = [...warnings, warningTypes.roundRobin]
    }
  }
  else warnings = warnings.filter(warning => warning !== warningTypes.roundRobin)

  setState({ warnings })
}

const stateUpdateKeys = {
  warnings: mountWarnings,
  steps: stepsUpdate,
  roundRobin: stepsUpdate
}

const mainUpdateAction = () => {
  if (state.availabilityConfig.roundRobin && !stepExists('resources')) {
    let availabilityConfig = state.availabilityConfig
    availabilityConfig.resourceId = 0

    setState({ availabilityConfig })
  }
}

export const stateUpdate = (prevState, state) => {
  if (JSON.stringify(prevState) !== JSON.stringify(state)) {
    console.log('main updated', JSON.stringify(prevState) !== JSON.stringify(state), prevState, state)
    mountExportBtn()
    mainUpdateAction()
  }
  
  Object.keys(stateUpdateKeys).map(key => {
    if (JSON.stringify(prevState[key]) !== JSON.stringify(state[key])) {
      console.log('key updated', JSON.stringify(prevState[key]) !== JSON.stringify(state[key]), prevState[key], state[key])
      stateUpdateKeys[key]()
    }
  })
}
