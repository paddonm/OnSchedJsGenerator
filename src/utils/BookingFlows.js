export const FeaturedBookingFlows = [
  {
    title: 'test',
    desc: 'description',
    elements: [
      {
        step: 2,
        name: 'services',
        desc: 'Show a list of all services for the user to select. Once a service is selected the next step in the booking flow will be displayed.',
        params: {},
        options: {},
        events: [{ name: 'geServices', action: e => {console.log('services', e.detail)} }, { name: 'clickService', action: e => {console.log('clicked', e.detail)} }]
      },
      {
        step: 1,
        name: 'locations',
        desc: 'Show a list of all locations for the user to select. Once a location is selected the next step in the booking flow will be displayed.',
        params: {},
        options: {},
        events: [{ name: 'getLocations', action: e => {console.log('locations', e.detail)} }, { name: 'clickLocation', action: e => {console.log('clicked', e.detail)} }]
      },
      {
        step: 3,
        name: 'resources',
        desc: 'Show a list of all resources for the user to select. Once a resource is selected the next step in the booking flow will be displayed.',
        params: {},
        options: {},
        events: [{ name: 'getResources', action: e => {console.log('resources', e.detail)} }, { name: 'clickResource', action: e => {console.log('clicked', e.detail)} }]
      },
      {
        step: 4,
        name: 'availability',
        params: {},
        options: {},
        events: [{ name: 'getAvailability', action: e => {console.log('resources', e.detail)} }]
      },
    ],
  },
]

export const ConfigBookingFlow = {
  title: 'index',
  desc: '',
  elements: [
    {
      step: 2,
      params: {},
      options: {},
      name: 'services',
      desc: 'Show a list of all locations for the user to select. Once a location is selected the next step in the booking flow will be displayed.',
      events: [{ name: 'geServices', action: e => {console.log('services', e.detail)} }, { name: 'clickService', action: e => {console.log('clicked', e.detail)} }]
    },
    {
      step: 1,
      params: {},
      options: {},
      name: 'locations',
      desc: 'Show a list of all resources for the user to select. Once a resource is selected the next step in the booking flow will be displayed.',
      events: [{ name: 'getLocations', action: e => {console.log('locations', e.detail)} }, { name: 'clickLocation', action: e => {console.log('clicked', e.detail)} }]
    },
    {
      step: 3,
      params: {},
      options: {},
      name: 'resources',
      desc: 'Show a list of all services for the user to select. Once a service is selected the next step in the booking flow will be displayed.',
      events: [{ name: 'getResources', action: e => {console.log('resources', e.detail)} }, { name: 'clickResource', action: e => {console.log('clicked', e.detail)} }]
    },
  ]
}
