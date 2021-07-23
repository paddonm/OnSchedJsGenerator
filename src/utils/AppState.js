import { stateUpdate } from './OnChangeUtils'


export var state = { 
  warnings: [], 
  availabilityConfig: { roundRobin: 0 },
  steps: [{
    step: 4,
    name: 'availability',
    params: { roundRobin: 0 },
    options: {},
    events: [{ name: 'getAvailability', action: e => {console.log('resources', e.detail)} }]
  }],
}

export const setState = data => 
  new Promise(resolve => {
    var prevState = {}

    Object.entries(state)
      .map(key => prevState[key[0]] = key[1])
    
    Object.assign(state, data)

    stateUpdate(prevState, state)
    
    resolve({ prevState, state })
  })

