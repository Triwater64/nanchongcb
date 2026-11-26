import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { INDUSTRY_META, type DistrictStat } from '../../lib/types'

interface Props {
  data: DistrictStat[]
}

/** 南充各区县产业分布：企业数 + 出口增速双指标 */
export default function DistrictChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: `${d.district}·${INDUSTRY_META[d.industry]?.label.slice(0, 2)}`,
    enterprises: d.enterprises,
    exportGrowth: d.exportGrowth,
    color: INDUSTRY_META[d.industry]?.color ?? '#5A6B85',
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-18} textAnchor="end" height={52} />
        <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" unit="%" tick={{ fill: 'rgba(212,168,67,0.8)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{ background: '#0F2444', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: '#fff' }}
          formatter={(value, name) =>
            name === 'enterprises' ? [`${value} 家`, '企业数'] : [`+${value}%`, '出口增速']
          }
        />
        <Bar yAxisId="left" dataKey="enterprises" radius={[6, 6, 0, 0]} barSize={18}>
          {chartData.map((d) => (
            <Cell key={d.name} fill={d.color} fillOpacity={0.85} />
          ))}
        </Bar>
        <Bar yAxisId="right" dataKey="exportGrowth" fill="#D4A843" radius={[6, 6, 0, 0]} barSize={8} fillOpacity={0.6} />
      </BarChart>
    </ResponsiveContainer>
  )
}
