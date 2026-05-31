import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
  return (
    <div className="bg-[#0f1419] text-gray-100 min-h-screen">
      <Header />

      <main className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-12 md:mb-16">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-gray-500">
              Last updated: May 2026
            </p>
          </div>

          {/* Intro */}
          <div className="mb-12 md:mb-16">
            <p className="text-base text-gray-400 leading-relaxed">
              CS Intel (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
              This policy explains how we collect, use, and safeguard your personal information when you use our platform.
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
              If you have questions about this policy, contact us at{' '}
              <span className="text-[#00d4ff]">privacy@csintel.gg</span>
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
    id: 'collect',
    title: 'Data We Collect',
    paragraphs: [
      'We collect information you provide directly, such as your username, email address, and any content you post (predictions, comments, analysis).',
    ],
    bullets: [
      'Account information: username, email, profile details',
      'Content you create: predictions, comments, posts',
      'Usage data: pages visited, features used, session length',
      'Device and log data: IP address, browser type, device identifiers',
    ],
  },
  {
    id: 'use',
    title: 'How We Use Data',
    paragraphs: [
      'Your data powers the core CS Intel experience — leaderboards, reputation scoring, community feeds, and match analysis. We also use it to improve the platform and communicate with you.',
    ],
    bullets: [
      'Provide and maintain the platform',
      'Calculate Intel Score and community rankings',
      'Personalize your feed and recommendations',
      'Send service announcements and updates',
      'Detect and prevent abuse or spam',
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies',
    paragraphs: [
      'We use essential cookies to keep you logged in and maintain session state. Analytics cookies help us understand how the platform is used so we can improve it. You can disable non-essential cookies through your browser settings.',
    ],
    bullets: [
      'Session cookies: required for login and core functionality',
      'Analytics cookies: anonymized usage statistics',
      'Preference cookies: remember your display settings',
      'No third-party advertising cookies',
    ],
  },
  {
    id: 'accounts',
    title: 'User Accounts',
    paragraphs: [
      'You are responsible for maintaining the security of your account credentials. We recommend using a strong, unique password. You may delete your account at any time through account settings, which will remove your public data from the platform within 30 days.',
    ],
    bullets: [
      'You own the content you post',
      'You may request data export or deletion',
      'Accounts inactive for 2+ years may be archived',
      'We will never sell your personal information',
    ],
  },
  {
    id: 'protection',
    title: 'Data Protection',
    paragraphs: [
      'We implement industry-standard security measures to protect your data. All data transmission is encrypted via TLS. Access to personal data within our team is restricted on a need-to-know basis, and we regularly audit our systems for vulnerabilities.',
    ],
    bullets: [
      'TLS encryption for all data in transit',
      'Restricted internal access controls',
      'Regular security audits and reviews',
      'No sale or rental of personal data to third parties',
    ],
  },
  {
    id: 'third-party',
    title: 'Third-Party Services',
    paragraphs: [
      'We integrate with a small number of third-party services to operate. These services are contractually required to protect your data and may only use it for the purposes we specify.',
    ],
    bullets: [
      'Authentication: secure login infrastructure',
      'Analytics: anonymized platform usage data',
      'Hosting: data stored in EU-based data centers',
      'No third-party advertising or tracking networks',
    ],
  },
]