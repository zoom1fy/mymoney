'use client'

import { DateRangePicker } from './DateRangePicker'
import { DateRangePickerSkeleton } from './DateRangePickerSkeleton'
import { TransactionsDonutChartSkeleton } from './TransactionsDonutChartSkeleton'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface Props {
  donutData: any[]
  total: number
  isExpense: boolean
  range: { from: Date; to: Date }
  onRangeChange: (r: { from: Date; to: Date }) => void
  loading?: boolean
}

export function TransactionsDonutChart({
  donutData,
  total,
  isExpense,
  range,
  onRangeChange,
  loading
}: Props) {

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        {loading  ? (
          <DateRangePickerSkeleton />
        ) : (
          <DateRangePicker
            value={range}
            onChange={onRangeChange}
          />
        )}
      </div>

      <div className="relative h-[300px] sm:h-[500px] w-full">
        {loading  ? (
          <TransactionsDonutChartSkeleton />
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={
                    donutData && donutData.length > 0
                      ? donutData
                      : [{ value: 1, color: 'hsl(var(--muted))' }]
                  }
                  dataKey="value"
                  innerRadius="80%"
                  outerRadius="100%"
                  paddingAngle={donutData && donutData.length > 0 ? 3 : 0}
                  stroke="transparent"
                  isAnimationActive={true}
                  animationDuration={700}
                >
                  {donutData && donutData.length > 0 ? (
                    donutData.map((item, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={item.color}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))
                  ) : (
                    <Cell fill="hsl(var(--muted)/0.2)" />
                  )}
                </Pie>
                {donutData && donutData.length > 0 && (
                  <Tooltip
                    formatter={(v: number) => `${v.toLocaleString('ru-RU')} ₽`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      backdropFilter: 'blur(8px)'
                    }}
                    itemStyle={{
                      color: 'hsl(var(--foreground))',
                      fontWeight: 'bold'
                    }}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-base text-muted-foreground uppercase tracking-widest">
                {isExpense ? 'Расходы' : 'Доходы'}
              </p>
              <p className="text-2xl md:text-3xl lg:text-4xl font-black mt-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                {total.toLocaleString('ru-RU')} ₽
              </p>
              {/* "Данных нет" показываем только если массив реально пустой И загрузка завершена */}
              {(!donutData || donutData.length === 0) && !loading && (
                <p className="text-sm text-muted-foreground mt-1">Данных нет</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}