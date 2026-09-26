import { Chrome } from './chrome'
import { Gl3D } from './gl'
import { Footer, Sections } from './sections'

// Lead-owned shell. Builders plug in through their own index files, never here.
export default function App() {
  return (
    <>
      <Gl3D />
      <Chrome />
      <main id="main" tabIndex={-1}>
        <Sections />
      </main>
      <Footer />
    </>
  )
}
