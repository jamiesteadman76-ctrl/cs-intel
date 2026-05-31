import type { CommunityComment } from '@/lib/types'

interface CommunityDiscussionItemProps {
  comment: CommunityComment
}

export default function CommunityDiscussionItem({
  comment,
}: CommunityDiscussionItemProps) {
  return (
    <div className="pb-4 border-b border-gray-800 last:border-b-0">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center text-white font-bold text-sm">
            {comment.avatar}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-white text-sm">{comment.username}</p>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">{comment.timestamp}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="ml-13 mb-3">
        <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>
      </div>

      {/* Footer */}
      <div className="ml-13 flex items-center gap-6">
        <button className="flex items-center gap-2 text-xs text-gray-500 hover:text-[#00d4ff] transition-colors">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10.5a1.5 1.5 0 113 0v-6a1.5 1.5 0 11-3 0v6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.519-7.594A2 2 0 0015.378 8H4.066a2 2 0 00-1.934 2.333l.003.017z"></path>
          </svg>
          <span>{comment.upvotes}</span>
        </button>
        <button className="text-xs text-gray-500 hover:text-white transition-colors">
          Reply
        </button>
        <button className="text-xs text-gray-500 hover:text-white transition-colors">
          {comment.replies} {comment.replies === 1 ? 'reply' : 'replies'}
        </button>
      </div>
    </div>
  )
}
