import { setState, state }          from "../../utils/AppState"
import { ConfigBookingFlow } from "../../utils/BookingFlows"
import { rootId, addElementToRoot } from "../../utils/RootHelpers"
import { warningTypes }             from '../../utils/WarningUtils'
import { mountExportBtn }           from "../ExportBtn"
import { mountWarnings }            from "../Warnings"


export const mountBookingSteps = (target = rootId) => {
  addElementToRoot('bookingStepsContainer', target)
    .then(elStepsContainer => {
      elStepsContainer.className = 'booking-steps-container'

      addElementToRoot('bookingSteps', 'bookingStepsContainer')
        .then(elBookingSteps => {
          elBookingSteps.className = 'content-container booking-steps'
          addElementToRoot('bookingStepTitle', 'bookingSteps', 'H1')
            .then(elBookingStepTitle => {
              elBookingStepTitle.className = 'booking-step-title' 
              elBookingStepTitle.innerText = 'Choose your steps'

              ConfigBookingFlow.elements.map(step => {
                addElementToRoot(step.name, 'bookingSteps')
                  .then(elStep => {
                    elStep.className = 'booking-step'
    
                    elStep.onclick = () => {
                      var steps
                      
                      if (state.steps.includes(step)) 
                        steps = state.steps.filter(s => s.name !== step.name)
                      else 
                        steps = [...state.steps, step]
                      
                      elStep.classList.toggle('active')
                      
                      setState({ steps })
                    }
            
                    elStep.innerHTML = `
                      <h1>${step.name}</h1>
                      <p>${step.desc}</p>
                    `
                  }).catch(error => console.log('err', error))
              })
            })
    
          addElementToRoot('settings', 'bookingStepsContainer')
            .then(elStep => {
              elStep.className = 'content-container settings'
              elStep.innerHTML = ''
    
              var title = document.createElement('H1')
              title.innerText = 'Settings'
              
              var desc = document.createElement('P')
              desc.innerText = 'Online booking settings'
    
              var roundRobinInput = document.createElement('INPUT')
              roundRobinInput.id = 'roundRobin'
              roundRobinInput.setAttribute('name', 'roundRobin')
              roundRobinInput.setAttribute('type', 'checkbox')
              roundRobinInput.value = 'roundRobin'
              roundRobinInput.innerText = 'Online booking settings'
              roundRobinInput.onchange = e => {
                let warnings = state.warnings
                
                if (document.querySelectorAll('.booking-steps .active#resources').length) {
                  if (e.srcElement.checked)
                    warnings = [...warnings, warningTypes.roundRobin]
                  else 
                    warnings = warnings.filter(warning => warning !== warningTypes.roundRobin)
                }
                  
                setState({ warnings, availabilityConfig: { roundRobin: e.srcElement.checked ? 1 : 0 } })
              }
              
              var roundRobinLabel = document.createElement('LABEL')
              roundRobinLabel.setAttribute('for', 'roundRobin')
              roundRobinLabel.innerText = 'Round robin'
    
              elStep.appendChild(title)
              elStep.appendChild(desc)
              elStep.appendChild(roundRobinInput)
              elStep.appendChild(roundRobinLabel)
            }).catch(error => console.log('err', error))
        }).catch(error => console.log('err', error))
    }).catch(error => console.log('err', error))
}
