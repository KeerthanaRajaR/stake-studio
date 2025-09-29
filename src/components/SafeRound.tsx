import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Shield, DollarSign } from "lucide-react";
import type { SafeInvestment } from "@/pages/Index";

interface SafeRoundProps {
  onAddSafe: (safe: Omit<SafeInvestment, 'id' | 'converted'>) => void;
  existingSafes: SafeInvestment[];
}

export const SafeRound: React.FC<SafeRoundProps> = ({ onAddSafe, existingSafes }) => {
  const [formData, setFormData] = useState({
    investorName: "",
    amount: "",
    discount: "",
    valuationCap: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const safeData = {
      investorName: formData.investorName,
      amount: parseFloat(formData.amount),
      discount: parseFloat(formData.discount),
      valuationCap: formData.valuationCap ? parseFloat(formData.valuationCap) : undefined,
    };

    onAddSafe(safeData);
    
    // Reset form
    setFormData({
      investorName: "",
      amount: "",
      discount: "",
      valuationCap: "",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Add SAFE Form */}
      <Card className="bg-gradient-to-br from-secondary/20 to-secondary/5 border border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-financial-success" />
            Add SAFE Investment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="investorName">Investor Name</Label>
                <Input
                  id="investorName"
                  value={formData.investorName}
                  onChange={(e) => handleInputChange("investorName", e.target.value)}
                  placeholder="Angel Investor / VC Fund"
                  required
                  className="bg-background/70 border-primary/30 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Investment Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  placeholder="250000"
                  required
                  className="bg-background/70 border-primary/30 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={formData.discount}
                  onChange={(e) => handleInputChange("discount", e.target.value)}
                  placeholder="20"
                  required
                  className="bg-background/70 border-primary/30 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valuationCap">Valuation Cap ($) - Optional</Label>
                <Input
                  id="valuationCap"
                  type="number"
                  value={formData.valuationCap}
                  onChange={(e) => handleInputChange("valuationCap", e.target.value)}
                  placeholder="5000000"
                  className="bg-background/70 border-primary/30 focus:border-primary"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="bg-gradient-to-r from-financial-success to-primary hover:from-financial-success/90 hover:to-primary/90 text-primary-foreground"
              disabled={!formData.investorName || !formData.amount || !formData.discount}
            >
              Add SAFE Investment
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing SAFE Rounds */}
      {existingSafes.length > 0 && (
        <Card className="bg-gradient-to-br from-card to-secondary/10 border border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-financial-warning" />
              SAFE Investments ({existingSafes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {existingSafes.map((safe) => (
                <div 
                  key={safe.id} 
                  className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-primary/10"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{safe.investorName}</span>
                      {safe.converted && (
                        <Badge variant="secondary" className="bg-financial-success/10 text-financial-success border-financial-success/20">
                          Converted
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>${safe.amount.toLocaleString()}</span>
                      <span>{safe.discount}% discount</span>
                      {safe.valuationCap && (
                        <span>Cap: ${safe.valuationCap.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {existingSafes.length > 0 && (
              <div className="mt-4 p-4 bg-financial-info/10 rounded-lg border border-financial-info/20">
                <div className="text-sm font-medium text-financial-info mb-1">
                  Total SAFE Investment
                </div>
                <div className="text-xl font-bold text-financial-info">
                  ${existingSafes.reduce((sum, safe) => sum + safe.amount, 0).toLocaleString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
