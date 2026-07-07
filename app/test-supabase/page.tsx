'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export default function TestSupabasePage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function test() {
      setLoading(true)
      const { data, error } = await supabase
        .from('matches')
        .select('*')

      setData(data)
      setError(error)
      setLoading(false)
    }

    test()
  }, [])

  return (
    <div className="min-h-screen bg-[#0f1419] text-white p-8">
      <h1 className="text-2xl font-bold text-[#e94560] mb-4">
        Supabase Connection Test
      </h1>

      {loading ? (
        <div className="bg-[#1a1f2e] p-8 rounded-lg text-center">
          <p className="text-gray-400">Loading data from Supabase…</p>
        </div>
      ) : (
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
      )}
    </div>
  )
}