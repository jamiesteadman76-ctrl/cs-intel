export interface Team {
  name: string
  logo: string
  country?: string
}

export interface Player {
  id: string
  name: string
  avatar: string
  rating: number
  kd: number
  recentForm: string[]
}

export interface Match {
  id: string
  team1: Team
  team2: Team
  team1Players: Player[]
  team2Players: Player[]
  time: string
  tournament: string
  sentiment: number
  prediction1: number
  prediction2: number
  evidenceScore: number
  status: 'upcoming' | 'live' | 'finished'
  score1?: number
  score2?: number
  recentForm1: string[]
  recentForm2: string[]
  mapPoolAdvantage: string
  headToHeadWins1: number
  headToHeadWins2: number
  reasons: string[]
}

export interface IntelPost {
  id: string
  title: string
  category: 'team-form' | 'roster-change' | 'tournament' | 'betting'
  timestamp: string
  comments: number
}

export interface CommunityActivity {
  id: string
  user: string
  action: string
  match?: string
  timestamp: string
  votes: number
}

export interface Ranking {
  rank: number
  team: string
  rating: number
  change: number
}

export interface CommunityComment {
  id: string
  username: string
  avatar: string
  timestamp: string
  content: string
  upvotes: number
  replies: number
}

export interface CommunityPrediction {
  id: string
  username: string
  prediction: string
  confidence: number
  timestamp: string
}

export interface IntelUpdate {
  id: string
  content: string
  timestamp: string
  icon: string
}

export interface MatchTournament {
  name: string
  stage: string
  prizePool: string
  teamCount: number
}

export interface CommunityDiscussion {
  id: string
  title: string
  replies: number
  views: number
  upvotes: number
  lastActivity: string
}

export interface CommunityPost {
  id: string
  username: string
  avatar: string
  title: string
  preview: string
  category: string
  replies: number
  views: number
  upvotes: number
  timestamp: string
}

export interface TopContributor {
  rank: number
  username: string
  avatar: string
  reputation: number
  posts: number
  predictions: number
  accuracy: number
}

export interface CommunityCategory {
  id: string
  name: string
  discussions: number
  viewing: number
  icon: string
}

export interface CommunityStats {
  totalMembers: number
  activeUsers: number
  postsToday: number
  commentsToday: number
}

export interface CommunityTag {
  name: string
  posts: number
}

export interface NewMember {
  username: string
  avatar: string
  joinedDate: string
}

export interface ProfileStats {
  reputation: number
  totalPosts: number
  comments: number
  predictionsMade: number
  predictionAccuracy: number
  upvotesReceived: number
}

export interface ProfileActivity {
  id: string
  type: 'post' | 'comment' | 'prediction' | 'upvote'
  description: string
  timestamp: string
  icon: string
}

export interface PredictionHistory {
  id: string
  match: string
  team1: string
  team2: string
  prediction: string
  confidence: number
  date: string
  result: 'correct' | 'incorrect' | 'pending'
}

export interface TopAnalysisPost {
  id: string
  title: string
  views: number
  replies: number
  upvotes: number
  date: string
  category: string
}

export interface ReputationSource {
  label: string
  points: number
  maxPoints: number
  icon: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedDate?: string
}

export interface FavoriteTeam {
  name: string
  logo: string
  followedSince: string
}

export interface RecentFollower {
  username: string
  avatar: string
  followedDate: string
}

export interface CommunityStanding {
  rank: number
  totalMembers: number
  percentile: number
}

export interface ScheduleMatch {
  id: string
  team1: Team
  team2: Team
  tournament: string
  time: string
  status: 'upcoming' | 'live' | 'finished'
  score1?: number
  score2?: number
}

export interface QuickStat {
  label: string
  value: number | string
  icon: string
}

export interface RankingTeam {
  rank: number
  name: string
  logo: string
  rating: number
  winRate: number
  form: string[]
  change: number
  bestMap: string
  worstMap: string
  keyPlayer: string
  country?: string
}

export interface RankingMover {
  team: string
  logo: string
  change: number
  direction: 'up' | 'down'
  reason: string
}

export interface RankingUpcoming {
  team1: string
  team2: string
  tournament: string
  time: string
  impact: 'high' | 'medium' | 'low'
}

export interface BlogPost {
  id: string
  title: string
  category: 'Analysis' | 'Betting' | 'Teams' | 'Meta'
  preview: string
  date: string
  readTime: string
  featured?: boolean
  views: number
}

export interface LeaderboardUser {
  id: string
  rank: number
  username: string
  avatar: string
  intelScore: number
  accuracy: number
  predictions: number
  posts: number
  comments: number
  streak: number
  change: number
  joinedDate: string
  bestPost?: string
  achievements?: string[]
}

export interface LeaderboardStats {
  totalMembers: number
  totalPredictions: number
  averageAccuracy: number
  activeAnalysts: number
}

export interface RisingStar {
  id: string
  username: string
  avatar: string
  joinedDate: string
  scoreGained: number
  accuracy: number
}

export interface RecentAchievement {
  id: string
  username: string
  avatar: string
  achievement: string
  timestamp: string
}

export interface LeaderboardRule {
  title: string
  description: string
}

export interface ScoreComponent {
  label: string
  description: string
  icon: string
}

export interface PredictionMatch {
  id: string
  team1: string
  team2: string
  logo1: string
  logo2: string
  time: string
  tournament: string
  prediction1: number
  prediction2: number
  status: 'upcoming' | 'live' | 'finished'
}

export interface CommunityConsensus {
  id: string
  team1: string
  team2: string
  logo1: string
  logo2: string
  percentage: number
  confidence: 'high' | 'medium' | 'low'
  totalPredictions: number
}

export interface TopPredictor {
  id: string
  username: string
  avatar: string
  accuracy: number
  intelScore: number
  streak: number
}

export interface MyPrediction {
  id: string
  match: string
  prediction: string
  confidence: number
  result: 'correct' | 'incorrect' | 'pending'
  date: string
}

export interface RecentCommunityPick {
  id: string
  username: string
  avatar: string
  match: string
  prediction: string
  confidence: number
  timestamp: string
}

export interface PredictionRule {
  title: string
  description: string
}

export interface SeasonStat {
  label: string
  value: string
}

export interface AdminStat {
  label: string
  value: number | string
  change?: number
  accent?: boolean
}

export interface QuickAction {
  title: string
  description: string
  icon: string
  href: string
}

export interface AdminActivity {
  id: string
  action: string
  user: string
  timestamp: string
  icon: string
}

export interface AdminBlogPost {
  id: string
  title: string
  author: string
  date: string
  status: 'published' | 'draft' | 'under_review'
  views: number
}

export interface AdminIntelPost {
  id: string
  title: string
  author: string
  date: string
  status: 'published' | 'draft' | 'featured'
  category: string
}

export interface AdminDiscussion {
  id: string
  title: string
  author: string
  date: string
  status: 'active' | 'locked' | 'flagged'
  replies: number
}

export interface ReportItem {
  id: string
  type: string
  content: string
  reason: string
  reporter: string
  date: string
  status: 'pending' | 'resolved' | 'dismissed'
}

export interface AdminMatch {
  id: string
  team1: string
  team2: string
  tournament: string
  time: string
  status: 'upcoming' | 'live' | 'finished'
  featured: boolean
}

export interface AnalyticsCard {
  title: string
  value: string | number
  change: number
  chart: 'up' | 'down' | 'neutral'
  unit?: string
}

export interface AdminNote {
  title: string
  content: string
  date: string
}

export interface PlatformStatus {
  service: string
  status: 'operational' | 'degraded' | 'down'
  uptime: string
}

export interface Alert {
  id: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  timestamp: string
}
