import { DASHBOARD_PAGES } from '@/config/pages-url.config'
import { ArrowRight, BarChart3, Shield, Wallet } from 'lucide-react'
import Link from 'next/link'

import { AccentButton } from '@/components/ui/buttons/accent-button'
import { Button } from '@/components/ui/buttons/button'
import { Card } from '@/components/ui/cards/card'
import { GlassBadge } from '@/components/ui/cards/glass-badge'
import { GlassCard } from '@/components/ui/cards/glass-card'

export default function HomePage() {
  return (
    <main className="relative overflow-hidden bg-background text-foreground">
      {/* ================= HERO ================= */}
      <section className="relative">
        {/* background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/60 to-background" />
          <div
            className="
              absolute left-1/2 top-[-320px]
              h-[720px] w-[720px]
              -translate-x-1/2
              rounded-full
              bg-accent/20
              blur-3xl
            "
          />
        </div>

        <div className="mx-auto max-w-6xl px-6 pt-40 pb-32 text-center">
          {/* badge */}
          <GlassBadge>🪙 Новый подход к личным финансам</GlassBadge>

          {/* title */}
          <h1 className="mt-10 text-6xl md:text-7xl font-semibold tracking-tight">
            Финансы
            <br />
            <span className="text-accent">без лишнего шума</span>
          </h1>

          {/* description */}
          <p className="mt-8 max-w-2xl mx-auto text-xl md:text-2xl text-muted-foreground">
            MyMoney — спокойный контроль денег, счетов и расходов. Минимализм.
            Прозрачность. Фокус.
          </p>

          {/* actions */}
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
            <AccentButton asChild>
              <Link href={DASHBOARD_PAGES.HOME}>
                Начать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </AccentButton>

            <Button
              size="lg"
              variant="ghost"
              className="h-12 px-8 rounded-full text-base"
              asChild
            >
              <Link
                target="_blank"
                href="https://github.com/zoom1fy/mymoney"
              >
                GitHub
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="mx-auto max-w-6xl px-6 py-32">
        <div className="mb-20 text-center">
          <h2 className="text-4xl font-semibold tracking-tight">
            Всё, что нужно — и ничего лишнего
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Мы убрали шум и оставили только то, что действительно помогает
            контролировать финансы.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<Wallet />}
            title="Счета и балансы"
            description="Все ваши счета, наличные и карты в одном интерфейсе с актуальными остатками."
          />
          <FeatureCard
            icon={<BarChart3 />}
            title="Аналитика расходов"
            description="Понятная статистика без перегруженных графиков и лишних деталей."
          />
          <FeatureCard
            icon={<Shield />}
            title="Конфиденциальность"
            description="Данные принадлежат только вам. Без рекламы, трекеров и облачных рисков."
          />
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="px-6 pb-32">
        <GlassCard className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl">
          <div className="absolute inset-0 -z-10">
            <div
              className="
                absolute right-[-240px] top-[-240px]
                h-[520px] w-[520px]
                rounded-full
                bg-accent/25
                blur-3xl
              "
            />
          </div>

          <div className="p-16 text-center">
            <h2 className="text-4xl font-semibold tracking-tight">
              Контроль, который не напрягает
            </h2>

            <p className="mt-4 max-w-xl mx-auto text-lg text-muted-foreground">
              MyMoney помогает выстроить спокойные отношения с деньгами — без
              стресса и перегрузки.
            </p>

            <AccentButton
              asChild
              className="mt-8"
            >
              <Link href={DASHBOARD_PAGES.HOME}>Попробовать сейчас</Link>
            </AccentButton>
          </div>
        </GlassCard>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t py-12 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} MyMoney · Минимализм для финансов
      </footer>
    </main>
  )
}

/* ================= FEATURE CARD ================= */

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <GlassCard
      className="
        group relative
        overflow-hidden
        rounded-2xl
        border
        bg-card
        p-8
        transition
        hover:-translate-y-1
        hover:shadow-xl
      "
    >
      <div
        className="
          flex h-12 w-12 items-center justify-center
          rounded-xl
          bg-foreground/5
          transition
          group-hover:bg-accent/15
        "
      >
        <div
          className="
            h-6 w-6
            text-foreground
            transition
            group-hover:text-accent
          "
        >
          {icon}
        </div>
      </div>

      <h3 className="mt-6 text-xl font-medium">{title}</h3>

      <p className="mt-3 text-muted-foreground">{description}</p>
    </GlassCard>
  )
}
