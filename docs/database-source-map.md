# Database Source Mapping - Phase 2

**Date:** June 1, 2026  
**Project:** CS Intel

---

## Part 1: UI Element to Database Source Mapping

### MATCHES & TOURNAMENTS

| UI Element | Page | Currently Displays | Required DB Table | Required Columns | Required Function | Priority |
|------------|------|-------------------|--------------------|------------------|------------------|----------|
| Today's Matches | Homepage | `matches[]` (hardcoded) | `matches` | id, team1, team2, match_time, tournament, status | `getTodayMatches()` | CRITICAL |
| Featured Match | Matches Page | `featuredMatch` (hardcoded) | `matches` | all match columns | `getFeaturedMatch()` | CRITICAL |
| Match Schedule | Schedule Page | `scheduleMatches[]` (hardcoded) | `matches` | id, team1, team2, match_time, tournament, status | `getScheduleMatches()` | CRITICAL |
| Match Tournaments | Schedule Page | `tournaments[]` (hardcoded) | `tournaments` (NEW) | id, name, matches_count, prize_pool | `getTournaments()` | HIGH |
| Tournament Info Widget | Matches Page | `matchTournament` (hardcoded) | `tournaments` (NEW) | all columns | `getTournamentById()` | HIGH |
| Quick Stats (Today/Week) | Schedule Page | `quickStats[]` (hardcoded) | `matches` | match_time, status (via aggregate) | `getScheduleStats()` | MEDIUM |
| Related Matches | Matches Page | `relatedMatches[]` (hardcoded) | `matches` | filtering by tournament, upcoming | `getRelatedMatches(match_id)` | HIGH |

---

### RANKINGS & TEAMS

| UI Element | Page | Currently Displays | Required DB Table | Required Columns | Required Function | Priority |
|------------|------|-------------------|--------------------|------------------|------------------|----------|
| Top Teams Section | Homepage | `rankings[]` (hardcoded) | `teams` (NEW) | id, name, logo, rating, win_rate | `getTopTeams(limit=5)` | CRITICAL |
| Full Rankings Table | Rankings Page | `rankingTeams[]` (hardcoded) | `teams` (NEW) | id, name, rating, win_rate, recent_form, best_map, key_player | `getAllTeamRankings()` | CRITICAL |
| Ranking Movers | Rankings Page | `rankingMovers[]` (hardcoded) | `team_ranking_history` (NEW) | team_id, previous_rank, current_rank, reason | `getRankingMovers()` | MEDIUM |
| Upcoming High-Impact | Rankings Page | `rankingUpcoming[]` (hardcoded) | `matches` + `team_rating_impact` (NEW) | filtering by teams involved | `getHighImpactMatches()` | MEDIUM |

---

### INTEL & ANALYSIS POSTS

| UI Element | Page | Currently Displays | Required DB Table | Required Columns | Required Function | Priority |
|------------|------|-------------------|--------------------|------------------|------------------|----------|
| Latest Intel | Homepage | `intelPosts[]` (hardcoded) | `intel_posts` (NEW) | id, title, category, timestamp, comment_count, author_id | `getLatestIntelPosts(limit=4)` | CRITICAL |
| Intel Updates Section | Matches Page | `intelUpdates[]` (hardcoded) | `intel_posts` (NEW) | filtered by match context | `getIntelPostsByMatch(match_id)` | HIGH |
| Blog Posts Grid | Blog Page | `blogPosts[]` (hardcoded) | `blog_posts` (NEW) | id, title, category, preview, date, read_time, views, featured | `getAllBlogPosts()` | CRITICAL |
| Featured Blog Post | Blog Page | `blogPosts[0]` (hardcoded) | `blog_posts` (NEW) | where featured = true | `getFeaturedBlogPost()` | HIGH |

---

### COMMUNITY FEATURES

| UI Element | Page | Currently Displays | Required DB Table | Required Columns | Required Function | Priority |
|------------|------|-------------------|--------------------|------------------|------------------|----------|
| Community Stats | Community Page | `communityStats` (hardcoded) | `users`, `comments`, `discussions`, `posts` (aggregate) | COUNT queries | `getCommunityStats()` | HIGH |
| Community Activity | Homepage | `communityActivity[]` (hardcoded) | `activity_feed` (NEW) | user_id, activity_type, description, timestamp, votes | `getCommunityActivity(limit=4)` | HIGH |
| Trending Discussions | Community Page | `communityDiscussions[]` (hardcoded) | `community_discussions` (NEW) | id, title, replies, views, upvotes, last_activity | `getTrendingDiscussions()` | CRITICAL |
| Discussion Categories | Community Page | `communityCategories[]` (hardcoded) | `community_categories` (NEW) | id, name, slug, icon, discussion_count | `getCommunityCategories()` | HIGH |
| Community Posts | Community Page | `communityPosts[]` (hardcoded) | `community_posts` (NEW) | id, author_id, title, preview, category, replies, views, upvotes | `getCommunityPosts()` | HIGH |
| Top Contributors | Community Page | `topContributors[]` (hardcoded) | `users` + aggregate stats | reputation, posts, predictions, accuracy | `getTopContributors()` | MEDIUM |
| Community Tags | Community Page | `communityTags[]` (hardcoded) | `community_tags` (NEW) | name, post_count | `getPopularTags()` | LOW |
| Newest Members | Community Page | `newestMembers[]` (hardcoded) | `users` | id, username, avatar, created_at | `getNewestMembers()` | MEDIUM |
| Trending Matches | Community Page | `trendingMatches[]` (hardcoded) | `matches` + `match_predictions_aggregate` (NEW) | filtering by prediction volume | `getTrendingMatches()` | MEDIUM |
| Comments on Match | Matches Page | `communityComments[]` (hardcoded) | `comments` | user_id, match_id, content, upvotes, replies | `getCommentsByMatch(match_id)` | CRITICAL |
| Predictions on Match | Matches Page | `communityPredictions[]` (hardcoded) | `predictions` | user_id, match_id, prediction, confidence, timestamp | `getPredictionsByMatch(match_id)` | CRITICAL |

---

### PREDICTIONS & LEADERBOARD

| UI Element | Page | Currently Displays | Required DB Table | Required Columns | Required Function | Priority |
|------------|------|-------------------|--------------------|------------------|------------------|----------|
| Predictions List | Predictions Page | `predictionMatches[]` (hardcoded) | `matches` | filtered matches with predictions | `getMatchesForPredictions()` | CRITICAL |
| Community Consensus | Predictions Page | `communityConsensus[]` (hardcoded) | `predictions` + `match_predictions_aggregate` (NEW) | vote counts, percentages | `getConsensusPercentages(match_id)` | CRITICAL |
| Top Predictors | Predictions/Leaderboard | `topPredictors[]` (hardcoded) | `users` | ordered by accuracy and intel_score | `getTopPredictors()` | HIGH |
| Leaderboard Stats | Leaderboard Page | `leaderboardStats` (hardcoded) | `users`, `predictions` (aggregate) | COUNT, AVG queries | `getLeaderboardStats()` | CRITICAL |
| Leaderboard Table | Leaderboard Page | `leaderboardUsers[]` (hardcoded) | `users` | ordered by intel_score | `getLeaderboard()` (EXISTS) | MEDIUM |
| Rising Stars | Leaderboard Page | `risingStars[]` (hardcoded) | `user_stats_snapshots` (NEW) | recent score gains | `getRisingStars()` | MEDIUM |
| Recent Achievements | Leaderboard Page | `recentAchievements[]` (hardcoded) | `user_achievements` (NEW) | user_id, achievement_type, timestamp | `getRecentAchievements()` | MEDIUM |

---

### USER PROFILE

| UI Element | Page | Currently Displays | Required DB Table | Required Columns | Required Function | Priority |
|------------|------|-------------------|--------------------|------------------|------------------|----------|
| Profile Stats | Profile Page | `profileStats` (hardcoded fallback) | `users` + `predictions` | all user columns + computed stats | `getUserProfile(user_id)` | HIGH |
| Activity Feed | Profile Page | `profileActivities[]` (hardcoded fallback) | `activity_feed` (NEW) | filtered by user_id | `getUserActivity(user_id)` | MEDIUM |
| Prediction History | Profile Page | `predictionHistory[]` (hardcoded fallback) | `predictions` | filtered by user_id | `getUserPredictions(user_id)` (EXISTS) | HIGH |
| Top Analysis Posts | Profile Page | `topAnalysisPosts[]` (hardcoded fallback) | `posts` (NEW table) + votes | user's top posts | `getUserTopPosts(user_id)` | MEDIUM |
| Achievements | Profile Page | `achievements[]` (hardcoded fallback) | `user_achievements` (NEW) | unlocked achievements | `getUserAchievements(user_id)` | MEDIUM |
| Favorite Teams | Profile Page | `favoriteTeams[]` (hardcoded fallback) | `user_favorite_teams` (NEW) | user's favorite teams | `getUserFavoriteTeams(user_id)` | LOW |
| Recent Followers | Profile Page | `recentFollowers[]` (hardcoded fallback) | `follows` (NEW) | recent followers | `getUserFollowers(user_id)` | LOW |

---

### ADMIN DASHBOARD

| UI Element | Page | Currently Displays | Required DB Table | Required Columns | Required Function | Priority |
|------------|------|-------------------|--------------------|------------------|------------------|----------|
| Admin Stats | Admin Page | `adminStats[]` (hardcoded) | `users`, `predictions`, `posts`, `comments` (aggregate) | COUNT, filtered by date | `getAdminStats()` | HIGH |
| Admin Activities | Admin Page | `adminActivities[]` (hardcoded) | `activity_feed` (NEW) | all activities | `getAllActivities(limit=7)` | MEDIUM |
| Platform Status | Admin Page | `platformStatus[]` (hardcoded) | `platform_health` (NEW) | service uptime tracking | `getPlatformStatus()` | MEDIUM |
| Recent Alerts | Admin Page | `recentAlerts[]` (hardcoded) | `alerts` (NEW) | system alerts | `getRecentAlerts()` | MEDIUM |
| Blog Management | Admin Page | `adminBlogPosts[]` (hardcoded) | `blog_posts` (NEW) | all posts with status | `getAllBlogPostsAdmin()` | CRITICAL |
| Intel Management | Admin Page | `adminIntelPosts[]` (hardcoded) | `intel_posts` (NEW) | all posts with status | `getAllIntelPostsAdmin()` | CRITICAL |
| Discussion Management | Admin Page | `adminDiscussions[]` (hardcoded) | `community_discussions` (NEW) | all discussions with flags | `getAllDiscussionsAdmin()` | HIGH |
| Match Management | Admin Page | `adminMatches[]` (hardcoded) | `matches` | all matches for admin | `getAdminMatches()` | CRITICAL |
| Reports | Admin Page | `reportItems[]` (hardcoded) | `content_reports` (NEW) | pending/resolved reports | `getReports()` | HIGH |

---

## Part 2: New Functions Required Summary

### CRITICAL - Must be implemented immediately:

| Function | Returns | Purpose | SQL Complexity |
|----------|---------|---------|-----------------|
| `getTodayMatches()` | Match[] | Today's matches on homepage | Simple SELECT + filter |
| `getFeaturedMatch()` | Match | Featured match details | Simple SELECT |
| `getTopTeams()` | RankingTeam[] | Homepage rankings | SELECT with computed columns |
| `getLatestIntelPosts()` | IntelPost[] | Homepage intel section | Simple SELECT |
| `getTrendingDiscussions()` | CommunityDiscussion[] | Community page | SELECT with aggregate counts |
| `getCommentsByMatch()` | Comment[] | Match page comments | SELECT with filter |
| `getPredictionsByMatch()` | Prediction[] | Match page predictions | SELECT with filter |
| `getCommunityStats()` | CommunityStats | Community page stats | Multiple COUNT aggregates |
| `getLeaderboardStats()` | LeaderboardStats | Leaderboard page header | COUNT and AVG aggregates |
| `getBlogPosts()` | BlogPost[] | Blog page content | Simple SELECT |

### HIGH PRIORITY - Core features:

| Function | Returns | Purpose | SQL Complexity |
|----------|---------|---------|-----------------|
| `getScheduleMatches()` | ScheduleMatch[] | Schedule page | SELECT with date filter |
| `getTournaments()` | Tournament[] | Tournament info | Simple SELECT |
| `getAllTeamRankings()` | RankingTeam[] | Rankings page | SELECT computed rankings |
| `getIntelPostsByMatch()` | IntelPost[] | Match page intel | SELECT with filter |
| `getCommunityPosts()` | CommunityPost[] | Community page posts | SELECT ordered by date |
| `getCommunityActivity()` | Activity[] | Homepage activity | SELECT from activity_feed |
| `getTopPredictors()` | TopPredictor[] | Top analysts | SELECT with accuracy calculation |
| `getTopContributors()` | TopContributor[] | Community contributors | SELECT with aggregate stats |

### MEDIUM PRIORITY - Enhanced features:

| Function | Returns | Purpose | SQL Complexity |
|----------|---------|---------|-----------------|
| `getRankingMovers()` | RankingMover[] | Ranking changes | SELECT with historical comparison |
| `getHighImpactMatches()` | RankingUpcoming[] | Future rankings impact | Complex match + ranking logic |
| `getRisingStars()` | RisingStar[] | New top contributors | SELECT from snapshots with calculations |
| `getUserActivity()` | Activity[] | Profile activity feed | SELECT filtered by user |
| `getAdminStats()` | AdminStat[] | Admin statistics | Multiple COUNT aggregates |
| `getPlatformStatus()` | PlatformStatus[] | System health | SELECT from monitoring table |

---

## Part 3: Existing Functions That Are Already Connected

These functions work correctly and don't need changes:

| Function | Status | Notes |
|----------|--------|-------|
| `getMatches()` | ✅ WORKING | Returns real match data with computed predictions |
| `getPredictions()` | ✅ WORKING | Returns user predictions with computed stats |
| `getUsers()` | ✅ WORKING | Returns all users with scores |
| `getComments()` | ✅ NEEDS FILTER | Works but should filter by match_id when used |
| `submitPrediction()` | ✅ WORKING | Inserts real predictions |
| `setMatchResult()` | ✅ WORKING | Admin function for match results |
| `evaluatePredictions()` | ✅ WORKING | Automatic scoring |
| `getAllPredictions()` | ✅ WORKING | Supports filtering |
| `getUsersWithStats()` | ✅ WORKING | Computes user accuracy |
| `getLeaderboard()` | ✅ WORKING | Returns real leaderboard |
| `recalculateAllIntelScores()` | ✅ WORKING | But inefficient for scale |

---

## Conclusion

- **24 new functions** needed for complete database integration
- **10 critical functions** for launch
- **Existing functions** are good foundation - just need new ones to expand coverage
- **Database structure** gaps will be filled in Phase 3

