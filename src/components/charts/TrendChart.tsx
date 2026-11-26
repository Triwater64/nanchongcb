import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { INDUSTRY_META, type HotKeyword } from '../../lib/types'

interface Props {
  data: HotKeyword[]
}

/** 海外热搜词柱状图（按搜索量 Top8，颜色按产业区分） */
export default function TrendChart({ data }: Props) {
  const chartData = [...data]
    .sort((a, b) => b.searches - a.searches)
    .slice(0, 8)
    .map((k) => ({
      name: k.keyword.length > 18 ? `${k.keyword.slice(0, 18)}…` : k.keyword,
      searches: k.searches,
      momGrowth: k.momGrowth,
      color: INDUSTRY_META[k.industry]?.color ?? '#5A6B85',
    }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 36, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          dataKey="name"
          type="category"
          width={150}
          tick={{ fill: 'rgba(255,255,255,0.75)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{ background: '#0F2444', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: '#fff' }}
          formatter={(value, name) =>
            name === 'searches' ? [`${Number(value).toLocaleString()} 次/月`, '搜索量'] : [`+${value}%`, '环比增长']
          }
        />
        <Bar dataKey="searches" radius={[0, 6, 6, 0]} barSize={16}>
          {chartData.map((d) => (
            <Cell key={d.name} fill={d.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
