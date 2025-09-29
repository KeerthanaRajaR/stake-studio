import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calculator, Users, PlusCircle } from "lucide-react";
import type { Company, SafeInvestment, PricingRoundData } from "@/pages/Index";

interface PricingRoundProps {
  onAddRound: (round: Omit<PricingRoundData, 'id'>) => void;
  company: Company;
  safeRounds: SafeInvestment[];
  existingRounds: PricingRoundData[];
}

export const PricingRound: React.FC<PricingRoundProps> = ({ 
  onAddRound, 
  company, 
  safeRounds, 
  existingRounds 
}) => {
  const [formData, setFormData] = useState({
    name: "",
    preMoneyValuation: "",
    investment: "",
    newInvestors: [{ name: "", investment: "" }],
  });

  const calculations = useMemo(() => {
    if (!formData.preMoneyValuation || !formData.investment) {
      return null;
    }

    const preMoneyVal = parseFloat(formData.preMoneyValuation);
    const totalInvestment = parseFloat(formData.investment);
    const postMoneyVal = preMoneyVal + totalInvestment;

    // Calculate SAFE conversion
    const totalSafeInvestment = safeRounds.reduce((sum, safe) => sum + safe.amount, 0);
    
    let safeShares = 0;
    let effectivePreMoney = preMoneyVal;

    if (safeRounds.length > 0) {
      // Use the lower of discount price or valuation cap
      safeRounds.forEach(safe => {
        const discountPrice = preMoneyVal * (1 - safe.discount / 100);
        const capPrice = safe.valuationCap || Infinity;
        const conversionPrice = Math.min(discountPrice, capPrice);
        
        safeShares += safe.amount / (conversionPrice / company.totalShares);
      });
      
      effectivePreMoney = preMoneyVal - totalSafeInvestment;
    }

    const preMoneyPricePerShare = effectivePreMoney / company.totalShares;
    const newShares = totalInvestment / preMoneyPricePerShare;
    const totalSharesAfter = company.totalShares + safeShares + newShares;
    const postMoneyPricePerShare = postMoneyVal / totalSharesAfter;

    return {
      preMoneyPricePerShare,
      newShares,
      safeShares,
      totalSharesAfter,
      postMoneyPricePerShare,
      postMoneyValuation: postMoneyVal,
      founderOwnership: (company.foundersShares / totalSharesAfter) * 100,
      safeOwnership: (safeShares / totalSharesAfter) * 100,
      newInvestorOwnership: (newShares / totalSharesAfter) * 100,
    };
  }, [formData.preMoneyValuation, formData.investment, company, safeRounds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validInvestors = formData.newInvestors.filter(inv => inv.name && inv.investment);
    
    const roundData = {
      name: formData.name,
      preMoneyValuation: parseFloat(formData.preMoneyValuation),
      investment: parseFloat(formData.investment),
      newInvestors: validInvestors.map(inv => ({
        name: inv.name,
        investment: parseFloat(inv.investment),
      })),
    };

    onAddRound(roundData);
    
    // Reset form
    setFormData({
      name: "",
      preMoneyValuation: "",
      investment: "",
      newInvestors: [{ name: "", investment: "" }],
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addInvestor = () => {
    setFormData(prev => ({
      ...prev,
      newInvestors: [...prev.newInvestors, { name: "", investment: "" }],
    }));
  };

  const updateInvestor = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      newInvestors: prev.newInvestors.map((inv, i) => 
        i === index ? { ...inv, [field]: value } : inv
      ),
    }));
  };

  const removeInvestor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      newInvestors: prev.newInvestors.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Add Pricing Round Form */}
      <Card className="bg-gradient-to-br from-secondary/20 to-secondary/5 border border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-financial-info" />
            Add Pricing Round
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roundName">Round Name</Label>
                <Input
                  id="roundName"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Series A"
                  required
                  className="bg-background/70 border-primary/30 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preMoneyValuation">Pre-Money Valuation ($)</Label>
                <Input
                  id="preMoneyValuation"
                  type="number"
                  value={formData.preMoneyValuation}
                  onChange={(e) => handleInputChange("preMoneyValuation", e.target.value)}
                  placeholder="8000000"
                  required
                  className="bg-background/70 border-primary/30 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="investment">Total Investment ($)</Label>
                <Input
                  id="investment"
                  type="number"
                  value={formData.investment}
                  onChange={(e) => handleInputChange("investment", e.target.value)}
                  placeholder="2000000"
                  required
                  className="bg-background/70 border-primary/30 focus:border-primary"
                />
              </div>
            </div>

            {/* New Investors */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">New Investors</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInvestor}
                  className="border-primary/30 hover:bg-primary/10"
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add Investor
                </Button>
              </div>

              {formData.newInvestors.map((investor, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Investor Name</Label>
                    <Input
                      value={investor.name}
                      onChange={(e) => updateInvestor(index, "name", e.target.value)}
                      placeholder="VC Fund Name"
                      className="bg-background/70 border-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Investment Amount ($)</Label>
                    <Input
                      type="number"
                      value={investor.investment}
                      onChange={(e) => updateInvestor(index, "investment", e.target.value)}
                      placeholder="1500000"
                      className="bg-background/70 border-primary/30 focus:border-primary"
                    />
                  </div>
                  {formData.newInvestors.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeInvestor(index)}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {calculations && (
              <Card className="bg-financial-info/5 border border-financial-info/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-financial-info">
                    <Calculator className="h-5 w-5" />
                    Round Calculations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Pre-Money Price/Share</div>
                      <div className="text-lg font-semibold">${calculations.preMoneyPricePerShare.toFixed(4)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">New Shares Issued</div>
                      <div className="text-lg font-semibold">{Math.round(calculations.newShares).toLocaleString()}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Post-Money Price/Share</div>
                      <div className="text-lg font-semibold">${calculations.postMoneyPricePerShare.toFixed(4)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Post-Money Valuation</div>
                      <div className="text-lg font-semibold">${calculations.postMoneyValuation.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Ownership Distribution</div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-financial-success/10 text-financial-success border-financial-success/20">
                        Founders: {calculations.founderOwnership.toFixed(1)}%
                      </Badge>
                      {calculations.safeOwnership > 0 && (
                        <Badge variant="secondary" className="bg-financial-warning/10 text-financial-warning border-financial-warning/20">
                          SAFE: {calculations.safeOwnership.toFixed(1)}%
                        </Badge>
                      )}
                      <Badge variant="secondary" className="bg-financial-info/10 text-financial-info border-financial-info/20">
                        New Investors: {calculations.newInvestorOwnership.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-financial-info to-primary hover:from-financial-info/90 hover:to-primary/90 text-primary-foreground"
              disabled={!formData.name || !formData.preMoneyValuation || !formData.investment}
            >
              Add Pricing Round
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Pricing Rounds */}
      {existingRounds.length > 0 && (
        <Card className="bg-gradient-to-br from-card to-secondary/10 border border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-financial-info" />
              Pricing Rounds ({existingRounds.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {existingRounds.map((round) => (
                <div 
                  key={round.id} 
                  className="p-4 bg-background/50 rounded-lg border border-primary/10"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-lg">{round.name}</h4>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>Pre-Money: ${round.preMoneyValuation.toLocaleString()}</span>
                        <span>Raised: ${round.investment.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {round.newInvestors.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Investors:</div>
                      <div className="flex flex-wrap gap-2">
                        {round.newInvestors.map((investor, idx) => (
                          <Badge key={idx} variant="outline" className="border-primary/20">
                            {investor.name}: ${investor.investment.toLocaleString()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
