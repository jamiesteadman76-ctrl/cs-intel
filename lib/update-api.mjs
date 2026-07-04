const fs = require('fs'); let c = fs.readFileSync('lib/api/index.ts', 'utf8'); c = c.replace(/team1: DbTeam/, 'team1_id?: string
  team2_id?: string
  tournament_id?: string
  team1: DbTeam'); fs.writeFileSync('lib/api/index.ts', c);
