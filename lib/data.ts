import type { Match, IntelPost, CommunityActivity, Ranking, CommunityComment, CommunityPrediction, IntelUpdate, MatchTournament, CommunityPost, TopContributor, CommunityCategory, CommunityStats, CommunityTag, NewMember, ProfileStats, ProfileActivity, PredictionHistory, TopAnalysisPost, ReputationSource, Achievement, FavoriteTeam, RecentFollower, CommunityStanding, RankingTeam, RankingMover, RankingUpcoming, BlogPost, LeaderboardUser, LeaderboardStats, RisingStar, RecentAchievement, LeaderboardRule, ScoreComponent, PredictionMatch, CommunityConsensus, TopPredictor, MyPrediction, RecentCommunityPick, PredictionRule, SeasonStat, AdminStat, QuickAction, AdminActivity, AdminBlogPost, AdminIntelPost, AdminDiscussion, ReportItem, AdminMatch, AnalyticsCard, AdminNote, PlatformStatus, Alert } from './types'

// All arrays below are transitional mock data pending DB integration.
// TODO: Replace with real database queries once backend endpoints are ready.
// See: SYSTEM_INTELLIGENCE.md and docs/mock-data-elimination-guide.md

// ============================================================================
// MOCK DATA - TO BE REPLACED
// ============================================================================

// TODO: Replace matches[] - awaiting DB seed and API endpoint
// Used by: app/page.tsx, components/MatchCard.tsx
// DB table: matches (team1_id, team2_id, tournament_id)
export const matches: Match[] = [
  {
    id: '1',
    team1: { name: 'FaZe Clan', logo: '🔥' },
    team2: { name: 'NAVI', logo: '⚡' },
    team1Players: [
      { id: 'p1', name: 'ropz', avatar: '👤', rating: 1.18, kd: 1.24, recentForm: ['✓', '✓', '✗', '✓', '✓'] },
      { id: 'p2', name: 'frozen', avatar: '👤', rating: 1.16, kd: 1.21, recentForm: ['✓', '✓', '✓', '✓', '✗'] },
    ],
    team2Players: [
      { id: 'p3', name: 's1mple', avatar: '👤', rating: 1.31, kd: 1.35, recentForm: ['✓', '✓', '✓', '✓', '✓'] },
      { id: 'p4', name: 'Perfecto', avatar: '👤', rating: 1.09, kd: 1.12, recentForm: ['✓', '✗', '✓', '✓', '✓'] },
    ],
    time: 'Today 18:00 UTC',
    tournament: 'ESL Pro League',
    sentiment: 72,
    prediction1: 58,
    prediction2: 42,
    evidenceScore: 8.4,
    status: 'upcoming',
    recentForm1: ['✓', '✓', '✗', '✓', '✓'],
    recentForm2: ['✓', '✓', '✓', '✗', '✓'],
    mapPoolAdvantage: 'FaZe: +35%',
    headToHeadWins1: 12,
    headToHeadWins2: 8,
    reasons: ['Better recent form', 'Stronger map pool', 'Higher ranked players', 'Won previous meeting'],
  },
]

// TODO: Replace featuredMatch - awaiting DB endpoint /api/matches?featured=true
// Used by: app/page.tsx (FeaturedMatch section)
// DB table: matches (team1_id, team2_id, tournament_id)
export const featuredMatch: Match = {
  id: 'featured',
  team1: { name: 'Spirit', logo: '🔥' },
  team2: { name: 'FaZe', logo: '⚡' },
  team1Players: [],
  team2Players: [],
  time: 'Yesterday 18:00 UTC',
  tournament: 'ESL Pro League Season 21 Finals',
  sentiment: 72,
  prediction1: 58,
  prediction2: 42,
  evidenceScore: 8.4,
  status: 'completed',
  result: 'team1_win',
  recentForm1: [],
  recentForm2: [],
  mapPoolAdvantage: '',
  headToHeadWins1: 12,
  headToHeadWins2: 8,
  reasons: [],
}

// TODO: Replace communityActivity[] - awaiting DB integration
// Used by: app/page.tsx (Community Activity section)
// DB table: community_activity
export const communityActivity: CommunityActivity[] = [
  {
    id: '1',
    user: 'ProPredictors',
    action: 'predicted FaZe Clan to win',
    match: 'vs NAVI',
    timestamp: '15 minutes ago',
    votes: 342,
  },
  {
    id: '2',
    user: 'ESportsAnalyst',
    action: 'commented on Vitality map pool analysis',
    timestamp: '30 minutes ago',
    votes: 218,
  },
  {
    id: '3',
    user: 'CommunityMod',
    action: 'posted tournament predictions thread',
    timestamp: '1 hour ago',
    votes: 567,
  },
  {
    id: '4',
    user: 'BettingExpert',
    action: 'shared odds comparison for upcoming matches',
    timestamp: '2 hours ago',
    votes: 421,
  },
]

// TODO: Replace rankings[] - awaiting DB integration
// Used by: app/page.tsx (Top Teams section), components/RankingItem.tsx
// DB table: team_rankings (future)
export const rankings: Ranking[] = [
  {
    rank: 1,
    team: 'FaZe Clan',
    rating: 2847,
    change: 2,
  },
  {
    rank: 2,
    team: 'NAVI',
    rating: 2821,
    change: -1,
  },
  {
    rank: 3,
    team: 'Vitality',
    rating: 2798,
    change: 0,
  },
  {
    rank: 4,
    team: 'Liquid',
    rating: 2756,
    change: 1,
  },
  {
    rank: 5,
    team: 'Heroic',
    rating: 2734,
    change: -2,
  },
]

// TODO: Replace communityComments[] - DB table: comments (awaiting real integration)
// Used by: (currently unused in active pages)
export const communityComments: CommunityComment[] = [
  {
    id: '1',
    username: 'ClutchKing',
    avatar: '👤',
    timestamp: '2 hours ago',
    content: 'FaZe looking sharp right now. ropz and frozen have been on fire. I think they take this 2-0.',
    upvotes: 342,
    replies: 12,
  },
  {
    id: '2',
    username: 'MapVetoMaster',
    avatar: '👤',
    timestamp: '1 hour ago',
    content: 'The map veto will be crucial here. If NAVI can ban out Inferno and Nuke, they have a real shot. But FaZe\'s pool has improved so much this season.',
    upvotes: 287,
    replies: 8,
  },
  {
    id: '3',
    username: 'S1mpleFan',
    avatar: '👤',
    timestamp: '45 minutes ago',
    content: 's1mple has been unstoppable lately. If he shows up, NAVI can definitely compete. Expecting a close series.',
    upvotes: 256,
    replies: 15,
  },
  {
    id: '4',
    username: 'BetAnalyzer',
    avatar: '👤',
    timestamp: '30 minutes ago',
    content: 'Odds are slightly favoring FaZe but the value is on NAVI at these numbers. Their form against top teams has been solid.',
    upvotes: 198,
    replies: 6,
  },
  {
    id: '5',
    username: 'FormTracker',
    avatar: '👤',
    timestamp: '20 minutes ago',
    content: 'Recent form: FaZe 3-2 in last 5, NAVI 4-1. NAVI\'s form is better but FaZe plays better when it matters most.',
    upvotes: 421,
    replies: 9,
  },
]

export const communityPredictions: CommunityPrediction[] = [
  {
    id: '1',
    username: 'ClutchKing',
    prediction: 'FaZe 2-0',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    username: 'EcoMaster',
    prediction: 'FaZe 2-1',
    timestamp: '1 hour ago',
  },
  {
    id: '3',
    username: 'EntryFrag',
    prediction: 'NAVI 2-1',
    timestamp: '50 minutes ago',
  },
  {
    id: '4',
    username: 'S1mpleFan',
    prediction: 'NAVI 2-0',
    timestamp: '35 minutes ago',
  },
  {
    id: '5',
    username: 'BetAnalyzer',
    prediction: 'FaZe 2-1',
    timestamp: '20 minutes ago',
  },
]



export const relatedMatches: Match[] = [
  {
    id: '2',
    team1: { name: 'Vitality', logo: '💎' },
    team2: { name: 'Liquid', logo: '💧' },
    team1Players: [],
    team2Players: [],
    time: 'Today 19:30 UTC',
    tournament: 'PGL Major',
    sentiment: 68,
    prediction1: 45,
    prediction2: 55,
    evidenceScore: 7.9,
    status: 'upcoming',
    recentForm1: [],
    recentForm2: [],
    mapPoolAdvantage: '',
    headToHeadWins1: 0,
    headToHeadWins2: 0,
    reasons: [],
  },
  {
    id: '3',
    team1: { name: 'Heroic', logo: '⚔️' },
    team2: { name: 'Falcons', logo: '🦅' },
    team1Players: [],
    team2Players: [],
    time: 'Today 20:00 UTC',
    tournament: 'BLAST Premier',
    sentiment: 64,
    prediction1: 62,
    prediction2: 38,
    evidenceScore: 7.6,
    status: 'upcoming',
    recentForm1: [],
    recentForm2: [],
    mapPoolAdvantage: '',
    headToHeadWins1: 0,
    headToHeadWins2: 0,
    reasons: [],
  },
  {
    id: '4',
    team1: { name: 'ENCE', logo: '🔱' },
    team2: { name: 'Sprout', logo: '🌱' },
    team1Players: [],
    team2Players: [],
    time: 'Tomorrow 19:00 UTC',
    tournament: 'Pro League Season 2',
    sentiment: 61,
    prediction1: 55,
    prediction2: 45,
    evidenceScore: 7.2,
    status: 'upcoming',
    recentForm1: [],
    recentForm2: [],
    mapPoolAdvantage: '',
    headToHeadWins1: 0,
    headToHeadWins2: 0,
    reasons: [],
  },
  {
    id: '5',
    team1: { name: 'BIG', logo: '💪' },
    team2: { name: 'Complexity', logo: '🎯' },
    team1Players: [],
    team2Players: [],
    time: 'Tomorrow 21:00 UTC',
    tournament: 'ESL Pro League',
    sentiment: 59,
    prediction1: 51,
    prediction2: 49,
    evidenceScore: 6.9,
    status: 'upcoming',
    recentForm1: [],
    recentForm2: [],
    mapPoolAdvantage: '',
    headToHeadWins1: 0,
    headToHeadWins2: 0,
    reasons: [],
  },
]

export const matchTournament: MatchTournament = {
  name: 'ESL Pro League Season 21',
  stage: 'Finals',
  prizePool: '$750,000',
  teamCount: 8,
}

// TODO: Replace communityStats{} - awaiting DB integration
// Used by: app/community/page.tsx (Stats Grid)
// DB tables: users, community_activity
export const communityStats: CommunityStats = {
  totalMembers: 48750,
  activeUsers: 1243,
  postsToday: 348,
  commentsToday: 2891,
}

export const communityCategories: CommunityCategory[] = [
  { id: '1', name: 'Match Discussion', posts: 1243, viewing: 87, icon: '⚔️' },
  { id: '2', name: 'Betting Discussion', posts: 892, viewing: 64, icon: '💰' },
  { id: '3', name: 'Tournament Discussion', posts: 567, viewing: 43, icon: '🏆' },
  { id: '4', name: 'Team Analysis', posts: 432, viewing: 31, icon: '📊' },
  { id: '5', name: 'Roster Changes', posts: 298, viewing: 22, icon: '🔄' },
  { id: '6', name: 'Predictions', posts: 1876, viewing: 142, icon: '🎯' },
]

export const communityPosts: CommunityPost[] = [
  {
    id: '1',
    username: 'CS2Analyst',
    avatar: '👤',
    title: 'Spirit vs MOUZ - Deep dive into the map pool advantage',
    preview: 'Looking at the historical map pool data, Spirit has a significant advantage on Ancient and Nuke. However, MOUZ\'s recent form on Inferno has been outstanding. This match hinges entirely on the veto phase...',
    category: 'Match Discussion',
    replies: 45,
    views: 2340,
    upvotes: 189,
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    username: 'BettingGuru',
    avatar: '👤',
    title: 'Value bet alert: NAVI at +120 against current market',
    preview: 'The bookmakers have FaZe as favorites but the community sentiment data shows NAVI at 58% win probability. This creates significant value on the underdog. Key factors: s1mple\'s recent performance and map veto history...',
    category: 'Betting Discussion',
    replies: 78,
    views: 5670,
    upvotes: 342,
    timestamp: '4 hours ago',
  },
  {
    id: '3',
    username: 'RosterWatcher',
    avatar: '👤',
    title: 'Confirmed: Reports suggest major roster shuffle incoming for Liquid',
    preview: 'Multiple sources are reporting that Liquid is considering a roster change ahead of the Major. The community is speculating about which players might be affected and what the new lineup could look like...',
    category: 'Roster Changes',
    replies: 123,
    views: 8900,
    upvotes: 567,
    timestamp: '6 hours ago',
  },
  {
    id: '4',
    username: 'TournamentIntel',
    avatar: '👤',
    title: 'PGL Major 2026 seeding analysis - Group stage predictions',
    preview: 'Breaking down the seeding for the upcoming Major. Group A looks stacked with FaZe, NAVI, and Spirit all in the same group. This could lead to some early upset potential that savvy bettors should watch for...',
    category: 'Tournament Discussion',
    replies: 89,
    views: 12300,
    upvotes: 678,
    timestamp: '8 hours ago',
  },
  {
    id: '5',
    username: 'PredictionKing',
    avatar: '👤',
    title: 'My picks for this weekend\'s tournament matches',
    preview: 'After analyzing team form, map pools, and head-to-head records, here are my top predictions for the weekend. FaZe to overcome NAVI in a close 2-1, Vitality dominance on Vertigo, and an upset alert for Heroic vs Falcons...',
    category: 'Predictions',
    replies: 56,
    views: 3450,
    upvotes: 234,
    timestamp: '12 hours ago',
  },
  {
    id: '6',
    username: 'FormTracker',
    avatar: '👤',
    title: 'Team form guide: Who\'s hot and who\'s not heading into playoffs',
    preview: 'Comprehensive form guide for all teams heading into the playoff stage. FaZe has won 7 of their last 10, while NAVI has been inconsistent. Vitality surging, Heroic struggling. This breakdown includes recent match results and player performances...',
    category: 'Team Analysis',
    replies: 67,
    views: 4560,
    upvotes: 289,
    timestamp: '1 day ago',
  },
]

export const topContributors: TopContributor[] = [
  { rank: 1, username: 'ClutchKing', avatar: '👤', reputation: 12450, posts: 342, predictions: 287, accuracy: 78 },
  { rank: 2, username: 'BetAnalyzer', avatar: '👤', reputation: 11200, posts: 289, predictions: 245, accuracy: 74 },
  { rank: 3, username: 'MapVetoMaster', avatar: '👤', reputation: 9870, posts: 256, predictions: 198, accuracy: 71 },
  { rank: 4, username: 'FormTracker', avatar: '👤', reputation: 8450, posts: 198, predictions: 167, accuracy: 69 },
  { rank: 5, username: 'ESportsAnalyst', avatar: '👤', reputation: 7230, posts: 176, predictions: 145, accuracy: 67 },
  { rank: 6, username: 'ProPredictors', avatar: '👤', reputation: 6890, posts: 165, predictions: 134, accuracy: 65 },
  { rank: 7, username: 'EntryFrag', avatar: '👤', reputation: 5670, posts: 143, predictions: 112, accuracy: 63 },
  { rank: 8, username: 'S1mpleFan', avatar: '👤', reputation: 4320, posts: 121, predictions: 98, accuracy: 62 },
]

export const communityTags: CommunityTag[] = [
  { name: 'Spirit', posts: 342 },
  { name: 'FaZe', posts: 289 },
  { name: 'NAVI', posts: 267 },
  { name: 'Major 2026', posts: 234 },
  { name: 'Map Veto', posts: 198 },
  { name: 'Upset Alert', posts: 176 },
  { name: 'Odds Movement', posts: 154 },
  { name: 'Vitality', posts: 143 },
  { name: 'Liquid', posts: 132 },
  { name: 'Heroic', posts: 121 },
  { name: 'Roster News', posts: 109 },
  { name: 'Live Betting', posts: 98 },
]

export const trendingMatches = [
  { team1: 'Spirit', logo1: '🔥', team2: 'MOUZ', logo2: '💀', time: 'Today 20:00', tournament: 'ESL Pro League' },
  { team1: 'FaZe', logo1: '⚡', team2: 'NAVI', logo2: '🌊', time: 'Today 18:00', tournament: 'ESL Pro League' },
  { team1: 'Vitality', logo1: '💎', team2: 'Liquid', logo2: '💧', time: 'Tomorrow 16:00', tournament: 'PGL Major' },
]

export const newestMembers: NewMember[] = [
  { username: 'CS2Newbie', avatar: '👤', joinedDate: 'Joined today' },
  { username: 'BettingPro2026', avatar: '👤', joinedDate: 'Joined 2 hours ago' },
  { username: 'MapExpert', avatar: '👤', joinedDate: 'Joined 5 hours ago' },
  { username: 'FormAnalyst', avatar: '👤', joinedDate: 'Joined 8 hours ago' },
  { username: 'TournamentGuy', avatar: '👤', joinedDate: 'Joined 1 day ago' },
]

export const profileStats: ProfileStats = {
  reputation: 12450,
  totalPosts: 342,
  comments: 1287,
  predictionsMade: 287,
  predictionAccuracy: 78,
  upvotesReceived: 8456,
}

export const profileActivities: ProfileActivity[] = [
  {
    id: '1',
    type: 'prediction',
    description: 'Predicted Spirit 2-1 over FaZe',
    timestamp: '2 hours ago',
    icon: '🎯',
  },
  {
    id: '2',
    type: 'comment',
    description: 'Commented on NAVI vs MOUZ map veto analysis',
    timestamp: '4 hours ago',
    icon: '💬',
  },
  {
    id: '3',
    type: 'post',
    description: 'Posted "Spirit vs FaZe - Deep dive map pool analysis"',
    timestamp: '6 hours ago',
    icon: '📝',
  },
  {
    id: '4',
    type: 'upvote',
    description: 'Received 47 upvotes on prediction thread',
    timestamp: '8 hours ago',
    icon: '⬆️',
  },
  {
    id: '5',
    type: 'prediction',
    description: 'Predicted Vitality 2-0 over Liquid',
    timestamp: '12 hours ago',
    icon: '🎯',
  },
  {
    id: '6',
    type: 'comment',
    description: 'Commented on roster change discussion for Liquid',
    timestamp: '1 day ago',
    icon: '💬',
  },
  {
    id: '7',
    type: 'post',
    description: 'Posted "Underdog value bets for Major qualifiers"',
    timestamp: '1 day ago',
    icon: '📝',
  },
]

export const predictionHistory: PredictionHistory[] = [
  {
    id: '1',
    match: 'Spirit vs FaZe',
    team1: 'Spirit',
    team2: 'FaZe',
    prediction: 'Spirit 2-1',
    date: 'May 29, 2026',
    result: 'correct',
  },
  {
    id: '2',
    match: 'NAVI vs MOUZ',
    team1: 'NAVI',
    team2: 'MOUZ',
    prediction: 'NAVI 2-0',
    date: 'May 28, 2026',
    result: 'correct',
  },
  {
    id: '3',
    match: 'Vitality vs Liquid',
    team1: 'Vitality',
    team2: 'Liquid',
    prediction: 'Vitality 2-1',
    date: 'May 27, 2026',
    result: 'incorrect',
  },
  {
    id: '4',
    match: 'FaZe vs NAVI',
    team1: 'FaZe',
    team2: 'NAVI',
    prediction: 'FaZe 2-0',
    date: 'May 25, 2026',
    result: 'correct',
  },
  {
    id: '5',
    match: 'Heroic vs Falcons',
    team1: 'Heroic',
    team2: 'Falcons',
    prediction: 'Falcons 2-1',
    date: 'May 24, 2026',
    result: 'correct',
  },
  {
    id: '6',
    match: 'Spirit vs MOUZ',
    team1: 'Spirit',
    team2: 'MOUZ',
    prediction: 'MOUZ 2-1',
    date: 'May 22, 2026',
    result: 'incorrect',
  },
]

export const topAnalysisPosts: TopAnalysisPost[] = [
  {
    id: '1',
    title: 'Spirit vs FaZe - Deep dive into map pool advantage',
    views: 8420,
    replies: 156,
    upvotes: 447,
    date: 'May 29, 2026',
    category: 'Match Discussion',
  },
  {
    id: '2',
    title: 'NAVI vs MOUZ map veto analysis - Why NAVI has the edge',
    views: 6230,
    replies: 98,
    upvotes: 312,
    date: 'May 27, 2026',
    category: 'Team Analysis',
  },
  {
    id: '3',
    title: 'Underdog value bets for Major qualifiers weekend',
    views: 9100,
    replies: 234,
    upvotes: 567,
    date: 'May 24, 2026',
    category: 'Betting Discussion',
  },
  {
    id: '4',
    title: 'Why Liquid roster change makes sense - tactical breakdown',
    views: 12300,
    replies: 187,
    upvotes: 678,
    date: 'May 20, 2026',
    category: 'Roster Changes',
  },
]

export const reputationSources: ReputationSource[] = [
  { label: 'Community Upvotes', points: 4234, maxPoints: 5000, icon: '⬆️' },
  { label: 'Accurate Predictions', points: 3567, maxPoints: 4000, icon: '🎯' },
  { label: 'Helpful Comments', points: 2890, maxPoints: 3500, icon: '💬' },
  { label: 'Analysis Contributions', points: 1759, maxPoints: 2000, icon: '📊' },
]

export const achievements: Achievement[] = [
  { id: '1', name: 'Early Member', description: 'Joined within the first 1000 members', icon: '🌟', unlocked: true, unlockedDate: 'Jan 2024' },
  { id: '2', name: 'Top Analyst', description: 'Reached top 10 contributors', icon: '🏆', unlocked: true, unlockedDate: 'Mar 2026' },
  { id: '3', name: 'Prediction Expert', description: '70%+ prediction accuracy over 50+ predictions', icon: '🎯', unlocked: true, unlockedDate: 'Apr 2026' },
  { id: '4', name: '100 Comments', description: 'Posted 100+ community comments', icon: '💬', unlocked: true, unlockedDate: 'Feb 2026' },
  { id: '5', name: 'Major Contributor', description: 'Reached 500 total contributions', icon: '⭐', unlocked: true, unlockedDate: 'May 2026' },
  { id: '6', name: 'Betting Guru', description: '50+ successful betting recommendations', icon: '💰', unlocked: false },
  { id: '7', name: 'Tournament Oracle', description: 'Correctly predicted 3 Major outcomes', icon: '🏅', unlocked: false },
  { id: '8', name: 'Legend', description: 'Reached 10,000 reputation', icon: '👑', unlocked: false },
]

export const favoriteTeams: FavoriteTeam[] = [
  { name: 'Spirit', logo: '🔥', followedSince: 'Jan 2024' },
  { name: 'FaZe', logo: '⚡', followedSince: 'Feb 2024' },
  { name: 'NAVI', logo: '🌊', followedSince: 'Mar 2024' },
  { name: 'Vitality', logo: '💎', followedSince: 'Jun 2024' },
]

export const recentFollowers: RecentFollower[] = [
  { username: 'BettingGuru', avatar: '👤', followedDate: '2 hours ago' },
  { username: 'ESportsAnalyst', avatar: '👤', followedDate: '5 hours ago' },
  { username: 'MapVetoMaster', avatar: '👤', followedDate: '1 day ago' },
  { username: 'ClutchKing', avatar: '👤', followedDate: '2 days ago' },
  { username: 'ProPredictors', avatar: '👤', followedDate: '3 days ago' },
]

export const communityStanding: CommunityStanding = {
  rank: 3,
  totalMembers: 48750,
  percentile: 99.4,
}



export const rankingTeams: RankingTeam[] = [
  {
    rank: 1,
    name: 'Spirit',
    logo: '🔥',
    rating: 2847,
    winRate: 78,
    form: ['W','W','W','L','W'],
    change: 2,
    bestMap: 'Ancient',
    worstMap: 'Inferno',
    keyPlayer: 'magixx',
    country: '🇷🇺',
  },
  {
    rank: 2,
    name: 'FaZe Clan',
    logo: '⚡',
    rating: 2834,
    winRate: 75,
    form: ['W','L','W','W','W'],
    change: 1,
    bestMap: 'Overpass',
    worstMap: 'Nuke',
    keyPlayer: 'ropz',
    country: '🇪🇺',
  },
  {
    rank: 3,
    name: 'NAVI',
    logo: '🌊',
    rating: 2821,
    winRate: 73,
    form: ['W','W','L','W','L'],
    change: -1,
    bestMap: 'Mirage',
    worstMap: 'Anubis',
    keyPlayer: 's1mple',
    country: '🇺🇦',
  },
  {
    rank: 4,
    name: 'Vitality',
    logo: '💎',
    rating: 2798,
    winRate: 72,
    form: ['L','W','W','W','W'],
    change: 0,
    bestMap: 'Vertigo',
    worstMap: 'Ancient',
    keyPlayer: 'ZywOo',
    country: '🇫🇷',
  },
  {
    rank: 5,
    name: 'Liquid',
    logo: '💧',
    rating: 2756,
    winRate: 68,
    form: ['W','W','L','L','W'],
    change: 1,
    bestMap: 'Inferno',
    worstMap: 'Overpass',
    keyPlayer: 'EliGE',
    country: '🇺🇸',
  },
  {
    rank: 6,
    name: 'Heroic',
    logo: '⚔️',
    rating: 2734,
    winRate: 65,
    form: ['L','L','W','W','L'],
    change: -2,
    bestMap: 'Nuke',
    worstMap: 'Mirage',
    keyPlayer: 'cadiaN',
    country: '🇩🇰',
  },
  {
    rank: 7,
    name: 'MOUZ',
    logo: '💀',
    rating: 2712,
    winRate: 64,
    form: ['W','L','L','W','W'],
    change: 2,
    bestMap: 'Inferno',
    worstMap: 'Vertigo',
    keyPlayer: 'frozen',
    country: '🇩🇪',
  },
  {
    rank: 8,
    name: 'Falcons',
    logo: '🦅',
    rating: 2698,
    winRate: 62,
    form: ['L','W','W','L','W'],
    change: -1,
    bestMap: 'Anubis',
    worstMap: 'Nuke',
    keyPlayer: 'm0NESY',
    country: '🇹🇷',
  },
  {
    rank: 9,
    name: 'ENCE',
    logo: '🔱',
    rating: 2687,
    winRate: 61,
    form: ['W','W','L','L','L'],
    change: 0,
    bestMap: 'Anubis',
    worstMap: 'Inferno',
    keyPlayer: 'Snappi',
    country: '🇫🇮',
  },
  {
    rank: 10,
    name: 'Complexity',
    logo: '🎯',
    rating: 2665,
    winRate: 58,
    form: ['L','W','L','W','L'],
    change: -1,
    bestMap: 'Mirage',
    worstMap: 'Ancient',
    keyPlayer: 'floSid',
    country: '🇺🇸',
  },
]

export const rankingMovers: RankingMover[] = [
  {
    team: 'Spirit',
    logo: '🔥',
    change: 2,
    direction: 'up',
    reason: 'Strong PGL Major performance',
  },
  {
    team: 'MOUZ',
    logo: '💀',
    change: 2,
    direction: 'up',
    reason: 'Won 4 of last 5 matches',
  },
  {
    team: 'Heroic',
    logo: '⚔️',
    change: 2,
    direction: 'down',
    reason: 'Early exit from BLAST',
  },
  {
    team: 'Falcons',
    logo: '🦅',
    change: 1,
    direction: 'down',
    reason: 'Close series loss to Liquid',
  },
]

export const rankingUpcoming: RankingUpcoming[] = [
  {
    team1: 'Spirit',
    team2: 'FaZe',
    tournament: 'ESL Pro League S21',
    time: 'Today 18:00',
    impact: 'high',
  },
  {
    team1: 'NAVI',
    team2: 'Vitality',
    tournament: 'ESL Pro League S21',
    time: 'Today 20:30',
    impact: 'high',
  },
  {
    team1: 'Heroic',
    team2: 'Liquid',
    tournament: 'ESL Pro League S21',
    time: 'Fri 20:00',
    impact: 'medium',
  },
]



export const leaderboardStats: LeaderboardStats = {
  totalMembers: 48750,
  totalPredictions: 234500,
  averageAccuracy: 64,
  activeAnalysts: 3842,
}

export const leaderboardUsers: LeaderboardUser[] = [
  { id: '1', rank: 1, username: 'ClutchKing', avatar: '👑', intelScore: 12450, accuracy: 78, predictions: 287, posts: 342, comments: 1287, streak: 12, change: 2, joinedDate: 'Jan 2024', bestPost: 'Spirit vs FaZe Deep Dive', achievements: ['Top Analyst', 'Prediction Expert'] },
  { id: '2', rank: 2, username: 'BetAnalyzer', avatar: '📊', intelScore: 11200, accuracy: 74, predictions: 245, posts: 289, comments: 956, streak: 8, change: 1, joinedDate: 'Feb 2024', bestPost: 'Value Bet Framework', achievements: ['100 Correct'] },
  { id: '3', rank: 3, username: 'MapVetoMaster', avatar: '🗺️', intelScore: 9870, accuracy: 71, predictions: 198, posts: 256, comments: 834, streak: 5, change: -1, joinedDate: 'Mar 2024', bestPost: 'Map Veto System', achievements: ['Major Contributor'] },
  { id: '4', rank: 4, username: 'FormTracker', avatar: '📈', intelScore: 8450, accuracy: 69, predictions: 167, posts: 198, comments: 723, streak: 4, change: 0, joinedDate: 'Mar 2024', bestPost: 'Team Form Guide Q2' },
  { id: '5', rank: 5, username: 'ESportsAnalyst', avatar: '🎯', intelScore: 7230, accuracy: 67, predictions: 145, posts: 176, comments: 645, streak: 3, change: 2, joinedDate: 'Apr 2024', bestPost: 'Major Seed Analysis' },
  { id: '6', rank: 6, username: 'ProPredictors', avatar: '🔮', intelScore: 6890, accuracy: 65, predictions: 134, posts: 165, comments: 589, streak: 6, change: -1, joinedDate: 'Apr 2024', bestPost: 'Weekend Picks May' },
  { id: '7', rank: 7, username: 'EntryFrag', avatar: '💥', intelScore: 5670, accuracy: 63, predictions: 112, posts: 143, comments: 512, streak: 2, change: 3, joinedDate: 'May 2024', bestPost: 'Opening Duel Stats' },
  { id: '8', rank: 8, username: 'S1mpleFan', avatar: '⭐', intelScore: 4320, accuracy: 62, predictions: 98, posts: 121, comments: 478, streak: 1, change: 0, joinedDate: 'May 2024', bestPost: 'Rating 2.0 Breakdown' },
  { id: '9', rank: 9, username: 'CS2Newbie', avatar: '🌱', intelScore: 3210, accuracy: 58, predictions: 67, posts: 89, comments: 345, streak: 2, change: 5, joinedDate: 'Jun 2024', bestPost: 'First Major Analysis' },
  { id: '10', rank: 10, username: 'BettingPro2026', avatar: '💰', intelScore: 2890, accuracy: 60, predictions: 78, posts: 95, comments: 312, streak: 4, change: -2, joinedDate: 'Jun 2024', bestPost: 'Live Bet Framework' },
]

export const analystOfTheWeek: LeaderboardUser = {
  id: '1',
  rank: 1,
  username: 'ClutchKing',
  avatar: '👑',
  intelScore: 12450,
  accuracy: 78,
  predictions: 287,
  posts: 342,
  comments: 1287,
  streak: 12,
  change: 2,
  joinedDate: 'Jan 2024',
  bestPost: 'Spirit vs FaZe - Deep dive map pool analysis',
  achievements: ['Top Analyst', 'Prediction Expert', '100 Correct', 'Major Contributor'],
}

export const risingStars: RisingStar[] = [
  { id: 'r1', username: 'CS2Newbie', avatar: '🌱', joinedDate: 'Jun 2024', scoreGained: 890, accuracy: 58 },
  { id: 'r2', username: 'DeepDiver', avatar: '🔍', joinedDate: 'Apr 2024', scoreGained: 1240, accuracy: 71 },
  { id: 'r3', username: 'BettingPro2026', avatar: '💰', joinedDate: 'Jun 2024', scoreGained: 650, accuracy: 60 },
  { id: 'r4', username: 'MapExpert', avatar: '🗺️', joinedDate: 'May 2024', scoreGained: 980, accuracy: 66 },
  { id: 'r5', username: 'FormAnalyst', avatar: '📈', joinedDate: 'May 2024', scoreGained: 1120, accuracy: 69 },
  { id: 'r6', username: 'EntryKing', avatar: '💥', joinedDate: 'Apr 2024', scoreGained: 1450, accuracy: 73 },
]

export const recentAchievements: RecentAchievement[] = [
  { id: 'a1', username: 'ClutchKing', avatar: '👑', achievement: 'Prediction Expert', timestamp: '2 hours ago' },
  { id: 'a2', username: 'BetAnalyzer', avatar: '📊', achievement: '100 Correct Predictions', timestamp: '5 hours ago' },
  { id: 'a3', username: 'MapVetoMaster', avatar: '🗺️', achievement: 'Top Analyst', timestamp: '1 day ago' },
  { id: 'a4', username: 'FormTracker', avatar: '📈', achievement: 'Major Contributor', timestamp: '2 days ago' },
  { id: 'a5', username: 'ProPredictors', avatar: '🔮', achievement: 'Rising Star', timestamp: '2 days ago' },
  { id: 'a6', username: 'EntryFrag', avatar: '💥', achievement: '50 Predictions', timestamp: '3 days ago' },
]

export const leaderboardRules: LeaderboardRule[] = [
  { title: 'Fair Play', description: 'No manipulation, boosting, or coordinated voting' },
  { title: 'Activity Required', description: 'Users inactive for 90+ days are archived' },
  { title: 'Score Decay', description: 'Inactive users lose 1% score per week after 60 days' },
  { title: 'Season Reset', description: 'Leaderboard resets quarterly with carry-over bonuses' },
  { title: 'Verification', description: 'Top 100 require email verification to qualify' },
]

export const scoreComponents: ScoreComponent[] = [
  { label: 'Correct Predictions', description: '+10 pts each', icon: '🎯' },
  { label: 'Quality Posts', description: '+5 pts per upvote', icon: '📝' },
  { label: 'Helpful Comments', description: '+2 pts per upvote', icon: '💬' },
  { label: 'Analyst Badges', description: '+50-200 bonus', icon: '⭐' },
  { label: 'Streak Bonuses', description: '+10% multiplier', icon: '🔥' },
  { label: 'Accuracy Bonus', description: '+5% above 70%', icon: '📊' },
]

export const predictionMatches: PredictionMatch[] = [
  {
    id: 'pm1',
    team1: 'Spirit',
    team2: 'FaZe',
    logo1: '🔥',
    logo2: '⚡',
    time: 'Today 18:00',
    tournament: 'ESL Pro League Season 21',
    prediction1: 72,
    prediction2: 28,
    status: 'upcoming',
  },
  {
    id: 'pm2',
    team1: 'NAVI',
    team2: 'MOUZ',
    logo1: '🌊',
    logo2: '💀',
    time: 'Today 20:30',
    tournament: 'ESL Pro League Season 21',
    prediction1: 64,
    prediction2: 36,
    status: 'upcoming',
  },
  {
    id: 'pm3',
    team1: 'Vitality',
    team2: 'Liquid',
    logo1: '💎',
    logo2: '💧',
    time: 'Tomorrow 16:00',
    tournament: 'PGL Major 2026',
    prediction1: 58,
    prediction2: 42,
    status: 'upcoming',
  },
  {
    id: 'pm4',
    team1: 'Heroic',
    team2: 'Falcons',
    logo1: '⚔️',
    logo2: '🦅',
    time: 'Today 22:00',
    tournament: 'ESL Pro League Season 21',
    prediction1: 45,
    prediction2: 55,
    status: 'live',
  },
  {
    id: 'pm5',
    team1: 'ENCE',
    team2: 'BIG',
    logo1: '🔱',
    logo2: '💪',
    time: 'Tomorrow 19:00',
    tournament: 'BLAST Premier Spring 2026',
    prediction1: 51,
    prediction2: 49,
    status: 'upcoming',
  },
]

export const communityConsensus: CommunityConsensus[] = [
  { id: 'cc1', team1: 'Spirit', team2: 'FaZe', logo1: '🔥', logo2: '⚡', percentage: 72, confidence: 'high', totalPredictions: 3847 },
  { id: 'cc2', team1: 'NAVI', team2: 'MOUZ', logo1: '🌊', logo2: '💀', percentage: 64, confidence: 'high', totalPredictions: 2956 },
  { id: 'cc3', team1: 'Vitality', team2: 'Liquid', logo1: '💎', logo2: '💧', percentage: 58, confidence: 'medium', totalPredictions: 2134 },
  { id: 'cc4', team1: 'FaZe', team2: 'NAVI', logo1: '⚡', logo2: '🌊', percentage: 55, confidence: 'medium', totalPredictions: 4123 },
  { id: 'cc5', team1: 'Heroic', team2: 'Falcons', logo1: '⚔️', logo2: '🦅', percentage: 48, confidence: 'low', totalPredictions: 1567 },
  { id: 'cc6', team1: 'MOUZ', team2: 'Spirit', logo1: '💀', logo2: '🔥', percentage: 61, confidence: 'medium', totalPredictions: 1890 },
]

export const topPredictors: TopPredictor[] = [
  { id: 'tp1', username: 'ClutchKing', avatar: '👑', accuracy: 78, intelScore: 12450, streak: 12 },
  { id: 'tp2', username: 'BetAnalyzer', avatar: '📊', accuracy: 74, intelScore: 11200, streak: 8 },
  { id: 'tp3', username: 'MapVetoMaster', avatar: '🗺️', accuracy: 71, intelScore: 9870, streak: 5 },
  { id: 'tp4', username: 'FormTracker', avatar: '📈', accuracy: 69, intelScore: 8450, streak: 4 },
  { id: 'tp5', username: 'ProPredictors', avatar: '🔮', accuracy: 65, intelScore: 6890, streak: 6 },
]

export const myPredictions: MyPrediction[] = [
  { id: 'mp1', match: 'Spirit vs FaZe', prediction: 'Spirit 2-1', result: 'correct', date: 'May 29, 2026' },
  { id: 'mp2', match: 'NAVI vs MOUZ', prediction: 'NAVI 2-0', result: 'correct', date: 'May 28, 2026' },
  { id: 'mp3', match: 'Vitality vs Liquid', prediction: 'Vitality 2-1', result: 'incorrect', date: 'May 27, 2026' },
  { id: 'mp4', match: 'FaZe vs NAVI', prediction: 'FaZe 2-0', result: 'correct', date: 'May 25, 2026' },
  { id: 'mp5', match: 'Heroic vs Falcons', prediction: 'Falcons 2-1', result: 'pending', date: 'May 30, 2026' },
  { id: 'mp6', match: 'Spirit vs MOUZ', prediction: 'MOUZ 2-1', result: 'incorrect', date: 'May 22, 2026' },
]

export const recentCommunityPicks: RecentCommunityPick[] = [
  { id: 'rcp1', username: 'ClutchKing', avatar: '👑', match: 'Spirit vs FaZe', prediction: 'Spirit 2-1', timestamp: '2 hours ago' },
  { id: 'rcp2', username: 'BetAnalyzer', avatar: '📊', match: 'NAVI vs MOUZ', prediction: 'NAVI 2-0', timestamp: '4 hours ago' },
  { id: 'rcp3', username: 'MapVetoMaster', avatar: '🗺️', match: 'Vitality vs Liquid', prediction: 'Vitality 2-0', timestamp: '5 hours ago' },
  { id: 'rcp4', username: 'FormTracker', avatar: '📈', match: 'Heroic vs Falcons', prediction: 'Heroic 2-1', timestamp: '6 hours ago' },
  { id: 'rcp5', username: 'ProPredictors', avatar: '🔮', match: 'ENCE vs BIG', prediction: 'ENCE 2-0', timestamp: '8 hours ago' },
  { id: 'rcp6', username: 'EntryFrag', avatar: '💥', match: 'MOUZ vs Spirit', prediction: 'MOUZ 2-1', timestamp: '10 hours ago' },
]

export const predictionRules: PredictionRule[] = [
  { title: 'One prediction per match', description: 'You may only submit one prediction per match. Edit allowed until match start.' },
  { title: 'Scoring system', description: 'Correct prediction = +10 points. Wrong prediction = -3 points.' },
  { title: 'Streak multipliers', description: 'Consecutive correct predictions increase your streak multiplier up to 2x.' },
  { title: 'Season resets', description: 'Predictions reset each season. Carry-over bonuses awarded to top 100.' },
]

export const seasonStats: SeasonStat[] = [
  { label: 'Current Season', value: 'Q2 2026' },
  { label: 'Time Remaining', value: '28 days' },
  { label: 'Prize Pool', value: '$5,000' },
  { label: 'Top 10 Bonus', value: '+20% Score' },
  { label: 'Your Rank', value: '#3,847' },
  { label: 'Your Accuracy', value: '71%' },
]



export const quickActions: QuickAction[] = [
  { title: 'Create Intel Post', description: 'Publish new analysis', icon: '📝', href: '#' },
  { title: 'Create Blog Post', description: 'Write an article', icon: '📰', href: '#' },
  { title: 'Feature Discussion', description: 'Pin to community', icon: '📌', href: '#' },
  { title: 'Add Match', description: 'Schedule new fixture', icon: '⚔️', href: '#' },
  { title: 'Edit Rankings', description: 'Update team ratings', icon: '🏆', href: '#' },
  { title: 'Send Announcement', description: 'Notify all users', icon: '📢', href: '#' },
]



export const adminBlogPosts = [
  { id: 'abp1', title: 'PGL Major 2026: Complete Group Stage Breakdown', author: 'CSIntelTeam', date: 'May 29, 2026', status: 'published', views: 12400, featured: true, preview: 'Analysis of the group stage...', readTime: '8 min', category: 'Analysis' },
  { id: 'abp2', title: 'Why Map Veto Analysis is the Missing Piece', author: 'BetAnalyzer', date: 'May 28, 2026', status: 'published', views: 8900, featured: false, preview: 'Map veto changes everything...', readTime: '5 min', category: 'Analysis' },
  { id: 'abp3', title: 'Spirit vs FaZe: Why the Odds are Wrong', author: 'ClutchKing', date: 'May 27, 2026', status: 'under_review', views: 15200, featured: false, preview: 'Market mispricing detected...', readTime: '6 min', category: 'Betting' },
  { id: 'abp4', title: 'The Meta Shift: How Active Duty Changes Pro CS2', author: 'MapVetoMaster', date: 'May 26, 2026', status: 'draft', views: 0, featured: false, preview: 'The active duty map pool shift...', readTime: '10 min', category: 'Meta' },
  { id: 'abp5', title: 'NAVI Roster Stability: Why Continuity Wins', author: 'ESportsAnalyst', date: 'May 25, 2026', status: 'published', views: 9200, featured: false, preview: 'NAVI keeps the same core...', readTime: '4 min', category: 'Teams' },
] as AdminBlogPost[]

export const adminIntelPosts: AdminIntelPost[] = [
  { id: 'aip1', title: 'Spirit vs FaZe - Deep Dive Analysis', author: 'ClutchKing', date: 'May 29, 2026', status: 'featured', category: 'Match Analysis' },
  { id: 'aip2', title: 'NAVI vs MOUZ Map Veto Breakdown', author: 'MapVetoMaster', date: 'May 28, 2026', status: 'published', category: 'Team Analysis' },
  { id: 'aip3', title: 'Underdog Value Bets for Major Qualifiers', author: 'BetAnalyzer', date: 'May 27, 2026', status: 'published', category: 'Betting' },
  { id: 'aip4', title: 'Liquid Roster Change Impact Analysis', author: 'RosterWatcher', date: 'May 26, 2026', status: 'published', category: 'Roster Changes' },
]

export const intelPosts: IntelPost[] = adminIntelPosts.map((post) => ({
  id: post.id,
  title: post.title,
  category: post.category as IntelPost['category'],
  timestamp: post.date,
  comments: Math.floor(Math.random() * 50),
}))

export const blogPosts: BlogPost[] = adminBlogPosts.map((post) => ({
  id: post.id,
  title: post.title,
  category: post.category as BlogPost['category'],
  preview: post.preview || '',
  date: post.date,
  readTime: post.readTime || '5 min',
  featured: post.featured || false,
  views: post.views,
}))

export const adminDiscussions: AdminDiscussion[] = [
  { id: 'ad1', title: 'Is Spirit overrated at current odds?', author: 'CS2Analyst', date: 'May 29, 2026', status: 'active', replies: 156 },
  { id: 'ad2', title: 'Best underdog pick of the day?', author: 'BettingGuru', date: 'May 29, 2026', status: 'active', replies: 89 },
  { id: 'ad3', title: 'Can FaZe win the Major?', author: 'ClutchKing', date: 'May 28, 2026', status: 'flagged', replies: 234 },
  { id: 'ad4', title: 'Most improved player of 2026?', author: 'FormTracker', date: 'May 28, 2026', status: 'active', replies: 178 },
  { id: 'ad5', title: 'Map veto analysis: Vitality vs Liquid', author: 'MapVetoMaster', date: 'May 27, 2026', status: 'locked', replies: 67 },
]

export const reportItems: ReportItem[] = [
  { id: 'ri1', type: 'Comment', content: 'Spam link in discussion thread #4521', reason: 'Spam / Self-promotion', reporter: 'AutoMod', date: '2 minutes ago', status: 'pending' },
  { id: 'ri2', type: 'Post', content: 'Inappropriate language in "Most improved player" thread', reason: 'Harassment', reporter: 'ClutchKing', date: '15 minutes ago', status: 'pending' },
  { id: 'ri3', type: 'Comment', content: 'Manipulated upvote pattern detected', reason: 'Vote manipulation', reporter: 'System', date: '1 hour ago', status: 'pending' },
  { id: 'ri4', type: 'Post', content: 'False prediction flagged by community', reason: 'Misinformation', reporter: 'BetAnalyzer', date: '3 hours ago', status: 'resolved' },
]

export const adminMatches: AdminMatch[] = [
  { id: 'am1', team1: 'Spirit', team2: 'FaZe', tournament: 'ESL Pro League S21', time: 'Today 18:00', status: 'upcoming', featured: true },
  { id: 'am2', team1: 'NAVI', team2: 'MOUZ', tournament: 'ESL Pro League S21', time: 'Today 20:30', status: 'upcoming', featured: false },
  { id: 'am3', team1: 'Vitality', team2: 'Liquid', tournament: 'PGL Major 2026', time: 'Tomorrow 16:00', status: 'upcoming', featured: true },
  { id: 'am4', team1: 'Heroic', team2: 'Falcons', tournament: 'ESL Pro League S21', time: 'Today 22:00', status: 'completed', result: 'team1_win', featured: false },
  { id: 'am5', team1: 'ENCE', team2: 'BIG', tournament: 'BLAST Premier', time: 'Yesterday', status: 'completed', result: 'team2_win', featured: false },
  { id: 'am6', team1: 'Spirit', team2: 'MOUZ', tournament: 'ESL Pro League S21', time: 'Yesterday', status: 'completed', result: 'draw', featured: false },
]


// TODO: The following mock data arrays are transitional.
// All need DB integration: teams, tournaments, matches, predictions, users,
// intel_posts, blog_posts, community_posts




// Admin dashboard mock data
export const adminStats: AdminStat[] = [
  { label: 'Total Users', value: 12500, change: 12 },
  { label: 'Total Matches', value: 42, change: 8 },
  { label: 'Total Predictions', value: 2847, change: 15 },
  { label: 'Intel Posts', value: 156 },
  { label: 'Blog Posts', value: 89 },
]

export const adminActivities: AdminActivity[] = [
  { id: '1', action: 'User login spike', user: 'System', timestamp: '1 hour ago', icon: '??' },
  { id: '2', action: 'New prediction submitted', user: 'ClutchKing', timestamp: '2 hours ago', icon: '??' },
]

export const analyticsData: AnalyticsCard[] = [
  { title: 'Page Views', value: '12.4K', change: 12, chart: 'up' },
  { title: 'Active Users', value: '1.2K', change: 8, chart: 'up' },
]

export const adminNotes: AdminNote[] = [
  { title: 'API Update', content: 'Remember to deploy the new prediction endpoint.', date: 'Today' },
]

export const platformStatus: PlatformStatus[] = [
  { service: 'Database', status: 'operational', uptime: '99.9%' },
  { service: 'API', status: 'operational', uptime: '100%' },
]

export const recentAlerts: Alert[] = [
  { id: '1', severity: 'info', message: 'Scheduled maintenance in 2 hours', timestamp: 'Now' },
]


