"use client"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white relative">
      <div className="absolute top-0 left-0 w-full h-[220px] bg-gradient-to-b from-purple-600/30 via-fuchsia-500/15 to-transparent pointer-events-none z-0" />
      <SiteHeader />

      <main className="pt-32 pb-20 px-4 relative z-10">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-10">
            Last updated: 18 December 2025
          </p>

          <div className="space-y-8 text-sm md:text-base text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">1. Who we are</h2>
              <p>
                bonus4you (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is a comparison and review website for
                online casinos and bonus offers. We do not operate an online casino ourselves and we do not process
                deposits or withdrawals for players.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">2. What information we collect</h2>
              <p className="mb-2">
                We aim to collect as little personal information as possible. Depending on how you use our site, we may
                collect:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Basic analytics data such as pages visited, device type, and approximate location (country/region).</li>
                <li>Technical data like IP address and browser information for security and analytics.</li>
                <li>Contact details you provide if you reach out to us directly (for example via email).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">3. How we use your information</h2>
              <p className="mb-2">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Operate, maintain, and improve the bonus4you website.</li>
                <li>Understand how visitors use our site so we can improve content and user experience.</li>
                <li>Prevent abuse, fraud, or security issues.</li>
                <li>Respond to your messages or support requests.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">4. Cookies and analytics</h2>
              <p>
                We may use cookies and similar technologies to remember your preferences and to measure traffic on our
                pages. Third-party analytics tools (such as privacy‑friendly analytics) may collect anonymised or
                pseudonymised data about your visit. You can usually control cookies via your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">5. Links to third‑party sites</h2>
              <p>
                bonus4you links to external casinos and third‑party websites. When you click a &quot;Claim Bonus&quot;
                or similar button, you are leaving our site. We are not responsible for how those third parties collect
                or use your data. Always review the privacy policy of each casino or partner site you visit.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">6. Data retention</h2>
              <p>
                We keep analytics and log data only for as long as needed to provide our services, troubleshoot issues,
                and meet any legal or regulatory obligations. When data is no longer required, we try to delete it or
                anonymise it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">7. Your rights</h2>
              <p className="mb-2">
                Depending on your location, you may have rights over your personal data, such as:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>The right to access or receive a copy of the personal data we hold about you.</li>
                <li>The right to request correction or deletion of your personal data.</li>
                <li>The right to object to certain processing activities.</li>
              </ul>
              <p className="mt-2">
                To exercise these rights, you can contact us using the details below. We may need to verify your identity
                before responding.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">8. Responsible gambling</h2>
              <p>
                We promote responsible gambling. Our content is for adults only and is not intended for individuals under
                the legal gambling age in their jurisdiction. If you feel that gambling is becoming a problem, please
                seek help from professional organisations such as{" "}
                <a
                  href="https://www.begambleaware.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  BeGambleAware.org
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">9. Changes to this policy</h2>
              <p>
                We may update this Privacy Policy from time to time. When we do, we will change the &quot;Last updated&quot;
                date at the top of this page. We encourage you to review this page periodically to stay informed about
                how we protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">10. Contact us</h2>
              <p>
                If you have any questions about this Privacy Policy or how we handle your data, please contact us at{" "}
                <span className="text-primary font-semibold">support@bonus4you.com</span>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}


