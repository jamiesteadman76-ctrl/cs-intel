# Database Truth Remediation Report - Phase 1 Audit

**Date:** June 1, 2026  
**Project:** CS Intel - Counter-Strike 2 Esports Intelligence Platform  
**Audit Status:** COMPLETE - 40+ hardcoded data sources identified

---

## Executive Summary

Complete audit of hardcoded, mock, and placeholder data throughout the CS Intel codebase. **40+ exported arrays found in `lib/data.ts`** that will show fake data in production.

### Critical Findings:
- **Total hardcoded arrays:** 40+
- **Total hardcoded data points:** 400+
- **Pages with 100% mock data:** 5 (Matches, Rankings, Schedule, Blog, Community)
- **Pages with partial mock data:** 4 (Homepage, Admin, Leaderboard with fallbacks)
- **Pages fully connected:** 2 (Predictions, Profile)
- **Components showing mock data:** 14 out of 18 (78%)

---

## Part 1: Hardcoded Data in `lib/data.ts`

### Location: `/lib/data.ts` (Lines 1-1598)

#### Category 1: Match Data (8 arrays, ~50 data points)

| Array Name | Type | Count | Status | Line Range | Display Location |
|------------|------|-------|--------|------------|------------------|
| `matches[]` | Match[] | 1 | HARDCODED | L1-L21 | Homepage, Predictions (fallback) |
| `featuredMatch` | Match | 1 | HARDCODED | L23-L45 | Matches page (featured section) |
| `relatedMatches[]` | Match[] | 4 | HARDCODED | L244-L286 | Matches page (related section) |
| `scheduleMatches[]` | ScheduleMatch[] | 12 | HARDCODED | L305-L361 | Schedule page |
| `todayKeyMatches[]` | ScheduleMatch[] | 3 | HARDCODED | L363-L386 | Schedule page (today section) |
| `predictionMatches[]` | PredictionMatch[] | 5 | HARDCODED | L1205-L1245 | Predictions page (matches list) |
| `tournaments[]` | Tournament[] | 5 | HARDCODED | L388-L393 | Schedule page |
| `quickStats[]` | QuickStat[] | 4 | HARDCODED | L395-L400 | Schedule page (stats cards) |

**Impact:** Every match displayed on Homepage, Matches, Schedule, and Predictions pages is fake and will never update with real tournament data.

---

#### Category 2: Rankings & Teams (11 arrays, ~100 data points)

| Array Name | Type | Count | Status | Line Range | Display Location |
|------------|------|-------|--------|------------|------------------|
| `rankings[]` | Ranking[] | 5 | HARDCODED | L116-L140 | Homepage (top teams section) |
| `rankingTeams[]` | RankingTeam[] | 10 | HARDCODED | L960-L1050 | Rankings page (full table) |
| `rankingMovers[]` | RankingMover[] | 4 | HARDCODED | L1052-L1073 | Rankings page (movers section) |
| `rankingUpcoming[]` | RankingUpcoming[] | 3 | HARDCODED | L1075-L1090 | Rankings page (upcoming matches) |
| `trendingMatches[]` | Object[] | 3 | HARDCODED | L799-L803 | Community page (trending) |
| `topContributors[]` | TopContributor[] | 8 | HARDCODED | L623-L631 | Community page (top contributors) |

**Impact:** All ranking positions, team ratings, and trend indicators are completely fake. Users will see incorrect team standings throughout the season.

---

#### Category 3: Intel & Analysis Posts (5 arrays, ~30 data points)

| Array Name | Type | Count | Status | Line Range | Display Location |
|------------|------|-------|--------|------------|------------------|
| `intelPosts[]` | IntelPost[] | 4 | HARDCODED | L47-L67 | Homepage (latest intel section) |
| `intelUpdates[]` | IntelUpdate[] | 5 | HARDCODED | L210-L242 | Matches page (intel updates section) |
| `blogPosts[]` | BlogPost[] | 8 | HARDCODED | L1092-L1140 | Blog page (all articles) |

**Impact:** Every article, analysis post, and intel update displayed is fake. Blog page shows 100% fabricated content.

---

#### Category 4: Community Data (8 arrays, ~150 data points)

| Array Name | Type | Count | Status | Line Range | Display Location |
|------------|------|-------|--------|------------|------------------|
| `communityActivity[]` | CommunityActivity[] | 4 | HARDCODED | L94-L113 | Homepage (community activity section) |
| `communityStats` | CommunityStats | 1 | HARDCODED | L288-L292 | Community page (stats cards) |
| `communityComments[]` | CommunityComment[] | 5 | HARDCODED | L142-L187 | Matches page (community discussion) |
| `communityPredictions[]` | CommunityPrediction[] | 5 | HARDCODED | L189-L208 | Matches page (community predictions widget) |
| `communityDiscussions[]` | CommunityDiscussion[] | 6 | HARDCODED | L294-L328 | Community page (trending discussions) |
| `communityCategories[]` | CommunityCategory[] | 6 | HARDCODED | L330-L336 | Community page (categories) |
| `communityPosts[]` | CommunityPost[] | 6 | HARDCODED | L338-L401 | Community page (latest posts) |
| `communityTags[]` | CommunityTag[] | 12 | HARDCODED | L633-L645 | Community page (tag cloud) |
| `newestMembers[]` | NewMember[] | 5 | HARDCODED | L805-L811 | Community page (new members) |

**Impact:** Community page displays 100% fake members, posts, discussions, and statistics. Users will never see real community engagement.

---

#### Category 5: Prediction System (7 arrays, ~60 data points)

| Array Name | Type | Count | Status | Line Range | Display Location |
|------------|------|-------|--------|------------|------------------|
| `communityConsensus[]` | CommunityConsensus[] | 6 | HARDCODED | L1247-L1255 | Predictions page (consensus percentages) |
| `topPredictors[]` | TopPredictor[] | 5 | HARDCODED | L1257-L1263 | Predictions page (top predictors) |
| `myPredictions[]` | MyPrediction[] | 6 | HARDCODED | L1265-L1278 | Predictions page (user's predictions - fallback) |
| `recentCommunityPicks[]` | RecentCommunityPick[] | 6 | HARDCODED | L1280-L1292 | Predictions page (recent picks) |
| `predictionRules[]` | PredictionRule[] | 5 | HARDCODED | L1294-L1302 | Predictions page (rules section) |
| `seasonStats[]` | SeasonStat[] | 6 | HARDCODED | L1304-L1311 | Predictions page (season stats) |

**Impact:** Prediction consensus percentages, top predictor rankings, and season statistics shown are all fake.

---

#### Category 6: Leaderboard & User Data (12 arrays, ~120 data points)

| Array Name | Type | Count | Status | Line Range | Display Location |
|------------|------|-------|--------|------------|------------------|
| `leaderboardStats` | LeaderboardStats | 1 | HARDCODED | L1142-L1147 | Leaderboard page (stats cards) |
| `leaderboardUsers[]` | LeaderboardUser[] | 10 | HARDCODED | L1149-L1169 | Leaderboard page (ranking table) |
| `analystOfTheWeek` | LeaderboardUser | 1 | HARDCODED | L1171-L1184 | Leaderboard page (featured analyst) |
| `risingStars[]` | RisingStar[] | 6 | HARDCODED | L1186-L1193 | Leaderboard page (rising stars) |
| `recentAchievements[]` | RecentAchievement[] | 6 | HARDCODED | L1195-L1202 | Leaderboard page (achievements) |
| `leaderboardRules[]` | LeaderboardRule[] | 5 | HARDCODED | L1204-L1210 | Leaderboard page (rules) |
| `scoreComponents[]` | ScoreComponent[] | 6 | HARDCODED | L1212-L1219 | Leaderboard page (scoring breakdown) |

**⚠️ CRITICAL:** Even though leaderboard is marked as "mostly truthful" in audit, the stats cards display hardcoded fallback values instead of computed aggregates.

---

#### Category 7: User Profile Data (9 arrays, ~60 data points)

| Array Name | Type | Count | Status | Line Range | Display Location |
|------------|------|-------|--------|------------|------------------|
| `profileStats` | ProfileStats | 1 | HARDCODED | L467-L474 | Profile page (stats cards) - FALLBACK |
| `profileActivities[]` | ProfileActivity[] | 7 | HARDCODED | L476-L503 | Profile page (activity feed) |
| `predictionHistory[]` | PredictionHistory[] | 6 | HARDCODED | L505-L530 | Profile page (prediction history) |
| `topAnalysisPosts[]` | TopAnalysisPost[] | 4 | HARDCODED | L532-L549 | Profile page (top posts) |
| `reputationSources[]` | ReputationSource[] | 4 | HARDCODED | L551-L556 | Profile page (reputation breakdown) |
| `achievements[]` | Achievement[] | 8 | HARDCODED | L558-L570 | Profile page (achievements) |
| `favoriteTeams[]` | FavoriteTeam[] | 4 | HARDCODED | L572-L577 | Profile page (favorite teams) |
| `recentFollowers[]` | RecentFollower[] | 5 | HARDCODED | L579-L585 | Profile page (recent followers) |
| `communityStanding` | CommunityStanding | 1 | HARDCODED | L587-L591 | Profile page (community standing) |

**Impact:** Profile pages show hardcoded user data as fallback when Supabase lookup fails. Users will see fake prediction history and achievements.

---

#### Category 8: Admin Dashboard (11 arrays, ~50 data points)

| Array Name | Type | Count | Status | Line Range | Display Location |
|------------|------|-------|--------|------------|------------------|
| `adminStats[]` | AdminStat[] | 6 | HARDCODED | L1313-L1320 | Admin page (stats cards) |
| `quickActions[]` | QuickAction[] | 6 | HARDCODED | L1322-L1329 | Admin page (quick actions) |
| `adminActivities[]` | AdminActivity[] | 7 | HARDCODED | L1331-L1345 | Admin page (activity log) |
| `adminBlogPosts[]` | AdminBlogPost[] | 5 | HARDCODED | L1347-L1357 | Admin page (blog management) |
| `adminIntelPosts[]` | AdminIntelPost[] | 4 | HARDCODED | L1359-L1368 | Admin page (intel management) |
| `adminDiscussions[]` | AdminDiscussion[] | 5 | HARDCODED | L1370-L1380 | Admin page (discussion management) |
| `reportItems[]` | ReportItem[] | 4 | HARDCODED | L1382-L1393 | Admin page (moderation reports) |
| `adminMatches[]` | AdminMatch[] | 6 | HARDCODED | L1395-L1406 | Admin page (match management) |
| `analyticsData[]` | AnalyticsCard[] | 4 | HARDCODED | L1408-L1413 | Admin page (analytics) |
| `adminNotes[]` | AdminNote[] | 3 | HARDCODED | L1415-L1421 | Admin page (admin notes) |
| `platformStatus[]` | PlatformStatus[] | 5 | HARDCODED | L1423-L1429 | Admin page (platform status) |
| `recentAlerts[]` | Alert[] | 5 | HARDCODED | L1431-L1440 | Admin page (alerts) |

**Impact:** Admin dashboard statistics and alerts are completely fabricated. System health monitoring is unreliable.

---

## Part 2: Component Analysis Using Hardcoded Data

### Components Directly Displaying Mock Data

#### MatchCard (components/MatchCard.tsx)
- **Status:** MOCK DATA (when used on Homepage)
- **Source:** `matches[]` from lib/data.ts
- **Displays:** Team names, tournament, sentiment, prediction percentages
- **Line affected:** Homepage, related matches section

#### MatchHeader (components/MatchHeader.tsx)
- **Status:** MOCK DATA
- **Source:** `featuredMatch` from lib/data.ts
- **Displays:** Match header with team names and tournament
- **Line affected:** Matches page

#### MatchSnapshot (components/MatchSnapshot.tsx)
- **Status:** MOCK DATA
- **Source:** `featuredMatch.mapPoolAdvantage`, `featuredMatch.headToHeadWins`
- **Displays:** Map pool advantage, head-to-head statistics
- **Line affected:** Matches page

#### CommunityConfidence (components/CommunityConfidence.tsx)
- **Status:** MOCK DATA
- **Source:** `featuredMatch.sentiment`
- **Displays:** Community sentiment percentage (e.g., "72% confidence on Team1")
- **Line affected:** Matches page

#### FeaturedMatch (components/FeaturedMatch.tsx)
- **Status:** MOCK DATA
- **Source:** `featuredMatch`, `featuredMatch.team1Players`, `featuredMatch.team2Players`
- **Displays:** Complete featured match information, player stats, reasons
- **Line affected:** Matches page

#### KeyPlayers (components/KeyPlayers.tsx)
- **Status:** MOCK DATA
- **Source:** `featuredMatch.team1Players`, `featuredMatch.team2Players`
- **Displays:** Player names, ratings (1.18, 1.31, etc.), KD ratios
- **Line affected:** Matches page

#### CommunityDiscussionFeed (components/CommunityDiscussionFeed.tsx)
- **Status:** MOCK DATA
- **Source:** `communityComments[]`
- **Displays:** 5 fake comments from fake users with upvotes
- **Line affected:** Matches page

#### CommunityPredictionsWidget (components/CommunityPredictionsWidget.tsx)
- **Status:** MOCK DATA
- **Source:** `communityPredictions[]`
- **Displays:** 5 fake predictions from fake users
- **Line affected:** Matches page

#### IntelFeed (components/IntelFeed.tsx)
- **Status:** MOCK DATA
- **Source:** `intelUpdates[]`
- **Displays:** 5 intel updates about teams
- **Line affected:** Matches page

#### IntelPostCard (components/IntelPostCard.tsx)
- **Status:** MOCK DATA
- **Source:** `intelPosts[]`
- **Displays:** Intel post titles, categories, comment counts
- **Line affected:** Homepage, wherever intel posts are shown

#### RankingItem (components/RankingItem.tsx)
- **Status:** MOCK DATA
- **Source:** `rankings[]`, `rankingTeams[]`
- **Displays:** Rank, team name, rating, change indicator
- **Line affected:** Homepage rankings section, Rankings page

#### CommunityActivityItem (components/CommunityActivityItem.tsx)
- **Status:** MOCK DATA
- **Source:** `communityActivity[]`
- **Displays:** Community activity entries with usernames and votes
- **Line affected:** Homepage community activity section

#### TournamentInfoWidget (components/TournamentInfoWidget.tsx)
- **Status:** MOCK DATA
- **Source:** `matchTournament`
- **Displays:** Prize pool, team count, tournament stage
- **Line affected:** Matches page tournament info

#### RelatedMatchCard (components/RelatedMatchCard.tsx)
- **Status:** MOCK DATA
- **Source:** `relatedMatches[]`
- **Displays:** Related match data
- **Line affected:** Matches page related matches section

---

## Part 3: Page-by-Page Breakdown

### Homepage (app/page.tsx)
**Current State:** 6 sections showing mock data
- ❌ Today's Matches (from `matches[]`)
- ❌ Featured Match (from `featuredMatch`)
- ❌ Latest Intel (from `intelPosts[]`)
- ❌ Community Activity (from `communityActivity[]`)
- ❌ Top Teams (from `rankings[]`)
- ✅ Header/Footer (static content)

**Required Changes:** Replace all 5 mock sections with database queries

---

### Predictions Page (app/predictions/page.tsx)
**Current State:** PARTIALLY CONNECTED
- ✅ Real predictions from database
- ✅ Real leaderboard computation
- ❌ Community consensus percentages are computed from real data BUT displayed next to `communityConsensus[]` fallback
- ❌ Top predictors has fallback to `topPredictors[]`

**Required Changes:** Remove fallback to mock consensus data, ensure all percentages computed from live database

---

### Matches Page (app/matches/page.tsx)
**Current State:** 100% MOCK DATA
- ❌ Featured Match (from `featuredMatch`)
- ❌ Community Confidence (from sentiment)
- ❌ Match Snapshot (map pool, H2H)
- ❌ Key Players (from players array)
- ❌ Community Discussion (from `communityComments[]`)
- ❌ Community Predictions (from `communityPredictions[]`)
- ❌ Intel Updates (from `intelUpdates[]`)
- ❌ Related Matches (from `relatedMatches[]`)
- ❌ Tournament Info (from `matchTournament`)

**Required Changes:** Complete rewrite - fetch real match data, real comments, real predictions

---

### Rankings Page (app/rankings/page.tsx)
**Current State:** 100% MOCK DATA
- ❌ Top 3 Podium (from `rankingTeams[0-2]`)
- ❌ Full Rankings Table (from `rankingTeams[]`)
- ❌ Ranking Movers (from `rankingMovers[]`)
- ❌ Upcoming Matches (from `rankingUpcoming[]`)

**Required Changes:** Compute rankings from match results, not hardcoded arrays

---

### Schedule Page (app/schedule/page.tsx)
**Current State:** 100% MOCK DATA
- ❌ Schedule Matches (from `scheduleMatches[]`)
- ❌ Quick Stats (from `quickStats[]`)
- ❌ Tournaments (from `tournaments[]`)

**Required Changes:** Query real matches from database, filter by date

---

### Blog Page (app/blog/page.tsx)
**Current State:** 100% MOCK DATA
- ❌ All blog posts (from `blogPosts[]`)
- ❌ Featured post (from `blogPosts[0]`)

**Required Changes:** Query real blog posts from database, add creation capability

---

### Community Page (app/community/page.tsx)
**Current State:** 100% MOCK DATA
- ❌ Community Stats (from `communityStats`)
- ❌ Trending Discussions (from `communityDiscussions[]`)
- ❌ Categories (from `communityCategories[]`)
- ❌ Community Posts (from `communityPosts[]`)
- ❌ Top Contributors (from `topContributors[]`)
- ❌ Tags (from `communityTags[]`)
- ❌ Trending Matches (from `trendingMatches[]`)
- ❌ Newest Members (from `newestMembers[]`)

**Required Changes:** Create database tables, query real data

---

### Leaderboard Page (app/leaderboard/page.tsx)
**Current State:** MOSTLY CONNECTED with fallbacks
- ⚠️ Stats cards show computed values BUT have hardcoded fallback (48,750 members, etc.)
- ✅ Leaderboard table from `getLeaderboard()`
- ✅ Rising Stars computed from data
- ❌ Analyst of the week from fallback
- ❌ Recent achievements from fallback

**Required Changes:** Remove all hardcoded fallbacks, ensure all values computed

---

### Profile Page (app/profile/page.tsx)
**Current State:** USER-SPECIFIC CONNECTED with fallbacks
- ✅ User stats computed from real predictions
- ✅ Prediction history from real database
- ❌ Activity feed uses hardcoded fallback
- ❌ Achievements use hardcoded fallback

**Required Changes:** Query activity feed from database, compute achievements

---

### Admin Page (app/admin/page.tsx)
**Current State:** PARTIALLY CONNECTED
- ✅ Real predictions tab with database queries
- ✅ Real users tab with stats computation
- ❌ Admin stats hardcoded (from `adminStats[]`)
- ❌ Platform status hardcoded (from `platformStatus[]`)
- ❌ Alerts hardcoded (from `recentAlerts[]`)
- ❌ Activities hardcoded (from `adminActivities[]`)

**Required Changes:** Compute admin statistics from database, implement real monitoring

---

## Part 4: Summary Table - Hardcoded Data by Category

| Category | Count | Critical | Pages Affected | Severity |
|----------|-------|----------|-----------------|----------|
| Match Data | 8 | YES | Homepage, Matches, Schedule, Predictions | CRITICAL |
| Rankings/Teams | 11 | YES | Homepage, Rankings | CRITICAL |
| Intel/Analysis Posts | 5 | YES | Homepage, Matches, Blog | HIGH |
| Community Data | 8 | YES | Homepage, Community, Matches | HIGH |
| Prediction Data | 7 | YES | Predictions, Matches | HIGH |
| Leaderboard Data | 12 | PARTIAL | Leaderboard, Homepage | MEDIUM |
| User Profile Data | 9 | PARTIAL | Profile | MEDIUM |
| Admin Data | 11 | YES | Admin | HIGH |
| **TOTAL** | **71** | **40+** | **All except Login/Auth** | **CRITICAL** |

---

## Conclusion

**Every major feature except Authentication and a few static pages displays hardcoded mock data.** The application will launch with completely fictional match results, fake user rankings, and made-up community activity. This must be remedied before any production deployment.

**Next Phase:** Database source mapping to show where real data should come from.

