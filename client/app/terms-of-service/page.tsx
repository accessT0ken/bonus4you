"use client"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white relative">
      <div className="absolute top-0 left-0 w-full h-[220px] bg-gradient-to-b from-purple-600/30 via-fuchsia-500/15 to-transparent pointer-events-none z-0" />
      <SiteHeader />

      <main className="pt-32 pb-20 px-4 relative z-10">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-foreground">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-10">
            Last updated: 18 December 2025
          </p>

          <div className="space-y-8 text-sm md:text-base text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">1. Introduction</h2>
              <p>
                These Terms of Service (&quot;Terms&quot;) govern your use of the bonus4you website (the &quot;Service&quot;).
                By accessing or using bonus4you, you agree to be bound by these Terms. If you do not agree with any part
                of the Terms, you must not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">2. Our role</h2>
              <p>
                bonus4you is an information and comparison service. We review and list third‑party online casinos and
                bonus offers. We are not a casino operator, we do not handle real‑money deposits or withdrawals, and we
                are not a party to any gambling contract between you and a casino.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">3. Eligibility</h2>
              <p>
                The Service is intended only for individuals who are of legal gambling age in their jurisdiction. By
                using bonus4you, you confirm that you are at least 18 years old (or older, if required in your country)
                and that online gambling is legal where you live.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">4. No guarantees or warranties</h2>
              <p className="mb-2">
                We aim to keep information accurate and up to date, but we cannot guarantee that:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>All bonus offers, wagering requirements, and terms are always correct or current.</li>
                <li>The casinos we list will always accept you as a player.</li>
                <li>The Service will be available without interruption or free of errors.</li>
              </ul>
              <p className="mt-2">
                You should always check the full terms and conditions on the casino&apos;s own website before registering
                or making a deposit.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">5. Affiliate links and compensation</h2>
              <p>
                Some of the links on bonus4you are affiliate or partner links. This means we may receive a commission
                when you click on a link and sign up or play at a casino. This helps support the Service and keep it
                free for users. Our opinions and rankings are based on our own criteria and experience, but you should
                always do your own research before playing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">6. Responsible gambling</h2>
              <p>
                Gambling involves risk and can be addictive. Only gamble with money you can afford to lose. If you feel
                that gambling is negatively affecting your life, we strongly encourage you to seek help from professional
                organisations such as{" "}
                <a
                  href="https://www.begambleaware.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  BeGambleAware.org
                </a>{" "}
                or your local support service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">7. Limitation of liability</h2>
              <p>
                To the maximum extent permitted by law, bonus4you and its owners shall not be liable for any direct,
                indirect, incidental, consequential, or special damages arising out of or in connection with your use of
                the Service, including but not limited to loss of profits, loss of data, or financial losses at any
                third‑party casino.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">8. User responsibilities</h2>
              <p className="mb-2">When using bonus4you, you agree that you will not:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use the Service for any illegal or unauthorised purpose.</li>
                <li>Attempt to hack, disrupt, or interfere with the Service or its infrastructure.</li>
                <li>Copy, scrape, or reproduce content from bonus4you without our permission.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">9. Changes to the Service and Terms</h2>
              <p>
                We may modify, suspend, or discontinue any part of the Service at any time without prior notice. We may
                also update these Terms from time to time. When we make changes, we will update the &quot;Last updated&quot;
                date at the top of this page. Your continued use of bonus4you after changes are posted means you accept
                the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">10. Governing law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws applicable in your country or
                region, except where local laws require otherwise. Any disputes arising out of or relating to these
                Terms shall be subject to the jurisdiction of the competent courts in your place of residence, where
                permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">11. Contact</h2>
              <p>
                If you have any questions about these Terms or about bonus4you in general, please contact us at{" "}
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


