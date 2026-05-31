import type { Match, IntelPost, CommunityActivity, Ranking, CommunityComment, CommunityPrediction, IntelUpdate, MatchTournament, CommunityDiscussion, CommunityPost, TopContributor, CommunityCategory, CommunityStats, CommunityTag, NewMember, ProfileStats, ProfileActivity, PredictionHistory, TopAnalysisPost, ReputationSource, Achievement, FavoriteTeam, RecentFollower, CommunityStanding, ScheduleMatch, QuickStat, RankingTeam, RankingMover, RankingUpcoming, BlogPost, LeaderboardUser, LeaderboardStats, RisingStar, RecentAchievement, LeaderboardRule, ScoreComponent, PredictionMatch, CommunityConsensus, TopPredictor, MyPrediction, RecentCommunityPick, PredictionRule, SeasonStat, AdminStat, QuickAction, AdminActivity, AdminBlogPost, AdminIntelPost, AdminDiscussion, ReportItem, AdminMatch, AnalyticsCard, AdminNote, PlatformStatus, Alert } from './types'

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

export const featuredMatch: Match = {
  id: 'featured',
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
  tournament: 'ESL Pro League Season 21 Finals',
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
}

export const intelPosts: IntelPost[] = [
  {
    id: '1',
    title: 'FaZe Clan announces roster strengthening ahead of Major',
    category: 'roster-change',
    timestamp: '2 hours ago',
    comments: 124,
  },
  {
    id: '2',
    title: 'NAVI dominates Mirage with 77% win rate this season',
    category: 'team-form',
    timestamp: '4 hours ago',
    comments: 89,
  },
  {
    id: '3',
    title: 'PGL Major 2024 bracket announced - Full schedule inside',
    category: 'tournament',
    timestamp: '6 hours ago',
    comments: 234,
  },
  {
    id: '4',
    title: 'Market odds shift: Vitality drops to 1.85 after recent loss',
    category: 'betting',
    timestamp: '8 hours ago',
    comments: 156,
  },
]

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
    confidence: 85,
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    username: 'EcoMaster',
    prediction: 'FaZe 2-1',
    confidence: 72,
    timestamp: '1 hour ago',
  },
  {
    id: '3',
    username: 'EntryFrag',
    prediction: 'NAVI 2-1',
    confidence: 68,
    timestamp: '50 minutes ago',
  },
  {
    id: '4',
    username: 'S1mpleFan',
    prediction: 'NAVI 2-0',
    confidence: 45,
    timestamp: '35 minutes ago',
  },
  {
    id: '5',
    username: 'BetAnalyzer',
    prediction: 'FaZe 2-1',
    confidence: 78,
    timestamp: '20 minutes ago',
  },
]

export const intelUpdates: IntelUpdate[] = [
  {
    id: '1',
    content: 'FaZe Clan have won 5 of their last 6 matches on Inferno.',
    timestamp: '3 hours ago',
    icon: '📈',
  },
  {
    id: '2',
    content: 'NAVI shifted their Mirage strategy after last tournament.',
    timestamp: '2 hours ago',
    icon: '🔄',
  },
  {
    id: '3',
    content: 'Bookmakers shortened FaZe from 1.92 to 1.85.',
    timestamp: '1 hour ago',
    icon: '💰',
  },
  {
    id: '4',
    content: 'ropz rated as top 10 player in ESL Pro League standings.',
    timestamp: '50 minutes ago',
    icon: '⭐',
  },
  {
    id: '5',
    content: 's1mple\'s rating has improved 0.08 points this month.',
    timestamp: '30 minutes ago',
    icon: '📊',
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

export const communityStats: CommunityStats = {
  totalMembers: 48750,
  activeUsers: 1243,
  postsToday: 348,
  commentsToday: 2891,
}

export const communityDiscussions: CommunityDiscussion[] = [
  {
    id: '1',
    title: 'Is Spirit overrated at current odds?',
    replies: 156,
    views: 8420,
    upvotes: 447,
    lastActivity: '3 min ago',
  },
  {
    id: '2',
    title: 'Best underdog pick of the day?',
    replies: 89,
    views: 5230,
    upvotes: 312,
    lastActivity: '12 min ago',
  },
  {
    id: '3',
    title: 'Can FaZe win the Major?',
    replies: 234,
    views: 12400,
    upvotes: 678,
    lastActivity: '28 min ago',
  },
  {
    id: '4',
    title: 'Most improved player of 2026?',
    replies: 178,
    views: 9100,
    upvotes: 523,
    lastActivity: '45 min ago',
  },
  {
    id: '5',
    title: 'Map veto analysis for Vitality vs Liquid',
    replies: 67,
    views: 3800,
    upvotes: 189,
    lastActivity: '1 hour ago',
  },
  {
    id: '6',
    title: 'Odds movement thread - Major qualifiers',
    replies: 245,
    views: 15600,
    upvotes: 891,
    lastActivity: '2 hours ago',
  },
]

export const communityCategories: CommunityCategory[] = [
  { id: '1', name: 'Match Discussion', discussions: 1243, viewing: 87, icon: '⚔️' },
  { id: '2', name: 'Betting Discussion', discussions: 892, viewing: 64, icon: '💰' },
  { id: '3', name: 'Tournament Discussion', discussions: 567, viewing: 43, icon: '🏆' },
  { id: '4', name: 'Team Analysis', discussions: 432, viewing: 31, icon: '📊' },
  { id: '5', name: 'Roster Changes', discussions: 298, viewing: 22, icon: '🔄' },
  { id: '6', name: 'Predictions', discussions: 1876, viewing: 142, icon: '🎯' },
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
    confidence: 82,
    date: 'May 29, 2026',
    result: 'correct',
  },
  {
    id: '2',
    match: 'NAVI vs MOUZ',
    team1: 'NAVI',
    team2: 'MOUZ',
    prediction: 'NAVI 2-0',
    confidence: 75,
    date: 'May 28, 2026',
    result: 'correct',
  },
  {
    id: '3',
    match: 'Vitality vs Liquid',
    team1: 'Vitality',
    team2: 'Liquid',
    prediction: 'Vitality 2-1',
    confidence: 68,
    date: 'May 27, 2026',
    result: 'incorrect',
  },
  {
    id: '4',
    match: 'FaZe vs NAVI',
    team1: 'FaZe',
    team2: 'NAVI',
    prediction: 'FaZe 2-0',
    confidence: 71,
    date: 'May 25, 2026',
    result: 'correct',
  },
  {
    id: '5',
    match: 'Heroic vs Falcons',
    team1: 'Heroic',
    team2: 'Falcons',
    prediction: 'Falcons 2-1',
    confidence: 64,
    date: 'May 24, 2026',
    result: 'correct',
  },
  {
    id: '6',
    match: 'Spirit vs MOUZ',
    team1: 'Spirit',
    team2: 'MOUZ',
    prediction: 'MOUZ 2-1',
    confidence: 58,
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

export const scheduleMatches: ScheduleMatch[] = [
  {
    id: 's1',
    team1: { name: 'Spirit', logo: '🔥' },
    team2: { name: 'FaZe', logo: '⚡' },
    tournament: 'ESL Pro League Season 21',
    time: 'Today 18:00',
    status: 'upcoming',
  },
  {
    id: 's2',
    team1: { name: 'NAVI', logo: '🌊' },
    team2: { name: 'Vitality', logo: '💎' },
    tournament: 'ESL Pro League Season 21',
    time: 'Today 20:30',
    status: 'upcoming',
  },
  {
    id: 's3',
    team1: { name: 'MOUZ', logo: '💀' },
    team2: { name: 'Heroic', logo: '⚔️' },
    tournament: 'ESL Pro League Season 21',
    time: 'Today 22:00',
    status: 'live',
    score1: 1,
    score2: 1,
  },
  {
    id: 's4',
    team1: { name: 'Liquid', logo: '💧' },
    team2: { name: 'Falcons', logo: '🦅' },
    tournament: 'BLAST Premier Spring 2026',
    time: 'Tomorrow 16:00',
    status: 'upcoming',
  },
  {
    id: 's5',
    team1: { name: 'ENCE', logo: '🔱' },
    team2: { name: 'BIG', logo: '💪' },
    tournament: 'BLAST Premier Spring 2026',
    time: 'Tomorrow 18:30',
    status: 'upcoming',
  },
  {
    id: 's6',
    team1: { name: 'Sprout', logo: '🌱' },
    team2: { name: 'Complexity', logo: '🎯' },
    tournament: 'BLAST Premier Spring 2026',
    time: 'Tomorrow 21:00',
    status: 'upcoming',
  },
  {
    id: 's7',
    team1: { name: 'FaZe', logo: '⚡' },
    team2: { name: 'NAVI', logo: '🌊' },
    tournament: 'PGL Major 2026',
    time: 'Wed 19:00',
    status: 'upcoming',
  },
  {
    id: 's8',
    team1: { name: 'Vitality', logo: '💎' },
    team2: { name: 'Spirit', logo: '🔥' },
    tournament: 'PGL Major 2026',
    time: 'Thu 17:00',
    status: 'upcoming',
  },
  {
    id: 's9',
    team1: { name: 'Heroic', logo: '⚔️' },
    team2: { name: 'Liquid', logo: '💧' },
    tournament: 'ESL Pro League Season 21',
    time: 'Fri 20:00',
    status: 'upcoming',
  },
  {
    id: 's10',
    team1: { name: 'MOUZ', logo: '💀' },
    team2: { name: 'ENCE', logo: '🔱' },
    tournament: 'BLAST Premier Spring 2026',
    time: 'Sat 15:00',
    status: 'upcoming',
  },
  {
    id: 's11',
    team1: { name: 'BIG', logo: '💪' },
    team2: { name: 'Falcons', logo: '🦅' },
    tournament: 'PGL Major 2026',
    time: 'Sat 18:30',
    status: 'upcoming',
  },
  {
    id: 's12',
    team1: { name: 'Complexity', logo: '🎯' },
    team2: { name: 'Sprout', logo: '🌱' },
    tournament: 'ESL Pro League Season 21',
    time: 'Sun 14:00',
    status: 'upcoming',
  },
]

export const todayKeyMatches: ScheduleMatch[] = [
  {
    id: 's1',
    team1: { name: 'Spirit', logo: '🔥' },
    team2: { name: 'FaZe', logo: '⚡' },
    tournament: 'ESL Pro League',
    time: '18:00',
    status: 'upcoming',
  },
  {
    id: 's2',
    team1: { name: 'NAVI', logo: '🌊' },
    team2: { name: 'Vitality', logo: '💎' },
    tournament: 'ESL Pro League',
    time: '20:30',
    status: 'upcoming',
  },
  {
    id: 's3',
    team1: { name: 'MOUZ', logo: '💀' },
    team2: { name: 'Heroic', logo: '⚔️' },
    tournament: 'ESL Pro League',
    time: '22:00',
    status: 'live',
    score1: 1,
    score2: 1,
  },
]

export const tournaments = [
  { id: 't1', name: 'PGL Major 2026', matches: 24, prizePool: '$1,000,000' },
  { id: 't2', name: 'ESL Pro League S21', matches: 18, prizePool: '$750,000' },
  { id: 't3', name: 'BLAST Premier Spring', matches: 15, prizePool: '$400,000' },
  { id: 't4', name: 'IEM Katowice 2026', matches: 12, prizePool: '$500,000' },
  { id: 't5', name: 'DreamHack Dallas', matches: 8, prizePool: '$250,000' },
]

export const quickStats: QuickStat[] = [
  { label: 'Today', value: 8, icon: '📅' },
  { label: 'Live Now', value: 2, icon: '🔴' },
  { label: 'This Week', value: 24, icon: '📆' },
  { label: 'Major 2026', value: 48, icon: '🏆' },
]

export const scheduleStats = {
  totalToday: 8,
  liveNow: 2,
  upcomingToday: 6,
  totalThisWeek: 24,
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

export const blogPosts: BlogPost[] = [
  {
    id: 'b1',
    title: 'PGL Major 2026: Complete Group Stage Breakdown & Betting Angles',
    category: 'Analysis',
    preview: 'Every group, every seed, and the value bets the market is missing. We break down map pools, head-to-head history, and where the smart money should flow.',
    date: 'May 29, 2026',
    readTime: '12 min read',
    featured: true,
    views: 12400,
  },
  {
    id: 'b2',
    title: 'Why map veto analysis is the missing piece in your betting toolkit',
    category: 'Betting',
    preview: 'Most bettors ignore the veto phase. Here is how understanding map pools and banning tendencies can give you a measurable edge over the bookmakers.',
    date: 'May 28, 2026',
    readTime: '8 min read',
    views: 8900,
  },
  {
    id: 'b3',
    title: 'Spirit vs FaZe: Why the odds are wrong',
    category: 'Teams',
    preview: 'Bookmakers have FaZe as favorites. Our data says otherwise. We look at recent form, player ratings, and veto history to make the case for Spirit.',
    date: 'May 27, 2026',
    readTime: '6 min read',
    views: 15200,
  },
  {
    id: 'b4',
    title: 'The meta shift: How active duty changes are reshaping pro CS2',
    category: 'Meta',
    preview: 'From the Anubis rework to new utility mechanics — the professional scene is adapting fast. Here is what the meta shift means for the rest of the season.',
    date: 'May 26, 2026',
    readTime: '10 min read',
    views: 6700,
  },
  {
    id: 'b5',
    title: 'NAVI roster stability: Why keeping the core together pays off',
    category: 'Teams',
    preview: 'After years of roster experiments, NAVI has found stability. We examine why continuity trumps constant change when building a championship contender.',
    date: 'May 25, 2026',
    readTime: '7 min read',
    views: 9200,
  },
  {
    id: 'b6',
    title: 'How to read HLTV rating like a pro analyst',
    category: 'Analysis',
    preview: 'Rating 2.0 tells a story beyond the number. Learn how impact, KAST, and opening duels combine to reveal who is truly carrying their team.',
    date: 'May 24, 2026',
    readTime: '9 min read',
    views: 11300,
  },
  {
    id: 'b7',
    title: 'Live betting CS2: Strategies that actually work',
    category: 'Betting',
    preview: 'Live betting is fast, chaotic, and potentially very profitable. We outline the frameworks professional bettors use to stay disciplined during live CS2 matches.',
    date: 'May 23, 2026',
    readTime: '11 min read',
    views: 7800,
  },
  {
    id: 'b8',
    title: 'BLAST Premier Spring 2026: Teams to watch and dark horse candidates',
    category: 'Meta',
    preview: 'With the BLAST bracket set, we identify the teams that could upset the seedings — and the top seeds that are vulnerable to an early exit.',
    date: 'May 22, 2026',
    readTime: '5 min read',
    views: 5400,
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
  { id: 'mp1', match: 'Spirit vs FaZe', prediction: 'Spirit 2-1', confidence: 82, result: 'correct', date: 'May 29, 2026' },
  { id: 'mp2', match: 'NAVI vs MOUZ', prediction: 'NAVI 2-0', confidence: 75, result: 'correct', date: 'May 28, 2026' },
  { id: 'mp3', match: 'Vitality vs Liquid', prediction: 'Vitality 2-1', confidence: 68, result: 'incorrect', date: 'May 27, 2026' },
  { id: 'mp4', match: 'FaZe vs NAVI', prediction: 'FaZe 2-0', confidence: 71, result: 'correct', date: 'May 25, 2026' },
  { id: 'mp5', match: 'Heroic vs Falcons', prediction: 'Falcons 2-1', confidence: 64, result: 'pending', date: 'May 30, 2026' },
  { id: 'mp6', match: 'Spirit vs MOUZ', prediction: 'MOUZ 2-1', confidence: 58, result: 'incorrect', date: 'May 22, 2026' },
]

export const recentCommunityPicks: RecentCommunityPick[] = [
  { id: 'rcp1', username: 'ClutchKing', avatar: '👑', match: 'Spirit vs FaZe', prediction: 'Spirit 2-1', confidence: 82, timestamp: '2 hours ago' },
  { id: 'rcp2', username: 'BetAnalyzer', avatar: '📊', match: 'NAVI vs MOUZ', prediction: 'NAVI 2-0', confidence: 75, timestamp: '4 hours ago' },
  { id: 'rcp3', username: 'MapVetoMaster', avatar: '🗺️', match: 'Vitality vs Liquid', prediction: 'Vitality 2-0', confidence: 70, timestamp: '5 hours ago' },
  { id: 'rcp4', username: 'FormTracker', avatar: '📈', match: 'Heroic vs Falcons', prediction: 'Heroic 2-1', confidence: 65, timestamp: '6 hours ago' },
  { id: 'rcp5', username: 'ProPredictors', avatar: '🔮', match: 'ENCE vs BIG', prediction: 'ENCE 2-0', confidence: 60, timestamp: '8 hours ago' },
  { id: 'rcp6', username: 'EntryFrag', avatar: '💥', match: 'MOUZ vs Spirit', prediction: 'MOUZ 2-1', confidence: 55, timestamp: '10 hours ago' },
]

export const predictionRules: PredictionRule[] = [
  { title: 'One prediction per match', description: 'You may only submit one prediction per match. Edit allowed until match start.' },
  { title: 'Scoring system', description: 'Exact score = 10 pts. Correct winner = 5 pts. Wrong = 0 pts.' },
  { title: 'Confidence bonus', description: 'Higher confidence = higher potential bonus. Minimum 50%, maximum 100%.' },
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

export const adminStats: AdminStat[] = [
  { label: 'Active Users Today', value: 3842, change: 12.5 },
  { label: 'New Members', value: 247, change: 8.3 },
  { label: 'Predictions Submitted', value: 2847, change: 15.2 },
  { label: 'Community Posts', value: 1283, change: -2.1 },
  { label: 'Reports Pending', value: 14, change: -5.0 },
  { label: 'Matches Tracked', value: 156, change: 0 },
]

export const quickActions: QuickAction[] = [
  { title: 'Create Intel Post', description: 'Publish new analysis', icon: '📝', href: '#' },
  { title: 'Create Blog Post', description: 'Write an article', icon: '📰', href: '#' },
  { title: 'Feature Discussion', description: 'Pin to community', icon: '📌', href: '#' },
  { title: 'Add Match', description: 'Schedule new fixture', icon: '⚔️', href: '#' },
  { title: 'Edit Rankings', description: 'Update team ratings', icon: '🏆', href: '#' },
  { title: 'Send Announcement', description: 'Notify all users', icon: '📢', href: '#' },
]

export const adminActivities: AdminActivity[] = [
  { id: 'aa1', action: 'ClutchKing created a new discussion', user: 'ClutchKing', timestamp: '2 minutes ago', icon: '💬' },
  { id: 'aa2', action: 'Reported comment flagged for review', user: 'ModeratorBot', timestamp: '15 minutes ago', icon: '🚩' },
  { id: 'aa3', action: 'New blog post published: "Major 2026 Preview"', user: 'CSIntelTeam', timestamp: '1 hour ago', icon: '📰' },
  { id: 'aa4', action: 'Intel post featured on homepage', user: 'Admin', timestamp: '2 hours ago', icon: '⭐' },
  { id: 'aa5', action: 'Prediction milestone: 10,000 predictions this week', user: 'System', timestamp: '3 hours ago', icon: '🎯' },
  { id: 'aa6', action: 'New member milestone: 48,000 members reached', user: 'System', timestamp: '5 hours ago', icon: '👥' },
  { id: 'aa7', action: 'Report resolved: Spam post removed', user: 'ModeratorBot', timestamp: '6 hours ago', icon: '✅' },
]

export const adminBlogPosts: AdminBlogPost[] = [
  { id: 'abp1', title: 'PGL Major 2026: Complete Group Stage Breakdown', author: 'CSIntelTeam', date: 'May 29, 2026', status: 'published', views: 12400 },
  { id: 'abp2', title: 'Why Map Veto Analysis is the Missing Piece', author: 'BetAnalyzer', date: 'May 28, 2026', status: 'published', views: 8900 },
  { id: 'abp3', title: 'Spirit vs FaZe: Why the Odds are Wrong', author: 'ClutchKing', date: 'May 27, 2026', status: 'under_review', views: 15200 },
  { id: 'abp4', title: 'The Meta Shift: How Active Duty Changes Pro CS2', author: 'MapVetoMaster', date: 'May 26, 2026', status: 'draft', views: 0 },
  { id: 'abp5', title: 'NAVI Roster Stability: Why Continuity Wins', author: 'ESportsAnalyst', date: 'May 25, 2026', status: 'published', views: 9200 },
]

export const adminIntelPosts: AdminIntelPost[] = [
  { id: 'aip1', title: 'Spirit vs FaZe - Deep Dive Analysis', author: 'ClutchKing', date: 'May 29, 2026', status: 'featured', category: 'Match Analysis' },
  { id: 'aip2', title: 'NAVI vs MOUZ Map Veto Breakdown', author: 'MapVetoMaster', date: 'May 28, 2026', status: 'published', category: 'Team Analysis' },
  { id: 'aip3', title: 'Underdog Value Bets for Major Qualifiers', author: 'BetAnalyzer', date: 'May 27, 2026', status: 'published', category: 'Betting' },
  { id: 'aip4', title: 'Liquid Roster Change Impact Analysis', author: 'RosterWatcher', date: 'May 26, 2026', status: 'published', category: 'Roster Changes' },
]

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
  { id: 'am4', team1: 'Heroic', team2: 'Falcons', tournament: 'ESL Pro League S21', time: 'Today 22:00', status: 'upcoming', featured: false },
]

export const analyticsData: AnalyticsCard[] = [
  { title: 'User Growth', value: '48,750', change: 12.5, chart: 'up' },
  { title: 'Predictions/Day', value: '2,847', change: 15.2, chart: 'up' },
  { title: 'Community Activity', value: '12,400', change: 8.3, chart: 'up' },
  { title: 'Top Discussions', value: '1,234', change: -2.1, chart: 'down' },
]

export const adminNotes: AdminNote[] = [
  { title: 'Major Update', content: 'PGL Major 2026 integration launching next week. Prepare match data pipeline.', date: 'May 29, 2026' },
  { title: 'Community Guidelines', content: 'Updated betting discussion rules. Review and approve new policy draft.', date: 'May 28, 2026' },
  { title: 'Weekend Maintenance', content: 'Scheduled maintenance window: Saturday 02:00-04:00 UTC.', date: 'May 27, 2026' },
]

export const platformStatus: PlatformStatus[] = [
  { service: 'Web Application', status: 'operational', uptime: '99.98%' },
  { service: 'API Server', status: 'operational', uptime: '99.95%' },
  { service: 'Database', status: 'operational', uptime: '99.99%' },
  { service: 'CDN / Assets', status: 'operational', uptime: '99.97%' },
  { service: 'Auth Service', status: 'degraded', uptime: '98.2%' },
]

export const recentAlerts: Alert[] = [
  { id: 'ral1', severity: 'critical', message: 'Authentication service response time elevated (>2s)', timestamp: '5 minutes ago' },
  { id: 'ral2', severity: 'warning', message: 'Prediction submission volume 3x above average', timestamp: '30 minutes ago' },
  { id: 'ral3', severity: 'info', message: 'New blog post pending review: 3 submissions', timestamp: '1 hour ago' },
  { id: 'ral4', severity: 'info', message: 'Weekly report generated successfully', timestamp: '2 hours ago' },
  { id: 'ral5', severity: 'warning', message: '3 reports pending moderator review', timestamp: '3 hours ago' },
]
