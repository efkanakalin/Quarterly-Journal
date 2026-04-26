export function Privacy() {
  return (
    <div className="min-h-screen bg-[#050506] text-white px-6 py-16">
      <div className="mx-auto max-w-2xl space-y-10">

        {/* Header */}
        <div className="space-y-2">
          <a href="/" className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#8a9eff]/70 hover:text-[#8a9eff] transition-colors">
            ← Quarterly Journal
          </a>
          <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-white/40">Last updated: April 2026</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-white/70">

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">1. Who we are</h2>
            <p>
              Quarterly Journal (<strong className="text-white">quarterlyjournal.org</strong>) is a personal trading journal
              application designed for traders who follow the Quarterly Theory framework. It is operated as an
              independent project.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">2. What data we collect</h2>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong className="text-white/90">Account information:</strong> your Google account email address and display name, collected when you sign in with Google.</li>
              <li><strong className="text-white/90">Trade data:</strong> trade entries, outcomes, notes, chart links, and confirmation tags that you manually enter or import via CSV.</li>
              <li><strong className="text-white/90">Profile data:</strong> a username you choose during onboarding.</li>
              <li><strong className="text-white/90">Usage preferences:</strong> theme, language, and customization settings stored locally in your browser.</li>
            </ul>
            <p>We do not collect payment information, IP addresses beyond what Supabase logs for security, or any sensitive personal data beyond what is listed above.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">3. How we use your data</h2>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>To provide and operate the journal application.</li>
              <li>To display your trades, statistics, and performance metrics within the app.</li>
              <li>We do not sell, share, or transfer your data to any third party for marketing purposes.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">4. Data storage &amp; security</h2>
            <p>
              Your data is stored on <strong className="text-white/90">Supabase</strong> (supabase.com), a hosted database
              platform. Data is encrypted at rest and protected by row-level security — only you can access your own records.
              Supabase's infrastructure complies with SOC 2 Type II.
            </p>
            <p>
              We do not have access to your trade data in any meaningful way beyond what is necessary to operate the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">5. Cookies &amp; local storage</h2>
            <p>
              We use browser local storage to save your preferences (theme, language, customization settings).
              Authentication tokens are stored in cookies managed by Supabase. No third-party tracking cookies are used.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">6. Your rights</h2>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong className="text-white/90">Access:</strong> You can view all your data within the application at any time.</li>
              <li><strong className="text-white/90">Export:</strong> Your trades can be reviewed and referenced within the app.</li>
              <li><strong className="text-white/90">Deletion:</strong> You may request complete deletion of your account and all associated data by contacting us.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">7. Third-party services</h2>
            <p>We use the following third-party services to operate the application:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li><strong className="text-white/90">Supabase</strong> — database, authentication, edge functions (supabase.com/privacy)</li>
              <li><strong className="text-white/90">Google OAuth</strong> — sign-in only; we receive your email and name (policies.google.com/privacy)</li>
              <li><strong className="text-white/90">Netlify</strong> — hosting (netlify.com/privacy)</li>
              <li><strong className="text-white/90">Financial Juice</strong> — live news headlines (no personal data shared)</li>
              <li><strong className="text-white/90">Finnhub</strong> — economic calendar data (no personal data shared)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">8. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Changes will be reflected by the "Last updated" date above.
              Continued use of the application after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">9. Contact</h2>
            <p>
              For any privacy-related questions or deletion requests, please reach out via the GitHub repository at{' '}
              <a
                href="https://github.com/efkanakalin/Quarterly-Journal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8a9eff] hover:underline"
              >
                github.com/efkanakalin/Quarterly-Journal
              </a>.
            </p>
          </section>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Quarterly Journal. All rights reserved.
        </div>
      </div>
    </div>
  )
}
