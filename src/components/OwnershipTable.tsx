import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Users, TrendingDown, Calculator } from "lucide-react";
import type { Company, SafeInvestment, PricingRoundData } from "@/pages/Index";

interface OwnershipTableProps {
  company: Company;
  safeRounds: SafeInvestment[];
  pricingRounds: PricingRoundData[];
}

interface OwnershipBreakdown {
  stakeholder: string;
  shares: number;
  ownership: number;
  investment: number;
  type: 'founder' | 'safe' | 'investor';
}

const COLORS = {
  founder: 'hsl(var(--financial-success))',
  safe: 'hsl(var(--financial-warning))',
  investor: 'hsl(var(--financial-info))',
  other: 'hsl(var(--muted-foreground))',
};

export const OwnershipTable: React.FC<OwnershipTableProps> = ({ 
  company, 
  safeRounds, 
  pricingRounds 
}) => {
  const ownershipData = useMemo(() => {
    let totalShares = company.totalShares;
    let currentValuation = company.initialValuation;
    const stakeholders: OwnershipBreakdown[] = [];

    // Start with founder shares
    stakeholders.push({
      stakeholder: 'Founders',
      shares: company.foundersShares,
      ownership: 0, // Will be calculated later
      investment: 0,
      type: 'founder'
    });

    // Process each pricing round
    pricingRounds.forEach((round) => {
      // Calculate SAFE conversions for this round
      let safeShares = 0;
      const roundSafeInvestment = safeRounds.reduce((sum, safe) => sum + safe.amount, 0);

      safeRounds.forEach((safe) => {
        if (!safe.converted) return; // Only convert when pricing round happens
        
        const discountPrice = round.preMoneyValuation * (1 - safe.discount / 100);
        const capPrice = safe.valuationCap || Infinity;
        const conversionPrice = Math.min(discountPrice, capPrice);
        
        const sharePrice = conversionPrice / totalShares;
        const convertedShares = safe.amount / sharePrice;
        safeShares += convertedShares;

        // Add individual SAFE investor if not already added
        const existingSafe = stakeholders.find(s => s.stakeholder === safe.investorName);
        if (!existingSafe) {
          stakeholders.push({
            stakeholder: safe.investorName,
            shares: convertedShares,
            ownership: 0,
            investment: safe.amount,
            type: 'safe'
          });
        }
      });

      // Calculate new shares for pricing round
      const effectivePreMoney = round.preMoneyValuation - roundSafeInvestment;
      const pricePerShare = effectivePreMoney / totalShares;
      const newShares = round.investment / pricePerShare;

      // Add pricing round investors
      round.newInvestors.forEach((investor) => {
        const investorShares = investor.investment / pricePerShare;
        stakeholders.push({
          stakeholder: investor.name,
          shares: investorShares,
          ownership: 0,
          investment: investor.investment,
          type: 'investor'
        });
      });

      // Update totals
      totalShares += safeShares + newShares;
      currentValuation = round.preMoneyValuation + round.investment;
    });

    // Calculate ownership percentages
    stakeholders.forEach(stakeholder => {
      stakeholder.ownership = (stakeholder.shares / totalShares) * 100;
    });

    // Group data for charts
    const chartData = stakeholders.reduce((acc, stakeholder) => {
      const existing = acc.find(item => item.type === stakeholder.type);
      if (existing) {
        existing.value += stakeholder.ownership;
        existing.shares += stakeholder.shares;
        existing.investment += stakeholder.investment;
      } else {
        acc.push({
          name: stakeholder.type === 'founder' ? 'Founders' : 
                stakeholder.type === 'safe' ? 'SAFE Investors' : 'Equity Investors',
          value: stakeholder.ownership,
          shares: stakeholder.shares,
          investment: stakeholder.investment,
          type: stakeholder.type,
          fill: COLORS[stakeholder.type]
        });
      }
      return acc;
    }, [] as any[]);

    // Dilution tracking data
    const dilutionData = [
      { round: 'Initial', founderOwnership: (company.foundersShares / company.totalShares) * 100 }
    ];

    let runningShares = company.totalShares;
    pricingRounds.forEach((round, index) => {
      const safeShares = safeRounds.reduce((sum, safe) => {
        const discountPrice = round.preMoneyValuation * (1 - safe.discount / 100);
        const capPrice = safe.valuationCap || Infinity;
        const conversionPrice = Math.min(discountPrice, capPrice);
        const sharePrice = conversionPrice / runningShares;
        return sum + (safe.amount / sharePrice);
      }, 0);

      const effectivePreMoney = round.preMoneyValuation - safeRounds.reduce((sum, safe) => sum + safe.amount, 0);
      const pricePerShare = effectivePreMoney / runningShares;
      const newShares = round.investment / pricePerShare;
      
      runningShares += safeShares + newShares;
      
      dilutionData.push({
        round: round.name,
        founderOwnership: (company.foundersShares / runningShares) * 100
      });
    });

    return {
      stakeholders: stakeholders.sort((a, b) => b.ownership - a.ownership),
      chartData,
      dilutionData,
      totalShares,
      currentValuation,
      totalInvestment: safeRounds.reduce((sum, safe) => sum + safe.amount, 0) + 
                      pricingRounds.reduce((sum, round) => sum + round.investment, 0)
    };
  }, [company, safeRounds, pricingRounds]);

  if (pricingRounds.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-card to-secondary/10 border border-primary/20">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Calculator className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-medium">No Pricing Rounds Yet</h3>
            <p className="text-muted-foreground">
              Add a pricing round to see ownership calculations and dilution analysis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-secondary/10 border border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Valuation</p>
                <p className="text-2xl font-bold text-primary">${ownershipData.currentValuation.toLocaleString()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-card to-secondary/10 border border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Shares Outstanding</p>
                <p className="text-2xl font-bold text-financial-info">{Math.round(ownershipData.totalShares).toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-financial-info" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-card to-secondary/10 border border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Investment</p>
                <p className="text-2xl font-bold text-financial-success">${ownershipData.totalInvestment.toLocaleString()}</p>
              </div>
              <Calculator className="h-8 w-8 text-financial-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-card to-secondary/10 border border-primary/20">
          <CardHeader>
            <CardTitle>Ownership Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ownershipData.chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                >
                  {ownershipData.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Ownership']}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-secondary/10 border border-primary/20">
          <CardHeader>
            <CardTitle>Founder Dilution Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ownershipData.dilutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="round" />
                <YAxis label={{ value: 'Ownership %', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Founder Ownership']} />
                <Bar dataKey="founderOwnership" fill={COLORS.founder} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Ownership Table */}
      <Card className="bg-gradient-to-br from-card to-secondary/10 border border-primary/20">
        <CardHeader>
          <CardTitle>Detailed Ownership Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stakeholder</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Ownership %</TableHead>
                <TableHead className="text-right">Investment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ownershipData.stakeholders.map((stakeholder, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{stakeholder.stakeholder}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={`
                        ${stakeholder.type === 'founder' ? 'bg-financial-success/10 text-financial-success border-financial-success/20' : ''}
                        ${stakeholder.type === 'safe' ? 'bg-financial-warning/10 text-financial-warning border-financial-warning/20' : ''}
                        ${stakeholder.type === 'investor' ? 'bg-financial-info/10 text-financial-info border-financial-info/20' : ''}
                      `}
                    >
                      {stakeholder.type === 'founder' ? 'Founder' : 
                       stakeholder.type === 'safe' ? 'SAFE' : 'Equity'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Math.round(stakeholder.shares).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {stakeholder.ownership.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${stakeholder.investment.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};