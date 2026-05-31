import type { CommunityActivity } from '@/lib/types'

interface CommunityActivityItemProps {
  activity: CommunityActivity
}

export default function CommunityActivityItem({
  activity,
}: CommunityActivityItemProps) {
  return (
    <div className="flex gap-4 pb-4 border-b border-gray-800 last:border-b-0">
      {/* Avatar placeholder */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center text-white font-bold">
          {activity.user.charAt(0)}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm md:text-base">
              {activity.user}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {activity.action}
              {activity.match && (
                <>
                  {' '}
                  <span className="text-[#00d4ff] font-medium">{activity.match}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span>{activity.timestamp}</span>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v-6a1.5 1.5 0 11-3 0v6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.519-7.594A2 2 0 0015.378 8H4.066a2 2 0 00-1.934 2.333l.003.017z"></path>
            </svg>
            {activity.votes}
          </div>
        </div>
      </div>
    </div>
  )
}
