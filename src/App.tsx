import { Chrome } from './chrome'
import { Footer, Sections } from './sections'

// Lead-owned shell. Builders plug in through their own index files, never here.
export default function App() {
  return (
    <>
      <Chrome />
      <main id="main" tabIndex={-1}>
        <Sections />
      </main>
      <Footer />
    </>
  )
}
