'use client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSupabasePage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    async function test() {
      const { data, error } = await supabase
        .from('matches')
        .select('*')

      setData(data)
      setError(error)
    }

    test()
  }, [])

  return (
    <div className="min-h-screen bg-[#0f1419] text-white p-8">
      <h1 className="text-2xl font-bold text-[#e94560] mb-4">
        Supabase Connection Test
      </h1>

      <div className="bg-[#1a1f2e] p-4 rounded-lg">
        <p className="mb-2">Data:</p>
        <pre className="text-green-400 text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>

        <p className="mt-4 mb-2">Error:</p>
        <pre className="text-red-400 text-sm">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    </div>
  )
}