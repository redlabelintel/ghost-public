/**
 * Warren Buffett CEO Agent Implementation
 * Integrates Warren Buffett's legendary business wisdom into OpenClaw operations
 */

class WarrenBuffettCEO {
    constructor() {
        this.name = "Warren Buffett";
        this.title = "Chief Executive Officer";
        this.avatar = "W";
        this.status = "STRATEGIC_OVERSIGHT";
        this.specialization = "Capital Allocation & Long-term Strategy";
        
        this.principles = {
            circleOfCompetence: true,
            marginOfSafety: 0.5, // 50% buffer on all decisions
            longTermFocus: true,
            valueOverPrice: true,
            simplicityOverComplexity: true
        };
        
        this.metrics = {
            monthlyBurnRate: 0,
            roai: 0, // Return on Agent Investment
            cashRunway: 0,
            agentUtilization: 0,
            systemUptime: 0
        };
        
        this.decisionThresholds = {
            maxExpense: 500, // Requires CEO approval above $500
            riskTolerance: 'conservative',
            paybackPeriod: 24, // months
            qualityScore: 0.85 // 85% minimum quality threshold
        };
    }

    // Warren's folksy communication style
    communicate(message, context = {}) {
        const responses = {
            cost_concern: [
                "Now, spending money just to spend money is like buying a stock just because it's going up. We need to see the value we're getting.",
                "I'd rather buy a wonderful agent at a fair price than a fair agent at a wonderful price.",
                "Every dollar we spend should come back with friends. If it doesn't, we shouldn't spend it."
            ],
            team_deployment: [
                "Good people are the best investment we can make. Give them room to run and they'll surprise you on the upside.",
                "I hire for integrity, intelligence, and energy. Without integrity, the other two will kill you.",
                "The best agents are like great businesses - they compound their value over time."
            ],
            risk_management: [
                "Rule number one: don't lose money. Rule number two: don't forget rule number one.",
                "Only when the tide goes out do you discover who's been swimming naked. Let's keep our shorts on.",
                "Risk comes from not knowing what you're doing. Do we understand this completely?"
            ],
            opportunity: [
                "The best time to expand is when others are contracting - if you have the capital.",
                "We're not trying to hit home runs here. Singles and doubles win championships.",
                "Time is the friend of the wonderful business. Is this a wonderful business?"
            ]
        };

        const category = this.categorizeMessage(message, context);
        const responseOptions = responses[category] || [
            "Let me think about this like I'm buying stock in the idea. What's the long-term value?",
            "Simple is better than complex. Can we make this even simpler?",
            "What would happen to this decision in a recession? That's the real test."
        ];

        return responseOptions[Math.floor(Math.random() * responseOptions.length)];
    }

    categorizeMessage(message, context) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('cost') || lowerMessage.includes('expense') || lowerMessage.includes('budget')) {
            return 'cost_concern';
        } else if (lowerMessage.includes('team') || lowerMessage.includes('hire') || lowerMessage.includes('agent')) {
            return 'team_deployment';
        } else if (lowerMessage.includes('risk') || lowerMessage.includes('danger') || lowerMessage.includes('problem')) {
            return 'risk_management';
        } else if (lowerMessage.includes('opportunity') || lowerMessage.includes('expand') || lowerMessage.includes('grow')) {
            return 'opportunity';
        }
        
        return 'general';
    }

    // Warren's decision-making framework
    evaluateDecision(proposal) {
        const evaluation = {
            approved: false,
            reasoning: "",
            conditions: [],
            alternatives: []
        };

        // Circle of Competence Check
        if (!this.isInCircleOfCompetence(proposal)) {
            evaluation.reasoning = "This is outside our circle of competence. We need to understand it better before proceeding.";
            evaluation.conditions.push("Acquire deep understanding of the domain");
            return evaluation;
        }

        // Margin of Safety Check
        const safetyMargin = this.calculateSafetyMargin(proposal);
        if (safetyMargin < this.principles.marginOfSafety) {
            evaluation.reasoning = "Insufficient margin of safety. The downside risk is too high for the potential upside.";
            evaluation.conditions.push("Reduce risk or increase potential returns");
            evaluation.alternatives.push("Pilot with smaller investment");
            return evaluation;
        }

        // Long-term Value Assessment
        const longTermValue = this.assessLongTermValue(proposal);
        if (longTermValue < 1.5) { // 150% minimum long-term value multiplier
            evaluation.reasoning = "The long-term value creation isn't compelling enough. We should focus on opportunities with clearer compound benefits.";
            evaluation.alternatives.push("Look for opportunities with network effects");
            evaluation.alternatives.push("Focus on existing high-performing agents");
            return evaluation;
        }

        // Simplicity Test
        if (!this.isSimpleEnough(proposal)) {
            evaluation.reasoning = "Too complex. If we can't explain it simply, we don't understand it well enough.";
            evaluation.conditions.push("Simplify the approach");
            evaluation.conditions.push("Break into smaller, understandable pieces");
            return evaluation;
        }

        // Opportunity Cost Analysis
        const opportunityCost = this.assessOpportunityCost(proposal);
        if (opportunityCost > proposal.expectedReturn) {
            evaluation.reasoning = "There are better uses for these resources. Let's focus on our highest-return opportunities first.";
            evaluation.alternatives.push("Invest in top-performing agent capabilities");
            evaluation.alternatives.push("Improve operational efficiency first");
            return evaluation;
        }

        // If all tests pass
        evaluation.approved = true;
        evaluation.reasoning = "This makes sense. It's in our wheelhouse, has adequate safety margins, creates long-term value, is simple to execute, and beats our alternatives. Let's proceed thoughtfully.";
        evaluation.conditions.push("Monitor results closely");
        evaluation.conditions.push("Set clear success metrics");
        evaluation.conditions.push("Plan regular reviews");

        return evaluation;
    }

    // Strategic metric calculations
    isInCircleOfCompetence(proposal) {
        const competenceAreas = [
            'agent_optimization', 
            'cost_management', 
            'system_reliability', 
            'team_productivity',
            'operational_efficiency'
        ];
        
        return proposal.category && competenceAreas.includes(proposal.category);
    }

    calculateSafetyMargin(proposal) {
        const maxLoss = proposal.maxLoss || proposal.cost || 0;
        const availableCapital = this.getAvailableCapital();
        const worstCaseRatio = maxLoss / availableCapital;
        
        return 1 - worstCaseRatio; // Higher is safer
    }

    assessLongTermValue(proposal) {
        // Warren looks for businesses that get stronger over time
        const factors = {
            networkEffects: proposal.networkEffects || 0,
            learningCurve: proposal.learningCurve || 0,
            switchingCosts: proposal.switchingCosts || 0,
            brandMoat: proposal.brandMoat || 0,
            scalability: proposal.scalability || 0
        };

        const averageScore = Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;
        return Math.max(averageScore, proposal.projectedROI || 1);
    }

    isSimpleEnough(proposal) {
        // Warren's "if you can't explain it to a 5-year-old" test
        const complexityIndicators = [
            proposal.dependencies && proposal.dependencies.length > 3,
            proposal.steps && proposal.steps.length > 5,
            proposal.description && proposal.description.length > 500,
            proposal.stakeholders && proposal.stakeholders.length > 4
        ];

        const complexityScore = complexityIndicators.filter(Boolean).length;
        return complexityScore <= 1; // Maximum 1 complexity indicator
    }

    assessOpportunityCost(proposal) {
        // What else could we do with these resources?
        const alternatives = [
            { name: 'optimize_existing_agents', expectedReturn: 1.3 },
            { name: 'improve_system_reliability', expectedReturn: 1.4 },
            { name: 'expand_successful_workflows', expectedReturn: 1.5 },
            { name: 'build_competitive_moats', expectedReturn: 1.6 }
        ];

        return Math.max(...alternatives.map(alt => alt.expectedReturn));
    }

    getAvailableCapital() {
        // Placeholder for actual capital calculation
        return 5000; // $5000 available capital
    }

    // CEO Strategic Dashboard Metrics
    getStrategicMetrics() {
        return {
            financial: {
                monthlyBurnRate: this.calculateBurnRate(),
                roai: this.calculateROAI(),
                cashRunway: this.calculateCashRunway(),
                localModelSavings: this.calculateLocalModelSavings()
            },
            operational: {
                agentUtilization: this.calculateAgentUtilization(),
                systemUptime: this.calculateSystemUptime(),
                qualityScore: this.calculateQualityScore(),
                customerSatisfaction: this.calculateCustomerSatisfaction()
            },
            strategic: {
                competitiveAdvantage: this.assessCompetitiveAdvantage(),
                marketPosition: this.assessMarketPosition(),
                innovationPipeline: this.assessInnovationPipeline(),
                longTermOptional: this.assessLongTermOptionality()
            }
        };
    }

    calculateBurnRate() {
        // Placeholder - would integrate with actual financial data
        return 450; // $450/month
    }

    calculateROAI() {
        // Return on Agent Investment
        const agentCosts = 200; // Monthly agent operational costs
        const agentValue = 650; // Value generated by agents
        return ((agentValue - agentCosts) / agentCosts) * 100; // 225% ROI
    }

    calculateCashRunway() {
        const currentCash = 5000;
        const burnRate = this.calculateBurnRate();
        return Math.floor(currentCash / burnRate); // Months of runway
    }

    calculateLocalModelSavings() {
        return 320; // $320/month saved vs cloud models
    }

    calculateAgentUtilization() {
        return 78; // 78% utilization rate
    }

    calculateSystemUptime() {
        return 99.2; // 99.2% uptime
    }

    calculateQualityScore() {
        return 87; // 87% quality score
    }

    calculateCustomerSatisfaction() {
        return 92; // 92% satisfaction
    }

    assessCompetitiveAdvantage() {
        return "Strong - Local model integration & rapid deployment";
    }

    assessMarketPosition() {
        return "Leader - Superior operational intelligence";
    }

    assessInnovationPipeline() {
        return "Robust - 3 major capabilities in development";
    }

    assessLongTermOptionality() {
        return "High - Scalable platform with network effects";
    }

    // Generate Warren's Monthly Board Letter
    generateMonthlyBoardLetter() {
        const metrics = this.getStrategicMetrics();
        const date = new Date().toLocaleDateString();
        
        return `
**BERKSHIRE OPENCLAW - MONTHLY BOARD LETTER**
*${date}*

To our Shareholders,

Another month in the books, and I'm pleased to report that our business fundamentals remain strong. Let me walk you through what happened and what it means for the long term.

**FINANCIAL PERFORMANCE**
Our monthly burn rate of $${metrics.financial.monthlyBurnRate} keeps us well within our conservative targets. More importantly, our Return on Agent Investment (ROAI) of ${metrics.financial.roai}% demonstrates that every dollar we put to work is generating solid returns. Our local model strategy continues to save us $${metrics.financial.localModelSavings} monthly compared to cloud alternatives - that's money that goes straight to the bottom line.

With ${metrics.financial.cashRunway} months of runway, we're positioned to weather any storms while continuing to invest in our future. As I've always said, cash is to a business what oxygen is to an individual - never thought about until it's gone.

**OPERATIONAL EXCELLENCE** 
Our agent utilization rate of ${metrics.operational.agentUtilization}% tells me we're getting good value from our team without burning them out. System uptime of ${metrics.operational.systemUptime}% and quality scores of ${metrics.operational.qualityScore}% show we're building something reliable that customers can count on.

**STRATEGIC POSITION**
We continue to strengthen our competitive moat through ${metrics.strategic.competitiveAdvantage.toLowerCase()}. Our market position as ${metrics.strategic.marketPosition.toLowerCase()} gives us optionality - the most valuable thing in business.

The innovation pipeline remains ${metrics.strategic.innovationPipeline.toLowerCase()}, but remember: we're not trying to hit home runs here. Consistent singles and doubles, compounded over time, create wealth.

**LOOKING AHEAD**
We're building something that gets stronger with time. Each month, our systems learn more, our processes improve, and our competitive advantages deepen. That's the kind of business I like to own.

The test of any business isn't how it performs when everything goes right, but how it holds up when things go wrong. We're building for both scenarios.

Keep thinking long term,

Warren E. Buffett
Chairman & CEO, OpenClaw Holdings

*"Someone's sitting in the shade today because someone planted a tree a long time ago."*
        `.trim();
    }

    // CEO Approval Workflows
    requiresCEOApproval(action) {
        const ceoApprovalRequired = [
            { type: 'expense', threshold: this.decisionThresholds.maxExpense },
            { type: 'hiring', threshold: 0 },
            { type: 'strategic_change', threshold: 0 },
            { type: 'system_modification', threshold: 0 },
            { type: 'external_partnership', threshold: 0 }
        ];

        return ceoApprovalRequired.some(rule => {
            if (action.type === rule.type) {
                if (rule.threshold === 0) return true;
                return action.amount > rule.threshold;
            }
            return false;
        });
    }

    processApproval(action) {
        if (!this.requiresCEOApproval(action)) {
            return { approved: true, message: "No CEO approval required. Proceed." };
        }

        const evaluation = this.evaluateDecision(action);
        
        if (evaluation.approved) {
            return {
                approved: true,
                message: `CEO APPROVED: ${evaluation.reasoning}`,
                conditions: evaluation.conditions
            };
        } else {
            return {
                approved: false,
                message: `CEO DENIED: ${evaluation.reasoning}`,
                alternatives: evaluation.alternatives,
                conditions: evaluation.conditions
            };
        }
    }
}

// Export for use in Command Center
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WarrenBuffettCEO;
} else {
    window.WarrenBuffettCEO = WarrenBuffettCEO;
}