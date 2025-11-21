// src/components/dashboard/Visuals.tsx

import React from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, BarChart
} from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Bot, Users, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { AbandonedCart } from '@/types/cart';
import { TooltipProps } from 'recharts';

interface VisualsProps {
  data: AbandonedCart[];
  isLoading: boolean;
}

type CustomTooltipProps = TooltipProps<number, string>;

/**
 * A reusable card component to wrap each chart.
 */
const ChartCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; primaryTotal?: number | string; primaryLabel?: string; secondaryTotal?: number | string; secondaryLabel?: string }> = ({ title, icon: Icon, children, primaryTotal, primaryLabel, secondaryTotal, secondaryLabel }) => (
    <div className="rounded-lg bg-slate-800 p-5 shadow-sm border border-slate-700 h-full flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-blue-400 [filter:drop-shadow(0_0_3px_theme(colors.blue.500))_drop_shadow(0_0_8px_theme(colors.blue.500/0.5))]" />
                <h3 className="font-semibold tracking-tight text-gray-50">{title}</h3>
            </div>
            <div className="text-right flex-shrink-0">
                {primaryTotal !== undefined && (
                    <>
                        <p className="text-xs text-gray-400">{primaryLabel || 'Total'}</p>
                        <p className="font-bold text-lg text-gray-50">{primaryTotal}</p>
                    </>
                )}
                {secondaryTotal !== undefined && (
                    <div className="mt-1">
                        <p className="text-xs text-gray-400">{secondaryLabel || 'Avg. Rate'}</p>
                        <p className="font-bold text-sm text-green-400">{secondaryTotal}</p>
                    </div>
                )}
            </div>
        </div>
        <div className="flex-grow">
            {children}
        </div>
    </div>
);


/**
 * A custom tooltip for charts.
 */
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md bg-slate-900/80 p-3 shadow-lg border border-slate-700 backdrop-blur-sm">
        <p className="text-sm font-semibold text-gray-50">{label}</p>
        {payload.map((p, index) => {
          // Add '%' suffix for the 'rate' data key
          const value = p.dataKey === 'rate' ? `${p.value}%` : (p.value as number).toLocaleString();
          return (
            <p key={index} style={{ color: p.color }} className="text-xs">
              {`${p.name}: ${value}`}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};


export const Visuals: React.FC<VisualsProps> = ({ data, isLoading }) => {
  const {
    revenueTimeline,
    interestTimeline,
    smsTimeline,
    aiHandledTimeline,
    manualPurchaseTimeline, // New timeline data
    totalRevenue,
    overallInterestPurchaseRate,
    overallSmsPurchaseRate,
    totalInterested,
    totalInterestedPurchased,
    totalSms,
    totalSmsPurchased,
    totalAi,
    totalNotAi,
    totalManualPurchases // New total
  } = React.useMemo(() => {
    if (!data || data.length === 0) {
      return { revenueTimeline: [], interestTimeline: [], smsTimeline: [], aiHandledTimeline: [], manualPurchaseTimeline: [], totalRevenue: 0, overallInterestPurchaseRate: 0, totalInterestedPurchased: 0, overallSmsPurchaseRate: 0, totalSmsPurchased: 0, totalInterested: 0, totalSms: 0, totalAi: 0, totalNotAi: 0, totalManualPurchases: 0 };
    }

    const dailyData = data.reduce((acc, cart) => {
        try {
            const dateKey = format(parseISO(cart.created_at), 'yyyy-MM-dd');
            if (!acc[dateKey]) {
                acc[dateKey] = { revenue: 0, interested_total: 0, interested_purchased: 0, sms_total: 0, sms_purchased: 0, ai_total: 0, non_ai_total: 0, manual_purchased: 0 };
            }
            if (cart.bought_from_automation) {
                acc[dateKey].revenue += (cart.original_price || 0) * 0.9;
                if (!cart.answered_by_ai) {
                    acc[dateKey].manual_purchased++;
                }
            }
            if (cart.interested) {
                acc[dateKey].interested_total++;
                if (cart.bought_from_automation) acc[dateKey].interested_purchased++;
            }
            if (cart.agreed_to_get_sms) {
                acc[dateKey].sms_total++;
                if (cart.bought_from_automation) acc[dateKey].sms_purchased++;
            }
            if (cart.answered_by_ai) {
                acc[dateKey].ai_total++;
            } else {
                acc[dateKey].non_ai_total++;
            }
        } catch (error) { console.error("Invalid date format:", cart.created_at); }
        return acc;
    }, {} as Record<string, any>);

    const sortedDates = Object.keys(dailyData).sort();

    const createTimeline = (totalKey: string, purchasedKey: string) => sortedDates.map(date => {
        const total = dailyData[date][totalKey];
        const purchased = dailyData[date][purchasedKey];
        return {
            date: format(parseISO(date), 'MMM dd'),
            total: total,
            rate: total > 0 ? parseFloat(((purchased / total) * 100).toFixed(1)) : 0,
        };
    });
    
    const revenueTimeline = sortedDates.map(date => ({ date: format(parseISO(date), 'MMM dd'), Revenue: parseFloat(dailyData[date].revenue.toFixed(2)) }));
    const interestTimeline = createTimeline('interested_total', 'interested_purchased');
    const smsTimeline = createTimeline('sms_total', 'sms_purchased');
    const aiHandledTimeline = sortedDates.map(date => ({
        date: format(parseISO(date), 'MMM dd'),
        'AI Handled': dailyData[date].ai_total,
        'Not AI Handled': dailyData[date].non_ai_total,
    }));
    const manualPurchaseTimeline = sortedDates.map(date => ({
        date: format(parseISO(date), 'MMM dd'),
        'Answered and purchased': dailyData[date].manual_purchased,
    }));

    const totalInterested = data.filter(c => c.interested).length;
    const totalInterestedPurchased = data.filter(c => c.interested && c.bought_from_automation).length;
    const totalSms = data.filter(c => c.agreed_to_get_sms).length;
    const totalSmsPurchased = data.filter(c => c.agreed_to_get_sms && c.bought_from_automation).length;
    const totalAi = data.filter(c => c.answered_by_ai).length;
    const totalNotAi = data.length - totalAi;
    const totalManualPurchases = data.filter(c => c.bought_from_automation && !c.answered_by_ai).length;
    
    return {
        revenueTimeline,
        interestTimeline,
        smsTimeline,
        aiHandledTimeline,
        manualPurchaseTimeline,
        totalRevenue: data.filter(c => c.bought_from_automation).reduce((sum, c) => sum + (c.original_price || 0) * 0.9, 0),
        overallInterestPurchaseRate: totalInterested > 0 ? parseFloat(((totalInterestedPurchased / totalInterested) * 100).toFixed(1)) : 0,
        overallSmsPurchaseRate: totalSms > 0 ? parseFloat(((totalSmsPurchased / totalSms) * 100).toFixed(1)) : 0,
        totalInterested,
        totalInterestedPurchased,
        totalSms,
        totalSmsPurchased,
        totalAi,
        totalNotAi,
        totalManualPurchases
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2"><Skeleton className="h-80 w-full bg-slate-800" /></div>
        <Skeleton className="h-80 bg-slate-800" />
        <Skeleton className="h-80 bg-slate-800" />
        <Skeleton className="h-80 bg-slate-800" />
        <Skeleton className="h-80 bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="lg:col-span-2">
        <ChartCard
          title="Automation Revenue Over Time"
          icon={DollarSign}
          primaryTotal={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          primaryLabel="Total Revenue"
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueTimeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize="12px" />
              <YAxis stroke="#94a3b8" fontSize="12px" unit="$" />
              <Tooltip content={CustomTooltip} />
              <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard
        title="Interested Customers: Daily Volume vs. Purchase Rate"
        icon={Users}
        primaryTotal={totalInterested}
        primaryLabel="Total Interested Carts"
        secondaryTotal={`${totalInterestedPurchased} (${overallInterestPurchaseRate}%)`}
        secondaryLabel="Purchased (Overall Rate)"
      >
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={interestTimeline} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize="12px" />
            <YAxis yAxisId="left" stroke="#94a3b8" fontSize="12px" />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize="12px" unit="%" />
            <Tooltip content={CustomTooltip} />
            <Legend wrapperStyle={{fontSize: "12px"}}/>
            <Bar yAxisId="left" dataKey="total" name="Daily Carts" fill="#3b82f6" opacity={0.6} />
            <Line yAxisId="right" dataKey="rate" name="Purchase Rate" stroke="#10b981" strokeWidth={2} dot={{r: 3}} activeDot={{r: 6}} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="SMS Campaigns: Daily Volume vs. Purchase Rate"
        icon={MessageSquare}
        primaryTotal={totalSms}
        primaryLabel="Total SMS Carts"
        secondaryTotal={`${totalSmsPurchased} (${overallSmsPurchaseRate}%)`}
        secondaryLabel="Purchased (Overall Rate)"
      >
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={smsTimeline} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize="12px" />
            <YAxis yAxisId="left" stroke="#94a3b8" fontSize="12px" />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize="12px" unit="%" />
            <Tooltip content={CustomTooltip} />
            <Legend wrapperStyle={{fontSize: "12px"}}/>
            <Bar yAxisId="left" dataKey="total" name="Daily Carts" fill="#3b82f6" opacity={0.6} />
            <Line yAxisId="right" dataKey="rate" name="Purchase Rate" stroke="#10b981" strokeWidth={2} dot={{r: 3}} activeDot={{r: 6}} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="AI-Handled vs. Non-AI Handled Carts"
        icon={Bot}
        primaryTotal={totalAi}
        primaryLabel="Total AI-Handled Carts"
        secondaryTotal={totalNotAi}
        secondaryLabel="Total Non-AI Carts"
      >
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aiHandledTimeline} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize="12px" />
                <YAxis stroke="#94a3b8" fontSize="12px" />
                <Tooltip content={CustomTooltip} />
                <Legend wrapperStyle={{fontSize: "12px"}}/>
                <Bar dataKey="AI Handled" fill="#3b82f6" opacity={0.8} />
                <Bar dataKey="Not AI Handled" fill="#8b5cf6" opacity={0.6} />
            </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      
      {/* ✅ NEW CHART ADDED HERE */}
      <ChartCard
        title="Human Handled Purchases"
        icon={Users}
        primaryTotal={totalManualPurchases}
        primaryLabel="Total Manual Purchases"
      >
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={manualPurchaseTimeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize="12px" />
                <YAxis stroke="#94a3b8" fontSize="12px" />
                <Tooltip content={CustomTooltip} />
                <Area type="monotone" dataKey="Answered and purchased" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
            </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};