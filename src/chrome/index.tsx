// Global UI (plan "Global UI (every section)" + "Accessibility"): skip link, top bar with
// the split pill, die-map minimap, Still toggle, phone bottom bar and sheet, the Surface
// Interrupt and the Keys popover.
import { BottomBar, DeskStill, DieMap, TopBar } from './Bars'
import { KeysPopover } from './KeysPopover'
import { useGlobalListeners } from './listeners'
import { SurfaceInterrupt } from './SurfaceInterrupt'
import './chrome.css'
import './ui.css'

export function Chrome() {
  useGlobalListeners()
  return (
    <>
      <a className="c-skip" href="#main">
        Skip to main content
      </a>
      <TopBar />
      <DieMap />
      <DeskStill />
      <BottomBar />
      <KeysPopover />
      <SurfaceInterrupt />
    </>
  )
}
