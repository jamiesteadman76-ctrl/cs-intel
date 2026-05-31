import type { IntelPost } from '@/lib/types'

interface IntelPostCardProps {
  post: IntelPost
}

const categoryColors: Record<string, string> = {
  'team-form': 'bg-blue-500/20 text-blue-300',
  'roster-change': 'bg-purple-500/20 text-purple-300',
  'tournament': 'bg-yellow-500/20 text-yellow-300',
  'betting': 'bg-green-500/20 text-green-300',
}

const categoryLabels: Record<string, string> = {
  'team-form': 'Team Form',
  'roster-change': 'Roster Change',
  'tournament': 'Tournament',
  'betting': 'Betting Market',
}

export default function IntelPostCard({ post }: IntelPostCardProps) {
  const colorClass = categoryColors[post.category]
  const label = categoryLabels[post.category]

  return (
    <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-4 md:p-6 hover:border-[#e94560]/50 transition-all card-hover cursor-pointer">
      {/* Category badge */}
      <div className="mb-3">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${colorClass}`}>
          {label}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 hover:text-[#e94560] transition-colors">
        {post.title}
      </h3>

      {/* Footer with metadata */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{post.timestamp}</span>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"></path>
            <path d="M6 11a1 1 0 11-2 0 1 1 0 012 0zM15 9a1 1 0 100-2 1 1 0 000 2z" fillOpacity="0.5"></path>
          </svg>
          {post.comments}
        </div>
      </div>
    </div>
  )
}
