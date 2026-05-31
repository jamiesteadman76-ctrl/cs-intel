# Match Hub Page Documentation

## Overview

The Match Hub page is the central destination for users to discuss, analyze, and make predictions about Counter-Strike 2 matches on CS Intel. It combines elements from HLTV, Reddit, and modern SaaS dashboards.

**Route**: `/matches`

## Page Structure

### 1. Match Header
- **Purpose**: Displays match overview with team information
- **Features**:
  - Team logos and names (emoji-based)
  - Match status badge (Upcoming, Live, Finished)
  - Tournament name
  - Match time
  - Evidence Score (0-10)
  - Professional gradient styling

### 2. Community Confidence
- **Purpose**: Shows community prediction sentiment
- **Features**:
  - Large confidence percentage bars
  - Team-specific prediction percentages
  - Reasons why community favors one team
  - Color-coded reasons with checkmarks
  - Maintains design consistency with homepage

### 3. Match Snapshot
- **Purpose**: Quick statistical overview in dashboard cards
- **Contains 4 Cards**:
  1. **Recent Form**: Win/loss indicator bars
  2. **Map Pool Advantage**: Percentage advantage
  3. **Player Form**: Top performing player with rating
  4. **Head to Head**: Historical matchup results

### 4. Key Players
- **Purpose**: Showcases star performers from each team
- **Features**:
  - 2 players per team
  - Player avatar (emoji)
  - Player name
  - Rating score
  - K/D ratio
  - Recent form indicators (colored dots)
  - Two-column layout (one per team)

### 5. Community Discussion Feed
- **Purpose**: Reddit-like discussion thread for match analysis
- **Features**:
  - Username with avatar
  - Timestamp
  - Comment content
  - Upvote count with icon
  - Reply button
  - Reply count display
  - "Load More Comments" button
  - "Sort by Hot" dropdown
  - Professional forum styling

### 6. Top Community Picks
- **Purpose**: Displays user predictions for the match
- **Features**:
  - Username
  - Match prediction (e.g., "FaZe 2-1")
  - Confidence percentage (visual bar)
  - Timestamp
  - "Make Your Prediction" CTA button
  - Compact card design

### 7. Latest Intel
- **Purpose**: Real-time match intelligence updates
- **Features**:
  - Icon-based categories
  - Content text
  - Timestamp
  - Examples:
    - Team form updates
    - Odds changes
    - Player performance notes
  - Social feed styling

### 8. Upcoming Matches
- **Purpose**: Related matches section
- **Features**:
  - 4-card grid (responsive to 2-col on mobile)
  - Tournament badge
  - Team names with logos
  - Match time
  - Small, compact cards
  - Clickable for navigation

### 9. Right Sidebar - Tournament Info
- **Purpose**: Tournament context and CTA
- **Features**:
  - Sticky positioning (stays visible while scrolling)
  - Tournament name
  - Tournament stage
  - Prize pool (formatted in cyan)
  - Team count
  - "View Tournament" CTA button
  - Divider lines between sections

## Layout & Responsiveness

### Desktop (1024px+)
- 3-column layout: main content (2 cols) + sidebar (1 col)
- Full community confidence bars
- Sidebar sticky positioned
- 4-column match cards grid

### Tablet (768px-1023px)
- 2-column layout when needed
- Stacked sections
- Responsive typography

### Mobile (under 768px)
- Single column layout
- Sidebar content below main content
- Vertical card stacking
- Optimized spacing and touch targets
- Compressed match header with vertical team display

## Component Files

| Component | File | Purpose |
|-----------|------|---------|
| MatchHeader | `MatchHeader.tsx` | Match overview with teams and status |
| CommunityConfidence | `CommunityConfidence.tsx` | Prediction bars and reasons |
| MatchSnapshot | `MatchSnapshot.tsx` | 4 stat cards |
| KeyPlayers | `KeyPlayers.tsx` | Player showcase cards |
| CommunityDiscussionItem | `CommunityDiscussionItem.tsx` | Individual comment |
| CommunityDiscussionFeed | `CommunityDiscussionFeed.tsx` | Full discussion thread |
| CommunityPredictionsWidget | `CommunityPredictionsWidget.tsx` | Top predictions list |
| IntelFeed | `IntelFeed.tsx` | Intelligence updates |
| RelatedMatchCard | `RelatedMatchCard.tsx` | Small match card |
| TournamentInfoWidget | `TournamentInfoWidget.tsx` | Sidebar tournament info |

## Data Types

### Main Types (in lib/types.ts)
- `Match`: Full match data including teams, players, stats
- `Player`: Individual player stats and recent form
- `CommunityComment`: Discussion feed comments
- `CommunityPrediction`: User predictions
- `IntelUpdate`: Intelligence feed items
- `MatchTournament`: Tournament metadata

### Mock Data (in lib/data.ts)
- `featuredMatch`: Complete match with all data
- `communityComments`: 5 realistic discussion comments
- `communityPredictions`: 5 different predictions with confidence
- `intelUpdates`: 5 intelligence updates with icons
- `relatedMatches`: 4 upcoming matches
- `matchTournament`: Tournament information

## Design System

### Color Palette
- **Primary Background**: #0f1419
- **Card Background**: #1a1f2e
- **Dark Overlay**: #0a0d12
- **Accent**: #e94560 (Neon Red)
- **Success/Info**: #00d4ff (Cyan)
- **Text**: Gray scale (#e0e0e0 to #505050)

### Typography
- **Headings**: Bold sans-serif (2xl to 4xl)
- **Body**: Regular sans-serif (sm to base)
- **Labels**: Uppercase, smaller sizes, tracking

### Components
- **Cards**: Gradient backgrounds, 1px borders
- **Buttons**: Gradient backgrounds, hover effects
- **Bars**: Rounded full, gradient fills
- **Avatars**: Circular, gradient backgrounds, emoji

## Interaction Patterns

1. **Hover Effects**: Cards lift slightly with shadow increase
2. **Button States**: Gradient intensifies on hover
3. **Links**: Color change on hover
4. **Sort Dropdown**: Allows filtering discussion
5. **Prediction Button**: Modal or new page (not implemented)
6. **Reply Button**: Comment reply interface (not implemented)

## Future Enhancements

1. Actual comment posting system
2. User authentication for predictions
3. Real-time updates via WebSocket
4. Live match score updates
5. Map veto display
6. Player camera views (if available)
7. Betting odds integration
8. Community voting on predictions
9. Comment filtering and sorting
10. Keyboard navigation support

## Performance Considerations

- Components are memoized to prevent unnecessary re-renders
- Lazy loading for "Load More" comments
- Optimized SVG icons for social links
- Responsive images (emoji-based, no file requests)
- Sticky sidebar doesn't impact scroll performance

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigable buttons
- Color contrast ratios meet WCAG standards
- Skip-to-content links potential
- Form labels properly associated
