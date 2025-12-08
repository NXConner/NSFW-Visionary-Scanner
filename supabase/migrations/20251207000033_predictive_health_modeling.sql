-- Migration: Predictive Health Modeling
-- Creates tables for advanced growth predictions, health risk predictions, optimal routine timing, outcome simulations, and long-term forecasting

-- Predictive Models
CREATE TABLE IF NOT EXISTS predictive_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  model_name TEXT NOT NULL UNIQUE,
  model_type TEXT NOT NULL CHECK (model_type IN ('growth_prediction', 'health_risk', 'routine_timing', 'outcome_simulation', 'long_term_forecast')),
  model_version TEXT NOT NULL,
  model_description TEXT,
  
  -- Model configuration
  model_config JSONB NOT NULL,
  input_features TEXT[] NOT NULL,
  output_features TEXT[] NOT NULL,
  
  -- Performance
  accuracy_score DECIMAL(5, 4),
  training_date DATE,
  last_updated DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_production BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Growth Predictions
CREATE TABLE IF NOT EXISTS growth_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID REFERENCES predictive_models(id),
  
  -- Prediction details
  prediction_date DATE NOT NULL,
  prediction_horizon_days INTEGER NOT NULL, -- How far into the future (30, 60, 90, 180, 365)
  
  -- Input data
  input_data JSONB NOT NULL, -- Historical data used for prediction
  
  -- Predictions
  predicted_growth JSONB NOT NULL, -- Predicted measurements over time
  confidence_intervals JSONB, -- Upper and lower bounds
  confidence_level DECIMAL(3, 2) DEFAULT 0.95,
  
  -- Factors
  contributing_factors JSONB, -- What factors contribute to growth
  limiting_factors JSONB, -- What factors limit growth
  
  -- Recommendations
  recommendations TEXT[],
  optimal_routine_suggestions JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Risk Predictions
CREATE TABLE IF NOT EXISTS health_risk_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID REFERENCES predictive_models(id),
  
  -- Risk assessment
  risk_type TEXT NOT NULL CHECK (risk_type IN ('erectile_dysfunction', 'peyronies', 'circulation', 'general_health', 'other')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
  risk_score DECIMAL(5, 2) NOT NULL, -- 0.00 to 100.00
  
  -- Prediction
  prediction_horizon_days INTEGER NOT NULL,
  probability DECIMAL(5, 4), -- Probability of risk occurring
  
  -- Factors
  risk_factors JSONB NOT NULL, -- Identified risk factors
  protective_factors JSONB, -- Protective factors
  
  -- Recommendations
  prevention_recommendations TEXT[],
  monitoring_recommendations TEXT[],
  when_to_see_doctor TEXT,
  
  -- Validation
  validated BOOLEAN DEFAULT false,
  validation_date DATE,
  actual_outcome TEXT, -- If risk occurred
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimal Routine Timing Predictions
CREATE TABLE IF NOT EXISTS routine_timing_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID REFERENCES predictive_models(id),
  
  -- Prediction
  prediction_date DATE NOT NULL,
  prediction_period_days INTEGER DEFAULT 30,
  
  -- Optimal timing
  optimal_times JSONB NOT NULL, -- Best times for routines
  optimal_days JSONB, -- Best days of week
  optimal_duration_minutes INTEGER,
  optimal_frequency_per_week DECIMAL(3, 1),
  
  -- Factors
  timing_factors JSONB, -- What affects optimal timing (sleep, stress, etc.)
  
  -- Expected outcomes
  expected_effectiveness DECIMAL(5, 2), -- Expected effectiveness score
  expected_progress JSONB, -- Expected progress if following optimal timing
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outcome Simulations
CREATE TABLE IF NOT EXISTS outcome_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Simulation scenario
  scenario_name TEXT NOT NULL,
  scenario_type TEXT NOT NULL CHECK (scenario_type IN ('routine_change', 'lifestyle_change', 'what_if', 'goal_achievement')),
  
  -- Input parameters
  simulation_parameters JSONB NOT NULL, -- What-if parameters
  baseline_data JSONB NOT NULL, -- Current baseline
  
  -- Simulated outcomes
  simulated_outcomes JSONB NOT NULL, -- Predicted outcomes
  time_horizon_days INTEGER NOT NULL,
  
  -- Comparison
  vs_baseline JSONB, -- Comparison to baseline
  improvement_percentage DECIMAL(5, 2),
  
  -- Recommendations
  recommendations TEXT[],
  action_items TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Long-Term Health Forecasting
CREATE TABLE IF NOT EXISTS long_term_health_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID REFERENCES predictive_models(id),
  
  -- Forecast
  forecast_date DATE NOT NULL,
  forecast_horizon_years INTEGER NOT NULL, -- 1, 2, 5, 10 years
  
  -- Forecasted metrics
  forecasted_metrics JSONB NOT NULL, -- Long-term health metrics
  confidence_intervals JSONB,
  
  -- Trajectories
  best_case_trajectory JSONB,
  worst_case_trajectory JSONB,
  most_likely_trajectory JSONB,
  
  -- Factors
  key_factors JSONB, -- Factors that will influence long-term health
  intervention_opportunities JSONB, -- Opportunities for intervention
  
  -- Recommendations
  long_term_recommendations TEXT[],
  milestone_goals JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- What-If Scenarios
CREATE TABLE IF NOT EXISTS what_if_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Scenario
  scenario_name TEXT NOT NULL,
  scenario_description TEXT,
  
  -- What-if parameters
  what_if_parameters JSONB NOT NULL, -- What changes to simulate
  baseline_comparison JSONB, -- Comparison to baseline
  
  -- Simulated outcomes
  simulated_outcomes JSONB NOT NULL,
  time_horizon_days INTEGER NOT NULL,
  
  -- Analysis
  impact_analysis JSONB, -- Impact of the what-if scenario
  feasibility_score DECIMAL(3, 2), -- How feasible is this scenario
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_predictive_models_type ON predictive_models(model_type);
CREATE INDEX IF NOT EXISTS idx_predictive_models_active ON predictive_models(is_active);
CREATE INDEX IF NOT EXISTS idx_growth_predictions_user_id ON growth_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_predictions_date ON growth_predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_health_risk_predictions_user_id ON health_risk_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_health_risk_predictions_risk_level ON health_risk_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_routine_timing_predictions_user_id ON routine_timing_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_outcome_simulations_user_id ON outcome_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_long_term_health_forecasts_user_id ON long_term_health_forecasts(user_id);
CREATE INDEX IF NOT EXISTS idx_what_if_scenarios_user_id ON what_if_scenarios(user_id);

-- RLS Policies
ALTER TABLE predictive_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_risk_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_timing_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE long_term_health_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE what_if_scenarios ENABLE ROW LEVEL SECURITY;

-- Predictive Models: All authenticated users can view active models
CREATE POLICY "Authenticated users can view active models"
  ON predictive_models FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- Growth Predictions: Users can view their own
CREATE POLICY "Users can manage own growth predictions"
  ON growth_predictions FOR ALL
  USING (auth.uid() = user_id);

-- Health Risk Predictions: Users can view their own
CREATE POLICY "Users can manage own health risk predictions"
  ON health_risk_predictions FOR ALL
  USING (auth.uid() = user_id);

-- Routine Timing Predictions: Users can view their own
CREATE POLICY "Users can manage own routine timing predictions"
  ON routine_timing_predictions FOR ALL
  USING (auth.uid() = user_id);

-- Outcome Simulations: Users can view their own
CREATE POLICY "Users can manage own outcome simulations"
  ON outcome_simulations FOR ALL
  USING (auth.uid() = user_id);

-- Long-Term Health Forecasts: Users can view their own
CREATE POLICY "Users can manage own long-term forecasts"
  ON long_term_health_forecasts FOR ALL
  USING (auth.uid() = user_id);

-- What-If Scenarios: Users can view their own
CREATE POLICY "Users can manage own what-if scenarios"
  ON what_if_scenarios FOR ALL
  USING (auth.uid() = user_id);

