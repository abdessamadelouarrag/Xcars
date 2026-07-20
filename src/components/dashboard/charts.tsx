"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const chartColors = ["#0f766e", "#2dd4bf", "#f4b942", "#64748b", "#ef4444"];

export function ActivityChart({
  data,
  currency,
}: {
  data: Array<{ month: string; reservations: number; revenue: number }>;
  currency: string;
}) {
  const hasData = data.some((item) => item.reservations > 0 || item.revenue > 0);
  if (!hasData) {
    return <ChartEmpty message="Les tendances apparaîtront après vos premières demandes." />;
  }

  return (
    <div className="h-72 w-full" aria-label="Réservations et revenus par mois">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} opacity={0.22} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
          <YAxis axisLine={false} tickLine={false} fontSize={12} />
          <Tooltip
            formatter={(value, name) =>
              name === "Revenus"
                ? formatCurrency(Number(value), currency, "fr-MA")
                : value
            }
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenus"
            stroke="#0f766e"
            strokeWidth={2.5}
            fill="url(#revenue)"
          />
          <Area
            type="monotone"
            dataKey="reservations"
            name="Réservations"
            stroke="#f4b942"
            strokeWidth={2}
            fill="transparent"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PopularVehiclesChart({
  data,
}: {
  data: Array<{ name: string; requests: number }>;
}) {
  if (!data.length) {
    return <ChartEmpty message="Aucune demande enregistrée pour le moment." />;
  }
  return (
    <div className="h-64 w-full" aria-label="Véhicules les plus demandés">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
          <CartesianGrid strokeDasharray="4 4" horizontal={false} opacity={0.2} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={105}
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <Tooltip />
          <Bar dataKey="requests" name="Demandes" fill="#0f766e" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VehicleStatusChart({
  data,
}: {
  data: Array<{ status: string; label: string; value: number }>;
}) {
  const visible = data.filter((item) => item.value > 0);
  if (!visible.length) {
    return <ChartEmpty message="Ajoutez un véhicule pour afficher la répartition." />;
  }
  return (
    <div className="flex h-64 items-center">
      <ResponsiveContainer width="58%" height="100%">
        <PieChart>
          <Pie
            data={visible}
            dataKey="value"
            nameKey="label"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={3}
          >
            {visible.map((entry, index) => (
              <Cell key={entry.status} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid flex-1 gap-2">
        {visible.map((item, index) => (
          <div key={item.status} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 rounded-full"
              style={{ background: chartColors[index % chartColors.length] }}
            />
            <span className="flex-1 text-muted-foreground">{item.label}</span>
            <span className="font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl bg-muted/35 px-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
