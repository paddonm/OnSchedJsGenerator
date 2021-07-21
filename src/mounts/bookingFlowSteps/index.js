import { addElementToRoot } from "../../utils/RootHelpers"
import { mountGenerateFile } from "../generateFile"


const steps = [
  { 
    name: 'locations', 
    desc: 'Show a list of all locations for the user to select. Once a location is selected the next step in the booking flow will be displayed.',
  },
  { 
    name: 'resources', 
    desc: 'Show a list of all resources for the user to select. Once a resource is selected the next step in the booking flow will be displayed.',
  },
  { 
    name: 'services', 
    desc: 'Show a list of all services for the user to select. Once a service is selected the next step in the booking flow will be displayed.',
  },
]

export const mountBookingSteps = target => {
  addElementToRoot('bookingStepsContainer', target)
    .then(elStepsContainer => {
      elStepsContainer.className = 'booking-steps-container'

      addElementToRoot('bookingSteps', 'bookingStepsContainer')
        .then(elBookingSteps => {
          elBookingSteps.className = 'booking-steps'
    
          steps.map(step => {
            addElementToRoot(step.name, 'bookingSteps')
              .then(elStep => {
                elStep.className = 'booking-step'

                elStep.onclick = () => {
                  elStep.classList.toggle('active')
                  mountGenerateFile('home')
                }
        
                elStep.innerHTML = `
                  <h1>${step.name}</h1>
                  <p>${step.desc}</p>
                `
              })
          })
    
          addElementToRoot('settings', 'bookingStepsContainer')
            .then(elStep => {
              elStep.className = 'settings'
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
                if (!document.querySelectorAll('.booking-steps .active#resources').length) {
                  e.target.classList.toggle('active')
                  mountGenerateFile('home')
                }
                else if (e.srcElement.checked) console.log('prompt disabled msg')
              }
              
              var roundRobinLabel = document.createElement('LABEL')
              roundRobinLabel.setAttribute('for', 'roundRobin')
              roundRobinLabel.innerText = 'Round robin'
    
              elStep.appendChild(title)
              elStep.appendChild(desc)
              elStep.appendChild(roundRobinInput)
              elStep.appendChild(roundRobinLabel)
            })
        })
    })
}
