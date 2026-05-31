import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function TermsPage() {
  return (
    <div className="bg-[#0f1419] text-gray-100 min-h-screen">
      <Header />

      <main className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-12 md:mb-16">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-sm text-gray-500">
              Last updated: May 2026
            </p>
          </div>

          {/* Intro */}
          <div className="mb-12 md:mb-16">
            <p className="text-base text-gray-400 leading-relaxed">
              By accessing or using CS Intel (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.
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

          {/* Contact */}
          <div className="mt-16 pt-8 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              Questions about these terms? Reach us at{' '}
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
    id: 'acceptance',
    title: 'Acceptance of Terms',
    paragraphs: [
      'These Terms of Service govern your use of CS Intel. By registering, browsing, or contributing content, you accept these terms in full. If any provision is found unenforceable, the remaining terms remain in effect.',
    ],
    bullets: [
      'You must be at least 13 years old to use the Service',
      'You are responsible for compliance with local laws',
      'We may update these terms periodically with notice',
      'Continued use after changes constitutes acceptance',
    ],
  },
  {
    id: 'responsibilities',
    title: 'User Responsibilities',
    paragraphs: [
      'You are responsible for your account activity and all content you submit. Keep your credentials secure and notify us immediately of any unauthorised access.',
    ],
    bullets: [
      'Maintain accurate account information',
      'Keep your password confidential',
      'Do not share or transfer your account',
      'Report bugs, errors, or security issues promptly',
      'Use the Service only for lawful purposes',
    ],
  },
  {
    id: 'guidelines',
    title: 'Community Guidelines',
    paragraphs: [
      'CS Intel is a community-driven platform. All users are expected to contribute constructively and treat others with respect.',
    ],
    bullets: [
      'No harassment, hate speech, or personal attacks',
      'No spam, manipulation, or artificial voting',
      'No sharing of exploitative betting schemes',
      'No posting of copyrighted material without permission',
      'No impersonation of other users or professionals',
      'Violations may result in content removal or account suspension',
    ],
  },
  {
    id: 'ownership',
    title: 'Content Ownership',
    paragraphs: [
      'You retain ownership of the content you post. By submitting content, you grant us a non-exclusive, worldwide, royalty-free licence to display, distribute, and promote that content within the Service.',
    ],
    bullets: [
      'You own your predictions, posts, and comments',
      'We may feature content in public feeds and marketing',
      'We may remove content that violates these terms',
      'Content does not reflect official CS Intel endorsement',
    ],
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    paragraphs: [
      'CS Intel is provided on an &quot;as-is&quot; basis. We do not guarantee accuracy of predictions, analysis, or community content. Betting involves risk — always gamble responsibly.',
    ],
    bullets: [
      'We are not liable for betting losses or financial decisions',
      'No warranty for prediction accuracy or match outcomes',
      'Service may be interrupted for maintenance or updates',
      'Our liability is limited to the maximum extent permitted by law',
      'We are not responsible for third-party content or links',
    ],
  },
]