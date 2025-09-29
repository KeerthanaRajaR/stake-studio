import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import type { Company } from "@/pages/Index";

interface CompanySetupProps {
  onSetup: (company: Company) => void;
}

export const CompanySetup: React.FC<CompanySetupProps> = ({ onSetup }) => {
  const [formData, setFormData] = useState({
    name: "",
    foundersShares: "",
    totalShares: "",
    initialValuation: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const company: Company = {
      name: formData.name,
      foundersShares: parseInt(formData.foundersShares),
      totalShares: parseInt(formData.totalShares),
      initialValuation: parseFloat(formData.initialValuation),
    };

    onSetup(company);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company Name
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter your company name"
            required
            className="bg-background/50 border-primary/30 focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="foundersShares">Founder Shares</Label>
            <Input
              id="foundersShares"
              type="number"
              value={formData.foundersShares}
              onChange={(e) => handleInputChange("foundersShares", e.target.value)}
              placeholder="8000000"
              required
              className="bg-background/50 border-primary/30 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalShares">Total Authorized Shares</Label>
            <Input
              id="totalShares"
              type="number"
              value={formData.totalShares}
              onChange={(e) => handleInputChange("totalShares", e.target.value)}
              placeholder="10000000"
              required
              className="bg-background/50 border-primary/30 focus:border-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="initialValuation">Initial Valuation ($)</Label>
          <Input
            id="initialValuation"
            type="number"
            value={formData.initialValuation}
            onChange={(e) => handleInputChange("initialValuation", e.target.value)}
            placeholder="1000000"
            required
            className="bg-background/50 border-primary/30 focus:border-primary"
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-primary to-financial-success hover:from-primary/90 hover:to-financial-success/90 text-primary-foreground font-semibold"
        disabled={!formData.name || !formData.foundersShares || !formData.totalShares || !formData.initialValuation}
      >
        Setup Company
      </Button>
    </form>
  );
};