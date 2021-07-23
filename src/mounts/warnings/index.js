import { state }                    from "../../utils/AppState"
import { addElementToRoot, rootId } from "../../utils/RootHelpers"


export const mountWarnings = (target = rootId) => {
  addElementToRoot('warningsContainer', target)
    .then(elWarningsContainer => {
      elWarningsContainer.className = 'warnings-container'
      addElementToRoot('warnings', 'warningsContainer')
        .then(elWarnings => {
          elWarnings.className = 'content-container warnings'
          elWarnings.innerHTML = ``
          if (state.warnings?.length) {
            elWarnings.innerHTML = `
              ${state.warnings.map(warning => `
                <div class="warning">
                  <h5>${warning.title}<h5>
                  <p>${warning.data}</p>
                </div>
              `).join("")}
            `
          }
        })
    })
    .catch(error => console.log('err', error))
}
