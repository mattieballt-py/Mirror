import { useState } from 'react'
import LiveScanHero from './LiveScanHero'
import SplatViewer from './SplatViewer'
import RoboticsLab from './RoboticsLab'

export default function TestingPage() {
  const [jobId, setJobId] = useState<string | null>(null)

  const handleJobIdReceived = (id: string) => {
    setJobId(id)
    console.log('TestingPage received job_id:', id)
  }

  return (
    <>
      <LiveScanHero onJobIdReceived={handleJobIdReceived} />
      <SplatViewer jobId={jobId} />
      <RoboticsLab />
    </>
  )
}
