import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function DisclaimerPage() {
  return (
    <div className="bg-[#0f1419] text-gray-100 min-h-screen">
      <Header />

      <main className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header with warning icon */}
          <div className="mb-12 md:mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#e94560]/10 border border-[#e94560]/30 flex items-center justify-center text-xl">
                ⚠️
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Disclaimer
              </h1>
            </div>
            <p className="text-sm text-gray-500">
              Last updated: May 2026
            </p>
          </div>

          {/* Intro warning */}
          <div className="mb-12 md:mb-16 bg-[#e94560]/5 border border-[#e94560]/20 rounded-xl p-6">
            <p className="text-base text-gray-300 leading-relaxed">
              CS Intel is an <strong className="text-white">informational platform</strong> for Counter-Strike 2 analysis and community discussion. It is <strong className="text-white">not</strong> a gambling service, financial advisor, or betting recommendation platform.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-12 md:space-y-16">

            {sections.map((section) => (
              <section key={section.id}>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">
                  {section.title}
                </h2>
                <div className="space-y-4 text-sm md:text-base text-gray-400 leading-relaxed">
                  {section.paragraphs.map((text, i) => (
                    <p key={i}>{text}</p>
                  ))}
                  {section.bullets && (
                    <ul className="list-disc list-inside space-y-2 ml-1">
                      {section.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}

          </div>

          {/* Responsible gambling notice */}
          <div className="mt-16 bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-gray-700 rounded-xl p-6 md:p-8">
            <h3 className="text-lg font-bold text-white mb-3">Responsible Engagement</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              If you or someone you know has a gambling problem, help is available. Gambling should be entertaining, not a way to make money. Never bet more than you can afford to lose.
            </p>
            <p className="text-xs text-gray-500">
              Gambling HelpLine: 1-800-GAMBLER • gam-anon.org
            </p>
          </div>

          {/* Contact */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              Questions about this disclaimer? Contact us at{' '}
              <span className="text-[#00d4ff]">legal@csintel.gg</span>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

const sections = [
  {
    id: 'advice',
    title: 'Not Financial Advice',
    paragraphs: [
      'All content on CS Intel — including match analysis, predictions, and community opinions — is for informational and entertainment purposes only. Nothing on this platform constitutes financial, investment, or betting advice.',
    ],
    bullets: [
      'No content should be interpreted as a recommendation to bet',
      'We do not provide financial or investment guidance',
      'Past prediction accuracy does not guarantee future results',
      'Consult a qualified professional for financial advice',
    ],
  },
  {
    id: 'guarantee',
    title: 'No Gambling Guarantee',
    paragraphs: [
      'CS Intel does not guarantee the accuracy of any predictions, analysis, or community-contributed content. Counter-Strike 2 matches are inherently unpredictable, and outcomes are never certain.',
    ],
    bullets: [
      'All predictions reflect opinion, not certainty',
      'No method can guarantee successful betting outcomes',
      'Match results may differ from community predictions',
      'We are not affiliated with any bookmaker or betting organisation',
    ],
  },
  {
    id: 'community',
    title: 'Community Opinions Only',
    paragraphs: [
      'CS Intel hosts discussions and predictions from a community of users. These views represent individual contributors, not CS Intel as an organisation. Accuracy varies widely between contributors.',
    ],
    bullets: [
      'Community predictions are personal opinions',
      'Reputation scores reflect historical track records',
      'High reputation does not guarantee future accuracy',
      'Always conduct your own research before making decisions',
    ],
  },
  {
    id: 'liability',
    title: 'No Responsibility for Betting Losses',
    paragraphs: [
      'CS Intel is not liable for any financial losses, damages, or consequences arising from your use of the platform or reliance on any content published here. You use the Service entirely at your own risk.',
    ],
    bullets: [
      'We are not responsible for betting or financial losses',
      'No liability for decisions made based on platform content',
      'Users assume full responsibility for their actions',
      'Platform is provided "as-is" without warranties of any kind',
    ],
  },
  {
    id: 'informational',
    title: 'Informational Platform Only',
    paragraphs: [
      'CS Intel is designed as a discussion and analysis platform for Counter-Strike 2 enthusiasts. It is not a gambling site, bookmaker, betting exchange, or financial services provider.',
    ],
    bullets: [
      'No odds, lines, or betting markets are provided by CS Intel',
      'No wagering or payment processing takes place here',
      'Links to external sites are not endorsements',
      'We do not profit from user betting activity',
    ],
  },
]