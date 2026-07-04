import type { CommunityPrediction } from '@/lib/types'

interface CommunityPredictionsWidgetProps {
  predictions: CommunityPrediction[]
}

export default function CommunityPredictionsWidget({
  predictions,
}: CommunityPredictionsWidgetProps) {
  return (
    <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-lg p-6 mb-8">
      <h3 className="text-xl font-bold text-white mb-6">Top Community Picks</h3>

      <div className="space-y-3">
        {predictions.map((prediction) => (
          <div
            key={prediction.id}
            className="bg-[#0a0d12]/50 border border-gray-800 rounded-lg p-4 hover:border-[#e94560]/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-white text-sm">{prediction.username}</p>
                <p className="text-sm text-gray-400 mt-1">{prediction.prediction}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{prediction.timestamp}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 py-2 text-sm font-medium text-white border border-[#e94560]/50 rounded hover:bg-[#e94560]/10 transition-colors">
        Make Your Prediction
      </button>
    </div>
  )
}
