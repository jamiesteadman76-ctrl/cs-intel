# CS Intel - Counter-Strike 2 Betting Intelligence Platform

A modern, premium esports platform for Counter-Strike 2 analysis, community predictions, and betting intelligence.

## Features

- **Live Match Analysis** - Real-time match data with community predictions
- **Featured Matches** - In-depth analysis on key matchups
- **Community Intel** - Latest team form updates, roster changes, and betting market movements
- **Community Activity** - Live feed of user predictions and discussions
- **Team Rankings** - Up-to-date team performance ratings
- **Match Hub Page** - Dedicated page for match analysis with discussion threads
- **Community Confidence** - Visual prediction charts and sentiment analysis
- **Player Tracking** - Key player stats and recent form indicators
- **Responsive Design** - Fully optimized for mobile and desktop
- **Dark Theme** - Premium esports aesthetic

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment Ready**: Optimized for production

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
cs-intel/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   ├── matches/
│   │   └── page.tsx        # Match Hub page
│   └── globals.css         # Global styles
├── components/
│   ├── Header.tsx          # Navigation header
│   ├── Hero.tsx            # Hero section
│   ├── MatchCard.tsx       # Match card component
│   ├── FeaturedMatch.tsx   # Featured match display
│   ├── IntelPostCard.tsx   # Intel post card
│   ├── CommunityActivityItem.tsx  # Activity feed item
│   ├── RankingItem.tsx     # Ranking list item
│   ├── Footer.tsx          # Footer
│   ├── MatchHeader.tsx     # Match page header
│   ├── CommunityConfidence.tsx    # Prediction confidence widget
│   ├── MatchSnapshot.tsx   # 4 stat cards
│   ├── KeyPlayers.tsx      # Player showcase
│   ├── CommunityDiscussionItem.tsx  # Individual comment
│   ├── CommunityDiscussionFeed.tsx  # Discussion thread
│   ├── CommunityPredictionsWidget.tsx # Predictions list
│   ├── IntelFeed.tsx       # Intelligence updates
│   ├── RelatedMatchCard.tsx # Small match card
│   └── TournamentInfoWidget.tsx    # Tournament sidebar
├── lib/
│   ├── data.ts            # Mock data and data structures
│   └── types.ts           # TypeScript types
├── tailwind.config.ts      # Tailwind configuration
└── tsconfig.json          # TypeScript configuration
```

## Components

### Header
- Sticky navigation with logo
- Desktop navigation links
- Mobile hamburger menu
- Login and Sign Up buttons

### Hero Section
- Large headline with gradient text
- Subheadline
- Call-to-action buttons
- Esports-inspired background effects

### Match Cards
- Team names and logos
- Match time and tournament
- Community sentiment percentage
- View Match button

### Featured Match
- Premium card styling
- Team logos and names
- Evidence score
- Prediction percentages
- Open Match Hub button

### Latest Intel
- Category badges (Team Form, Roster Change, Tournament, Betting)
- Post titles and timestamps
- Comment count
- Hover effects

### Community Activity
- User avatars with initials
- Activity descriptions
- Vote count
- Timestamp

### Rankings
- Team position with color gradient
- Team name
- Rating score
- Rank change indicator

### Footer
- Company and product links
- Legal links
- Social media links
- Copyright information

## Styling

The platform uses a custom dark theme with esports-inspired colors:

- **Primary Dark**: #0f1419
- **Secondary Dark**: #1a1f2e
- **Accent**: #0f3460
- **Highlight**: #e94560 (Neon Red)
- **Success**: #00d4ff (Cyan)

All components feature hover effects, smooth transitions, and gradient accents for a premium feel.

## Mock Data

The platform includes realistic CS2 team data with:
- 6 today's matches with team names and logos
- 1 featured match with detailed statistics
- 4 intelligence posts with categories
- 4 community activity samples
- Top 5 team rankings

## Performance

- Mobile-first responsive design
- Optimized for fast loading
- Zero external image dependencies (emoji-based team logos)
- Minimal CSS footprint with Tailwind CSS

## Future Enhancements

- User authentication
- Real-time match data integration
- Live odds updates
- User predictions and betting
- Advanced analytics dashboard
- Mobile app

## License

Proprietary - CS Intel 2024
