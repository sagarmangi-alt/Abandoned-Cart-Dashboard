import { LucideIcon } from "lucide-react";

// Define the shape of a single metric to be displayed in the card
interface Metric {
  label: string;
  value: string | number;
}

// Define the props for the SummaryCard component
interface SummaryCardProps {
  title: string;
  icon: LucideIcon;
  metrics: Metric[];
}

// The SummaryCard component
export const SummaryCard = ({ title, icon: Icon, metrics }: SummaryCardProps) => {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 space-y-4 h-full">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold tracking-tight text-lg">{title}</h3>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      
      {/* Card Content - List of metrics */}
      <div className="space-y-3">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">{metric.label}</p>
            <p className="font-medium">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};