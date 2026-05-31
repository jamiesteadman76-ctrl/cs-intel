import type { IntelUpdate } from '@/lib/types'

interface IntelFeedProps {
  updates: IntelUpdate[]
}

export default function IntelFeed({ updates }: IntelFeedProps) {
  return (
    <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 md:p-8 mb-8">
      <h3 className="text-xl font-bold text-white mb-6">Latest Intel</h3>

      <div className="space-y-3">
        {updates.map((update) => (
          <div
            key={update.id}
            className="flex gap-4 pb-4 border-b border-gray-800 last:border-b-0 hover:bg-[#0a0d12]/50 rounded p-3 transition-colors"
          >
            <div className="flex-shrink-0 text-2xl">{update.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-300 text-sm leading-relaxed mb-2">{update.content}</p>
              <p className="text-xs text-gray-500">{update.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
