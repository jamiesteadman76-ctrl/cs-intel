import re

path = r'C:\Users\Percy Jay\Documents\CS Intel\lib\api\index.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

assert len(content) > 1000, f'File too short: {len(content)} bytes'

checks = {
    'fetchMatchesWithTeams new body': 'const rows = Array.isArray(data) ? data : data ? [data] : []',
    'getMatchById maybeSingle': "eq('id', String(id)).maybeSingle()",
    'submitPrediction upcoming only': "if (match.status !== 'upcoming') return { success: false, error: 'Predictions are closed for this match' }",
    'getTeamBySlug maybeSingle': "eq('slug', String(slug)).maybeSingle()",
    'getTournamentBySlug maybeSingle': "eq('slug', String(slug)).maybeSingle()",
    'getComments user join': "user:users!user_id(id, username, avatar)",
    'getComments Anonymous fallback': "username: row.user.username ?? 'Anonymous'",
    'getAdminDashboardStats 7 queries': 'sb.from(\'intel_posts\').select(\'id\', { count: \'exact\', head: true })',
    'getAdminDashboardStats totalPosts sum': 'totalPosts: (ip.count ?? 0) + (bp.count ?? 0)',
    'getBlogPosts published param': 'published?: boolean | null',
    'getIntelPosts published param': 'published?: boolean | null',
}

for name, snippet in checks.items():
    assert snippet in content, f'Missing: {name}'

print('All replacements verified successfully.')
