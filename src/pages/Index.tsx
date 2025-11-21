import { useEffect, useState } from "react";
import { AbandonedCart } from "@/types/cart";
import { DataTable } from "@/components/dashboard/DataTable";
import { DetailModal } from "@/components/dashboard/DetailModal";
import { useToast } from "@/hooks/use-toast";
import { Visuals } from "@/components/dashboard/Visuals";
import {
  ShoppingCart, Phone, Users, DollarSign,
  MessageSquare, Calendar as CalendarIcon,
  LayoutDashboard, Table, AreaChart,
  CheckCircle, HelpCircle // ✅ ADDED: HelpCircle icon for tooltips
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import logo from '@/assets/logo.avif';
// ✅ ADDED: Tooltip components for explanations
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


// ✅ MODIFIED: Stats Card now includes a tooltip for metric explanations
const ElegantStatsCard = ({ title, value, icon: Icon, description, tooltipContent }) => (
  <div className="rounded-lg bg-slate-800 p-5 shadow-sm border-t-4 border-blue-500 transition-transform duration-300 hover:-translate-y-1">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-4 w-4 text-gray-500 cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-gray-300 border-slate-700 max-w-xs">
            <p className="text-sm">{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Icon
        className="h-6 w-6 text-blue-400 animate-pulse [filter:drop-shadow(0_0_3px_theme(colors.blue.500))_drop-shadow(0_0_8px_theme(colors.blue.500/0.5))]"
      />
    </div>
    <p className="mt-2 text-3xl font-bold text-gray-50">{value}</p>
    <p className="mt-1 text-xs text-gray-500">{description}</p>
  </div>
);


const Index = () => {
  const [data, setData] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month" | "all" | "custom">("today");
  const [currentView, setCurrentView] = useState<'dashboard' | 'table' | 'visuals'>('dashboard');
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [timeFilter, date]);

  // Data fetching logic remains the same
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-mongodb-data`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch data");
      const result: AbandonedCart[] = await response.json();
      const filteredData = Array.from(
        result.reduce((map, item) => {
          const existing = map.get(item.call_id);
          if (!existing || (!existing.bought_from_automation && item.bought_from_automation)) {
            map.set(item.call_id, item);
          }
          return map;
        }, new Map()).values()
      );
      setData(filteredData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (cart: AbandonedCart) => {
    setSelectedCart(cart);
    setDetailModalOpen(true);
  };

  const filterDataByTime = (data: AbandonedCart[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return data.filter((item) => {
      const itemDate = new Date(item.created_at);
      switch (timeFilter) {
        case "today": return itemDate >= today;
        case "week": return itemDate >= weekAgo;
        case "month": return itemDate >= monthAgo;
        case "custom":
          if (date?.from && date?.to) {
            // Adjust to include the full end day
            const endDate = new Date(date.to);
            endDate.setHours(23, 59, 59, 999);
            return itemDate >= date.from && itemDate <= endDate;
          }
          return true;
        default: return true;
      }
    });
  };

  const filteredData = filterDataByTime(data);

  // Calculate stats for cards
  const totalCalls = filteredData.length;
  const successfulCalls = filteredData.filter((c) => c.call_successful).length;
  const interestedCustomers = filteredData.filter((c) => c.interested).length;
  const agreedToSMS = filteredData.filter((c) => c.agreed_to_get_sms).length;
  const customerAnsweredBought = filteredData.filter((c) => !c.answered_by_ai && c.bought_from_automation).length;
  const automationRevenue = filteredData
    .filter((c) => c.bought_from_automation)
    .reduce((sum, c) => sum + ((c.original_price || 0) * 0.9), 0);
  
  // ✅ ADDED: Centralized data for stats cards, including tooltip content
  const statsCardsData = [
    {
      title: "Total Carts",
      value: totalCalls,
      icon: ShoppingCart,
      description: "Total abandoned carts tracked",
      tooltipContent: "Shows the total number of abandoned carts in the system that were called within the selected date range (e.g., today, this week)."
    },
    {
      title: "Successful Calls",
      value: `${successfulCalls} / ${totalCalls}`,
      icon: Phone,
      description: "Calls that were connected",
      tooltipContent: "Shows how many calls were successfully connected with customers. Calculated by counting carts where 'successful_call' is marked as true."
    },
    {
      title: "Automation Revenue",
      value: `$${automationRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "Revenue from automated recoveries",
      tooltipContent: "Shows the total money earned from automated purchases. Calculated by summing 90% of the price for all carts bought through automation to account for the 10% discount."
    },
    {
      title: "Interested Customers",
      value: `${interestedCustomers} / ${totalCalls}`,
      icon: Users,
      description: "Customers who showed interest",
      tooltipContent: "Shows how many customers were marked as 'interested'. This is determined by an AI that analyzes the call to decide if the user was interested in the purchase."
    },
    {
      title: "Agreed to SMS",
      value: `${agreedToSMS} / ${totalCalls}`,
      icon: MessageSquare,
      description: "Customers who opted-in for SMS",
      tooltipContent: "Shows how many customers agreed to receive SMS. This is determined by an AI that analyzes the call transcript for consent."
    },
    {
      title: "Answered & Purchased",
      value: `${customerAnsweredBought} / ${totalCalls}`,
      icon: CheckCircle,
      description: "Customers who answered and bought",
      tooltipContent: "Shows how many customers answered the call themselves (not the AI) and proceeded to make a purchase."
    }
  ];

  return (
    <div className="dark min-h-screen bg-slate-900 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <img src={logo} alt="Sluggers Logo" className="w-48 sm:w-64 h-auto" />
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-50">
              Abandoned Cart Dashboard
            </h1>
            <p className="mt-2 text-gray-400">
              Monitor and analyze your abandoned cart recovery performance.
            </p>
          </div>
        </div>

        {/* Controls Wrapper */}
        <div className="flex flex-wrap justify-between items-center gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as typeof currentView)}>
            <TabsList className="bg-slate-800 border border-slate-700">
              <TabsTrigger value="dashboard" className="text-gray-400 data-[state=active]:text-blue-400 data-[state=active]:bg-slate-700/50">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="table" className="text-gray-400 data-[state=active]:text-blue-400 data-[state=active]:bg-slate-700/50">
                <Table className="w-4 h-4 mr-2" />
                Carts
              </TabsTrigger>
              <TabsTrigger value="visuals" className="text-gray-400 data-[state=active]:text-blue-400 data-[state=active]:bg-slate-700/50">
                <AreaChart className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap justify-start items-center gap-4">
            <Tabs value={timeFilter} onValueChange={(v) => { setTimeFilter(v as typeof timeFilter); }}>
              <TabsList className="bg-slate-800 border border-slate-700 h-auto flex-wrap">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
            </Tabs>
            {timeFilter === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className="w-full sm:w-[300px] justify-start text-left font-normal bg-slate-800 border-slate-700 hover:bg-slate-700"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {currentView === 'dashboard' && (
          // ✅ WRAPPED: a provider is needed for tooltips to work
          <TooltipProvider>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[125px] bg-slate-800" />)
                ) : (
                  // ✅ MAPPED: Cards are now generated from the data array
                  statsCardsData.map((card, index) => (
                    <ElegantStatsCard
                      key={index}
                      title={card.title}
                      value={card.value}
                      icon={card.icon}
                      description={card.description}
                      tooltipContent={card.tooltipContent}
                    />
                  ))
                )}
              </div>
            </div>
          </TooltipProvider>
        )}

        {currentView === 'table' && (
          <div className="rounded-lg bg-slate-800 p-2 sm:p-4 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-gray-50">All Carts</h2>
            <DataTable
              data={filteredData}
              onViewDetails={handleViewDetails}
              isLoading={loading}
            />
          </div>
        )}

        {/* The Visuals tab now solely holds all charts and graphs */}
        {currentView === 'visuals' && <Visuals data={filteredData} isLoading={loading} />}

        <DetailModal cart={selectedCart} open={detailModalOpen} onOpenChange={setDetailModalOpen} />
      </div>
    </div>
  );
};

export default Index;
