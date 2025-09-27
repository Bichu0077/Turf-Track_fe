import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/analytics";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, description, trend, icon, className }: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (trend.value < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-gray-600" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.isPositive === false) return trend.value > 0 ? 'text-red-600' : 'text-green-600';
    return trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-600' : 'text-gray-600';
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof value === 'number' ? formatCurrency(value) : value}</div>
        <div className="flex items-center space-x-2">
          {trend && (
            <>
              {getTrendIcon()}
              <span className={`text-xs ${getTrendColor()}`}>
                {Math.abs(trend.value).toFixed(1)}%
              </span>
            </>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricBarProps {
  label: string;
  value: number;
  maxValue: number;
  format?: 'currency' | 'number' | 'percentage';
  color?: string;
}

export function MetricBar({ label, value, maxValue, format = 'number', color = 'bg-primary' }: MetricBarProps) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{formatValue(value)}</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div 
          className={`${color} h-2 rounded-full transition-all duration-300 ease-in-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

interface InsightCardProps {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function InsightCard({ type, title, description, icon, action }: InsightCardProps) {
  const getCardStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextStyles = () => {
    switch (type) {
      case 'success':
        return { title: 'text-green-800', description: 'text-green-700', icon: 'text-green-600' };
      case 'warning':
        return { title: 'text-yellow-800', description: 'text-yellow-700', icon: 'text-yellow-600' };
      case 'info':
        return { title: 'text-blue-800', description: 'text-blue-700', icon: 'text-blue-600' };
      case 'error':
        return { title: 'text-red-800', description: 'text-red-700', icon: 'text-red-600' };
      default:
        return { title: 'text-gray-800', description: 'text-gray-700', icon: 'text-gray-600' };
    }
  };

  const styles = getTextStyles();

  return (
    <div className={`p-4 border rounded-lg ${getCardStyles()}`}>
      <div className="flex items-start space-x-3">
        {icon && <div className={`${styles.icon} mt-0.5`}>{icon}</div>}
        <div className="flex-1">
          <h4 className={`text-sm font-semibold ${styles.title}`}>{title}</h4>
          <p className={`text-sm ${styles.description} mt-1`}>{description}</p>
          {action && (
            <button 
              onClick={action.onClick}
              className={`text-xs underline mt-2 ${styles.icon} hover:opacity-80`}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface KPIGridProps {
  kpis: Array<{
    label: string;
    value: string | number;
    change?: {
      value: number;
      isPositive?: boolean;
    };
  }>;
}

export function KPIGrid({ kpis }: KPIGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {kpis.map((kpi, index) => (
        <div key={index} className="text-center space-y-1">
          <div className="text-2xl font-bold">
            {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
          </div>
          <div className="text-xs text-muted-foreground">{kpi.label}</div>
          {kpi.change && (
            <div className={`text-xs flex items-center justify-center space-x-1 ${
              kpi.change.isPositive !== false 
                ? kpi.change.value > 0 ? 'text-green-600' : kpi.change.value < 0 ? 'text-red-600' : 'text-gray-600'
                : kpi.change.value > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {kpi.change.value > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : kpi.change.value < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              <span>{Math.abs(kpi.change.value).toFixed(1)}%</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}