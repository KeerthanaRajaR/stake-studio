import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Target, DollarSign, TrendingUp, Calculator } from "lucide-react";
import type { Company, SafeInvestment, PricingRoundData } from "@/pages/Index";

interface ExitScenarioProps {
  company: Company;
  safeRounds: SafeInvestment[];
  pricingRounds: PricingRoundData[];
}

interface ExitCalculation {
  exitValuation: number;
  founderPayout: number;
  founderROI: number;
  investorPayouts: Array<{
    name: string;
    investment: number;
    payout: number;
    roi: number;
    multiple: number;
  }>;
  totalPayouts: number;
}

export const ExitScenario: React.FC<ExitScenarioProps> = ({ 
  company, 
  safeRounds, 
  pricingRounds 
}) => {
  const [exitValuations, setExitValuations] = useState([10000000, 50000000, 100000000, 500000000]);
  const [customValuation, setCustomValuation] = useState("");

  const ownershipStructure = useMemo(() => {
    if (pricingRounds.length === 0) return null;

    let totalShares = company.totalShares;
    const stakeholders: Array<{
      name: string;
      shares: number;
      investment: number;
      type: 'founder' | 'safe' | 'investor';
    }> = [];

    // Add founders
    stakeholders.push({
      name: 'Founders',
      shares: company.foundersShares,
      investment: 0,
      type: 'founder'
    });

    // Process pricing rounds and SAFE conversions
    pricingRounds.forEach((round) => {
      // Convert SAFE investments
      safeRounds.forEach((safe) => {
        const discountPrice = round.preMoneyValuation * (1 - safe.discount / 100);
        const capPrice = safe.valuationCap || Infinity;
        const conversionPrice = Math.min(discountPrice, capPrice);
        
        const sharePrice = conversionPrice / totalShares;
        const convertedShares = safe.amount / sharePrice;

        stakeholders.push({
          name: safe.investorName,
          shares: convertedShares,
          investment: safe.amount,
          type: 'safe'
        });
      });

      // Add equity investors
      const roundSafeInvestment = safeRounds.reduce((sum, safe) => sum + safe.amount, 0);
      const effectivePreMoney = round.preMoneyValuation - roundSafeInvestment;
      const pricePerShare = effectivePreMoney / totalShares;
      
      round.newInvestors.forEach((investor) => {
        const investorShares = investor.investment / pricePerShare;
        stakeholders.push({
          name: investor.name,
          shares: investorShares,
          investment: investor.investment,
          type: 'investor'
        });
      });

      // Update total shares
      const safeShares = safeRounds.reduce((sum, safe) => {
        const discountPrice = round.preMoneyValuation * (1 - safe.discount / 100);
        const capPrice = safe.valuationCap || Infinity;
        const conversionPrice = Math.min(discountPrice, capPrice);
        const sharePrice = conversionPrice / totalShares;
        return sum + (safe.amount / sharePrice);
      }, 0);
      
      const newShares = round.investment / pricePerShare;
      totalShares += safeShares + newShares;
    });

    return { stakeholders, totalShares };
  }, [company, safeRounds, pricingRounds]);

  const exitCalculations = useMemo(() => {
    if (!ownershipStructure) return [];

    return exitValuations.map(exitVal => {
      const pricePerShare = exitVal / ownershipStructure.totalShares;
      
      const founderStakeholder = ownershipStructure.stakeholders.find(s => s.name === 'Founders');
      const founderPayout = founderStakeholder ? founderStakeholder.shares * pricePerShare : 0;
      
      const investorPayouts = ownershipStructure.stakeholders
        .filter(s => s.type !== 'founder')
        .map(stakeholder => {
          const payout = stakeholder.shares * pricePerShare;
          const roi = stakeholder.investment > 0 ? ((payout - stakeholder.investment) / stakeholder.investment) * 100 : 0;
          const multiple = stakeholder.investment > 0 ? payout / stakeholder.investment : 0;
          
          return {
            name: stakeholder.name,
            investment: stakeholder.investment,
            payout,
            roi,
            multiple
          };
        });

      const totalPayouts = founderPayout + investorPayouts.reduce((sum, inv) => sum + inv.payout, 0);

      return {
        exitValuation: exitVal,
        founderPayout,
        founderROI: 0, // Founders don't have initial investment in this context
        investorPayouts,
        totalPayouts
      };
    });
  }, [exitValuations, ownershipStructure]);

  const addCustomValuation = () => {
    if (customValuation && !exitValuations.includes(parseFloat(customValuation))) {
      setExitValuations(prev => [...prev, parseFloat(customValuation)].sort((a, b) => a - b));
      setCustomValuation("");
    }
  };

  const removeValuation = (valuation: number) => {
    setExitValuations(prev => prev.filter(v => v !== valuation));
  };

  if (!ownershipStructure) {
    return (
      <Card className="bg-gradient-to-br from-card to-secondary/10 border border-primary/20">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Target className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-medium">No Exit Scenarios Available</h3>
            <p className="text-muted-foreground">
              Complete at least one pricing round to model exit scenarios
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = exitCalculations.map(calc => ({
    exitValuation: `$${(calc.exitValuation / 1000000).toFixed(0)}M`,
    founderPayout: calc.founderPayout / 1000000,
    totalInvestorPayout: calc.investorPayouts.reduce((sum, inv) => sum + inv.payout, 0) / 1000000,
  }));

  return (
    <div className="space-y-6">
      {/* Exit Valuation Controls */}
      <Card className="bg-gradient-to-br from-secondary/20 to-secondary/5 border border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Exit Scenario Modeling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="customValuation">Add Custom Exit Valuation ($)</Label>
                <Input
                  id="customValuation"
                  type="number"
                  value={customValuation}
                  onChange={(e) => setCustomValuation(e.target.value)}
                  placeholder="25000000"
                  className="bg-background/70 border-primary/30 focus:border-primary"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={addCustomValuation}
                  disabled={!customValuation}
                  className="bg-primary hover:bg-primary/90"
                >
                  Add Scenario
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {exitValuations.map((valuation) => (
                <Badge 
                  key={valuation}
                  variant="secondary" 
                  className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20"
                  onClick={() => removeValuation(valuation)}
                >
                  ${(valuation / 1000000).toFixed(0)}M ×
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Chart */}
      <Card className="bg-gradient-to-br from-card to-secondary/10 border border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-financial-success" />
            Exit Payout Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="exitValuation" />
              <YAxis label={{ value: 'Payout ($M)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(1)}M`, 'Payout']}
              />
              <Bar dataKey="founderPayout" fill="hsl(var(--financial-success))" name="Founder Payout" />
              <Bar dataKey="totalInvestorPayout" fill="hsl(var(--financial-info))" name="Investor Payout" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Exit Scenarios */}
      {exitCalculations.map((calculation, index) => (
        <Card key={index} className="bg-gradient-to-br from-card to-secondary/10 border border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-financial-warning" />
                Exit at ${(calculation.exitValuation / 1000000).toFixed(0)}M Valuation
              </span>
              <Badge variant="outline" className="border-primary/20 text-primary">
                ${calculation.totalPayouts.toLocaleString()} Total Payouts
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Founder Payout Summary */}
              <div className="p-4 bg-financial-success/10 rounded-lg border border-financial-success/20">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-financial-success">Founder Payout</h4>
                    <p className="text-sm text-muted-foreground">
                      {((ownershipStructure.stakeholders.find(s => s.name === 'Founders')?.shares || 0) / ownershipStructure.totalShares * 100).toFixed(1)}% ownership
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-financial-success">
                      ${(calculation.founderPayout / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ${calculation.founderPayout.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Investor Payouts */}
              <div>
                <h4 className="font-medium mb-4">Investor Returns</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investor</TableHead>
                      <TableHead className="text-right">Investment</TableHead>
                      <TableHead className="text-right">Payout</TableHead>
                      <TableHead className="text-right">Multiple</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculation.investorPayouts.map((investor, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{investor.name}</TableCell>
                        <TableCell className="text-right font-mono">
                          ${investor.investment.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${investor.payout.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {investor.multiple.toFixed(1)}x
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant="secondary" 
                            className={`
                              ${investor.roi > 0 ? 'bg-financial-success/10 text-financial-success border-financial-success/20' : 
                                'bg-financial-danger/10 text-financial-danger border-financial-danger/20'}
                            `}
                          >
                            {investor.roi > 0 ? '+' : ''}{investor.roi.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};