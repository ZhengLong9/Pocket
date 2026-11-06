import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { daysInMonth, monthLabel } from '../lib/dates'
import { formatMoney, shortMoney } from '../lib/money'
import { spendingSeries } from '../lib/finance'
import type { FinanceState } from '../lib/model'

export function SpendingChart({
  data,
  month,
  today,
  budget,
}: {
  data: FinanceState
  month: string
  today: string
  budget: number
}) {
  const series = spendingSeries(data, month, today)
  const current = month === today.slice(0, 7)
  return (
    <section
      className="spending-chart"
      aria-label={`Cumulative spending for ${monthLabel(month)} in SGD`}
    >
      <div className="section-heading">
        <h2>Spending trend</h2>
        <div className="chart-legend">
          <span>
            <i className="legend-line" />
            Recorded
          </span>
          {current && (
            <span>
              <i className="legend-line projected" />
              Projected
            </span>
          )}
          <span>
            <i className="legend-line budget" />
            Budget
          </span>
        </div>
      </div>
      <div className="chart-canvas">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={series} margin={{ top: 20, right: 12, bottom: 2, left: -18 }}>
            <XAxis
              dataKey="day"
              type="number"
              domain={[1, daysInMonth(month)]}
              ticks={[1, 8, 15, 22, daysInMonth(month)]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#67758a', fontSize: 11 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#67758a', fontSize: 11 }}
              domain={[0, (maximum: number) => Math.max(maximum, budget / 100) * 1.12]}
              tickFormatter={(value: number) =>
                value.toLocaleString('en-SG', { maximumFractionDigits: 0 })
              }
            />
            <ReferenceLine y={budget / 100} stroke="#c2cbda" strokeDasharray="4 4" label={{value: shortMoney(budget), position:'insideTopRight', fill : '#67758a', fontSize : 12}}/>
            <Tooltip
              labelFormatter={(day) => `${day} ${monthLabel(month, true)}`}
              formatter={(value) => formatMoney(Math.round(Number(value) * 100))}
              contentStyle={{
                background: '#fff',
                border: '1px solid #dfe5ee',
                borderRadius: 7,
                color: '#202b3d',
                fontSize: 12,
              }}
            />
            <Line
              name="Recorded"
              type="linear"
              dataKey="actual"
              stroke="#265cda"
              strokeWidth={2.3}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            <Line
              name="Projected"
              type="linear"
              dataKey="projected"
              stroke="#8b9bb6"
              strokeWidth={1.7}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-caption">
        <span>{monthLabel(month)}</span>
        <span>Monthly budget {shortMoney(budget)}</span>
      </div>
    </section>
  )
}
