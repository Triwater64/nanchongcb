import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface LogisticsOption {
  mode: string
  route: string
  transitDays: string
  costPerCbmUSD: number
  costPer40HqUSD: number
  note: string
}

interface Props {
  data: LogisticsOption[]
}

/** 跨境物流成本对比：整柜（40HQ）美元成本，班列 vs 海运一目了然 */
export default function LogisticsChart({ data }: Props) {
  const chartData = data
    .filter((l) => l.costPer40HqUSD > 0)
    .map((l) => ({
      name: l.route.split('→')[1]?.trim().slice(0, 14) ?? l.mode,
      fullRoute: `${l.mode}：${l.route}`,
      cost: l.costPer40HqUSD,
      days: l.transitDays,
      rail: l.mode.includes('中欧班列'),
    }))

  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={chartData} margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
        <YAxis unit="$" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{ background: '#0F2444', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: '#fff' }}
          formatter={(value, _name, item) => [
            `$${Number(value).toLocaleString()} /40HQ · 时效 ${(item as { payload?: { days?: string } }).payload?.days ?? ''}`,
            '整柜成本',
          ]}
          labelFormatter={(_label, payload) => (payload?.[0] as { payload?: { fullRoute?: string } })?.payload?.fullRoute ?? ''}
        />
        <Bar dataKey="cost" radius={[6, 6, 0, 0]} barSize={42}>
          {chartData.map((d) => (
            <Cell key={d.fullRoute} fill={d.rail ? '#D4A843' : '#1266E8'} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
