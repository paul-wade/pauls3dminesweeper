'use client';

import IsometricBoard from '../components/IsometricBoard';

export default function Home() {
  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center bg-[#008080]">
      <div className="bg-[#c0c0c0] p-4 rounded border-4 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080]">    
        <div className="relative border-4 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] bg-[#c0c0c0] p-4">
          <IsometricBoard width={8} height={8} mines={12} levels={3} />
        </div>
      </div>
    </main>
  )
}
