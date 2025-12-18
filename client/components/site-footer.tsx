"use client"

import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="bg-primary/5 backdrop-blur-sm rounded-3xl border border-primary/10 shadow-lg px-8 py-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center gap-2 mb-3">
              <img src="/assets/BONUS4YOU_DARK_BLURRY.png" alt="bonus4you" className="h-12 w-auto object-contain" />
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Your trusted source for{" "}
              <span className="font-semibold text-primary">casino bonus</span> comparisons and{" "}
              <span className="font-semibold text-primary">reviews</span> since 2025
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <Link href="/casinos/cs2" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              CS2 Bonuses
            </Link>
            <Link href="/casinos/general" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Casino Bonuses
            </Link>
            <Link href="/guides" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Guides
            </Link>
            <Link href="/reviews" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Reviews
            </Link>
            <Link href="/privacy-policy" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>

          <div className="pt-6 border-t border-primary/10 text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-primary">Responsible Gambling:</span> We promote responsible gambling.
              Visit{" "}
              <a
                href="https://www.begambleaware.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
              >
                BeGambleAware.org
              </a>{" "}
              for help.
            </p>
            <p className="text-sm text-muted-foreground">
              © 2025 <span className="font-semibold text-primary">bonus4you</span>. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

