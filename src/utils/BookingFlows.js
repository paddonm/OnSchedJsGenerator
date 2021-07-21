export const FeaturedBookingFlows = [
  {
    title: 'test',
    desc: 'description',
    elements: [
      {
        step: 2,
        name: 'services',
        params: {},
        options: {},
        events: [{ name: 'geServices', action: e => {console.log('services', e.detail)} }, { name: 'clickService', action: e => {console.log('clicked', e.detail)} }]
      },
      {
        step: 1,
        name: 'locations',
        params: {},
        options: {},
        events: [{ name: 'getLocations', action: e => {console.log('locations', e.detail)} }, { name: 'clickLocation', action: e => {console.log('clicked', e.detail)} }]
      },
      {
        step: 3,
        name: 'resources',
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
  title: 'main',
  desc: '',
  elements: [
    {
      step: 2,
      name: 'services',
      params: {},
      options: {},
      events: [{ name: 'geServices', action: e => {console.log('services', e.detail)} }, { name: 'clickService', action: e => {console.log('clicked', e.detail)} }]
    },
    {
      step: 1,
      name: 'locations',
      params: {},
      options: {},
      events: [{ name: 'getLocations', action: e => {console.log('locations', e.detail)} }, { name: 'clickLocation', action: e => {console.log('clicked', e.detail)} }]
    },
    {
      step: 3,
      name: 'resources',
      params: {},
      options: {},
      events: [{ name: 'getResources', action: e => {console.log('resources', e.detail)} }, { name: 'clickResource', action: e => {console.log('clicked', e.detail)} }]
    },
  ]
}
