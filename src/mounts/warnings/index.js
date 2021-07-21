import { addElementToRoot } from "../../utils/RootHelpers"

export const mountWarnings = ({ warnings, target }) => {
  addElementToRoot('warnings', target)
    .then(elWarnings => {
      elWarnings.className = 'warnings'
      elWarnings.innerHTML = `
        ${warnings.map(warning => `
          <div class="warning">
            <h5>${warning.title}<h5>
            <p>${warning.data}</p>
          </div>
        `)}
      `
    })
}
