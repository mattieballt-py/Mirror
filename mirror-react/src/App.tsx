import { useState } from 'react'
import MirrorLogoV0 from '/Mirrorv0.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        
        <a href="https://github.com/mattieballt-py" target="_blank">
          <img src={MirrorLogoV0} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Mirror</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        This will be awesome I promise. Currently the plan is give step by step skills instructions so anyone can do anything (lay bricks, home reno, electronics) but be the integration layer with smart glasses. using the data from humans getting the capability to do any skills, to train robots to do those skills.
      </p>
    </>
  )
}

export default App
