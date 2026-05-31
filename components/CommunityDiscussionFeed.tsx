import CommunityDiscussionItem from './CommunityDiscussionItem'
import type { CommunityComment } from '@/lib/types'

interface CommunityDiscussionFeedProps {
  comments: CommunityComment[]
}

export default function CommunityDiscussionFeed({
  comments,
}: CommunityDiscussionFeedProps) {
  return (
    <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 md:p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Community Discussion</h3>
        <button className="px-4 py-2 text-sm font-medium text-white bg-[#0f3460] hover:bg-[#0f3460]/80 rounded transition-colors">
          Sort by Hot
        </button>
      </div>

      <div className="space-y-1">
        {comments.map((comment) => (
          <CommunityDiscussionItem key={comment.id} comment={comment} />
        ))}
      </div>

      {/* Load more */}
      <button className="w-full mt-6 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-700 rounded hover:border-gray-600 transition-colors">
        Load More Comments
      </button>
    </div>
  )
}
