# CS Intel - Copilot Instructions

This is a production-ready Next.js esports platform for Counter-Strike 2 analysis and betting intelligence.

## Project Overview

- **Type**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Theme**: Dark mode esports aesthetic
- **Status**: Development ready

## Key Features

- Fully responsive mobile-first design
- Premium component library (Header, Hero, MatchCards, etc.)
- Realistic CS2 team data with mock matches
- Community activity feed
- Rankings and featured match section
- Professional footer with social links

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000)

## File Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - Reusable React components
- `lib/` - Utilities, types, and mock data
- `tailwind.config.ts` - Tailwind CSS configuration

## Development Notes

- All components use TypeScript for type safety
- Global styles in `app/globals.css` include esports-specific effects
- Mock data in `lib/data.ts` includes realistic CS2 team examples
- No placeholder images - uses emoji-based team logos

## Build & Deploy

```bash
npm run build
npm start
```

The project is optimized for deployment on Vercel or any Node.js hosting platform.
