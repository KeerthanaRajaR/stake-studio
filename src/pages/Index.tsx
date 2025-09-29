import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, TrendingUp, Users, DollarSign } from "lucide-react";
import { CompanySetup } from "@/components/CompanySetup";
import { SafeRound } from "@/components/SafeRound";
import { PricingRound } from "@/components/PricingRound";
import { OwnershipTable } from "@/components/OwnershipTable";
import { ExitScenario } from "@/components/ExitScenario";
import { useToast } from "@/hooks/use-toast";

export interface Company {
  name: string;
  foundersShares: number;
  totalShares: number;
  initialValuation: number;
}

export interface SafeInvestment {
  id: string;
  investorName: string;
  amount: number;
  discount: number;
  valuationCap?: number;
  converted: boolean;
}

export interface PricingRoundData {
  id: string;
  name: string;
  preMoneyValuation: number;
  investment: number;
  newInvestors: Array<{
    name: string;
    investment: number;
  }>;
}

const Index = () => {
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [safeRounds, setSafeRounds] = useState<SafeInvestment[]>([]);
  const [pricingRounds, setPricingRounds] = useState<PricingRoundData[]>([]);
  const [activeTab, setActiveTab] = useState("setup");

  const handleCompanySetup = useCallback((companyData: Company) => {
    setCompany(companyData);
    setActiveTab("safe");
    toast({
      title: "Company Setup Complete",
      description: `${companyData.name} configured with ${companyData.foundersShares.toLocaleString()} founder shares`,
    });
  }, [toast]);

  const handleSafeRound = useCallback((safeData: Omit<SafeInvestment, 'id' | 'converted'>) => {
    const newSafe: SafeInvestment = {
      ...safeData,
      id: Math.random().toString(36).substr(2, 9),
      converted: false,
    };
    setSafeRounds(prev => [...prev, newSafe]);
    toast({
      title: "SAFE Round Added",
      description: `${safeData.investorName} - $${safeData.amount.toLocaleString()}`,
    });
  }, [toast]);

  const handlePricingRound = useCallback((roundData: Omit<PricingRoundData, 'id'>) => {
    const newRound: PricingRoundData = {
      ...roundData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setPricingRounds(prev => [...prev, newRound]);
    
    // Mark SAFE rounds as converted
    setSafeRounds(prev => prev.map(safe => ({ ...safe, converted: true })));
    
    toast({
      title: "Pricing Round Added",
      description: `${roundData.name} - $${roundData.investment.toLocaleString()} raised`,
    });
  }, [toast]);

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold bg-gradient-to-r from-primary to-financial-success bg-clip-text text-transparent">
              Startup Equity Scenario Builder
            </h1>
            <p className="text-lg text-muted-foreground">
              Model ownership changes across funding rounds and calculate founder returns
            </p>
          </div>
          
          <Card className="mx-auto max-w-2xl bg-gradient-to-br from-card to-secondary/10 border border-primary/20 shadow-lg shadow-primary/10">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Get Started
              </CardTitle>
              <CardDescription>
                Set up your company details to begin modeling equity scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanySetup onSetup={handleCompanySetup} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{company.name}</h1>
          <p className="text-muted-foreground">
            Initial Valuation: ${company.initialValuation.toLocaleString()} • 
            Founder Shares: {company.foundersShares.toLocaleString()}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-card to-secondary/10 border border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SAFE Rounds</p>
                  <p className="text-2xl font-bold text-financial-success">{safeRounds.length}</p>
                </div>
                <Users className="h-8 w-8 text-financial-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-card to-secondary/10 border border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pricing Rounds</p>
                  <p className="text-2xl font-bold text-financial-info">{pricingRounds.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-financial-info" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-card to-secondary/10 border border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Raised</p>
                  <p className="text-2xl font-bold text-financial-warning">
                    ${(safeRounds.reduce((sum, safe) => sum + safe.amount, 0) + 
                      pricingRounds.reduce((sum, round) => sum + round.investment, 0)).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-financial-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-secondary/50 backdrop-blur-sm">
            <TabsTrigger value="safe" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              SAFE Rounds
            </TabsTrigger>
            <TabsTrigger value="pricing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Pricing Rounds
            </TabsTrigger>
            <TabsTrigger value="ownership" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Ownership
            </TabsTrigger>
            <TabsTrigger value="exit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Exit Scenarios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="safe" className="space-y-6">
            <Card className="bg-gradient-to-br from-card to-secondary/10 border border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <PlusCircle className="h-5 w-5 text-primary" />
                      SAFE Investment Rounds
                    </CardTitle>
                    <CardDescription>
                      Add SAFE investors with discount rates and valuation caps
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SafeRound onAddSafe={handleSafeRound} existingSafes={safeRounds} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <Card className="bg-gradient-to-br from-card to-secondary/10 border border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Pricing Rounds
                </CardTitle>
                <CardDescription>
                  Add equity financing rounds with pre-money valuations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PricingRound 
                  onAddRound={handlePricingRound}
                  company={company}
                  safeRounds={safeRounds}
                  existingRounds={pricingRounds}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ownership" className="space-y-6">
            <OwnershipTable 
              company={company}
              safeRounds={safeRounds}
              pricingRounds={pricingRounds}
            />
          </TabsContent>

          <TabsContent value="exit" className="space-y-6">
            <ExitScenario 
              company={company}
              safeRounds={safeRounds}
              pricingRounds={pricingRounds}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;