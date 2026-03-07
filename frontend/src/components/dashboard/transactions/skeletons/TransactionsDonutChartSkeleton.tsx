'use client'

export function TransactionsDonutChartSkeleton() {
  return (
    <div className="relative h-[300px] sm:h-[500px] w-full animate-pulse">
      {/* Квадратный контейнер для donut — всегда круг */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="aspect-square w-[min(85%,300px)] sm:w-[min(80%,400px)] rounded-full border-[30px] sm:border-[45px] border-muted/30">
          {/* Здесь можно добавить градиент или имитацию секторов */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-muted/10 via-transparent to-muted/5 opacity-50" />
        </div>
      </div>

      {/* Внутренний круг — тоже квадратный */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="aspect-square w-[min(55%,180px)] sm:w-[min(50%,280px)] rounded-full bg-background/80" />
      </div>

      {/* Текст в центре */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-4">
        <div className="h-5 w-28 sm:h-6 sm:w-36 bg-muted/40 rounded-full" />
        <div className="h-9 w-48 sm:h-12 sm:w-64 bg-muted/50 rounded-full" />
      </div>
    </div>
  )
}