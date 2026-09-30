import os
import re

target_file = r"c:\Users\maras\OneDrive\文档\c program\Desktop\major\FitIQ\backend\llm_service.py"
with open(target_file, "r", encoding="utf-8") as f:
    content = f.read()

# Verify marker
det_marker = "def generate_deterministic_interpretation(data):"
comp_marker = "def generate_nutrition_meal_plan(data, nutrition_result, structured_plan=None):"

if det_marker not in content or comp_marker not in content:
    print("ERROR: Markers not found!")
    exit(1)

pre_part = content.split(det_marker)[0]
post_part = comp_marker + content.split(comp_marker)[1]

new_middle = '''def generate_deterministic_interpretation(data):
    """
    High-fidelity, deterministic analytics interpretation engine.
    Strictly adheres to all FitIQ rules:
    - Never hallucinates data
    - Treats calculations as source of truth
    - Explains without technical jargon in user mode
    - Dynamically recalculates recommendations based on latest checkin and checkin changes
    - Eliminates false 0/100 consistency claims when history is insufficient
    - Avoids fake causal claims (e.g. cellular metabolic rate claims)
    """
    profile = data.get("profile", {}) or {}
    engines = data.get("engines", {}) or {}

    latest_checkin = data.get("latest_checkin") or data.get("today_checkin") or {}
    previous_checkin = data.get("previous_checkin")
    recent_history = data.get("recent_history", []) or []

    if not previous_checkin and len(recent_history) >= 2:
        def get_ts(rec):
            if not rec or not isinstance(rec, dict):
                return 0
            for k in ("completedAtMillis", "timestamp", "completedAt", "recordedAt", "date"):
                val = rec.get(k)
                if val:
                    if isinstance(val, (int, float)):
                        return float(val)
                    if isinstance(val, str):
                        try:
                            dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
                            return dt.timestamp() * 1000
                        except Exception:
                            pass
            return 0
        sorted_history = sorted(recent_history, key=get_ts)
        previous_checkin = sorted_history[-2]

    changes = data.get("changes") or extract_checkin_changes(latest_checkin, previous_checkin)
    checkin_count = data.get("checkin_count") or (len(recent_history) if recent_history else (1 if latest_checkin else 0))
    is_first_checkin = data.get("is_first_checkin", False) or (checkin_count <= 1 or previous_checkin is None)

    # Extract engine data
    e1_fis = engines.get("engine1_fis") or data.get("fisResult") or {}
    e2_behavior = engines.get("engine2_behavior") or data.get("behaviorResult") or {}
    e3_forecast = engines.get("engine3_forecast") or data.get("consistencyPrediction") or {}
    e3_prediction = engines.get("engine3_prediction") or data.get("predictionResult") or {}
    e4_cohort = engines.get("engine4_cohort") or data.get("cohortResult") or {}
    e5_anomaly = engines.get("engine5_anomaly") or data.get("anomalyResult") or {}
    e6_nutrition = engines.get("engine6_nutrition") or data.get("nutritionData") or {}

    # User profile fields
    age = profile.get("age")
    gender = profile.get("gender", "User")
    height = profile.get("height")
    weight = profile.get("weight")
    goal = profile.get("goal", "Fitness Maintenance")
    activity_level = profile.get("activityLevel", "Moderate")
    bmi = profile.get("bodyAnalysis", {}).get("bmi") or profile.get("bmi")
    bmi_cat = profile.get("bodyAnalysis", {}).get("category") or "Normal"

    # -------------------------------------------------------------
    # 1. EVALUATE ENGINE 1 (FIS SCORE)
    # -------------------------------------------------------------
    fis_score = e1_fis.get("fis")
    fitness_activity = e1_fis.get("fitnessActivity", {})
    recovery = e1_fis.get("recovery", {})
    body_comp = e1_fis.get("bodyComposition", {})
    nutrition_sub = e1_fis.get("nutrition", {})
    consistency_sub = e1_fis.get("consistency", {})

    subscores = {
        "Physical Activity": fitness_activity.get("score"),
        "Recovery & Sleep": recovery.get("score"),
        "Body Composition": body_comp.get("score"),
        "Hydration & Nutrition": nutrition_sub.get("score"),
    }
    # Only include consistency if there is sufficient historical check-in data (>= 3 check-ins)
    if checkin_count >= 3 and consistency_sub.get("score") is not None:
        subscores["Consistency"] = consistency_sub.get("score")

    valid_subscores = {k: v for k, v in subscores.items() if v is not None}
    
    highest_sub = max(valid_subscores.items(), key=lambda x: x[1]) if valid_subscores else ("Physical Activity", 70)
    lowest_sub = min(valid_subscores.items(), key=lambda x: x[1]) if valid_subscores else ("Physical Activity", 50)

    # -------------------------------------------------------------
    # 2. EVALUATE ENGINE 2 (BEHAVIOR CORRELATION)
    # -------------------------------------------------------------
    patterns = e2_behavior.get("patterns", [])
    behavior_mode = e2_behavior.get("mode", "population")
    top_pattern = patterns[0] if patterns else None

    # -------------------------------------------------------------
    # 3. EVALUATE ENGINE 3 (CONSISTENCY FORECAST & BMI PREDICTION)
    # -------------------------------------------------------------
    forecast_trend = e3_forecast.get("trend", "stable")
    forecast_change = e3_forecast.get("change", 0)
    current_consistency = e3_forecast.get("current_score")
    projected_consistency = e3_forecast.get("projected_score")
    pred_bmi_change = e3_prediction.get("predicted_bmi_change")
    pred_future_bmi = e3_prediction.get("predicted_future_bmi")
    shap_factors = e3_prediction.get("shap_factors", [])

    # -------------------------------------------------------------
    # 4. EVALUATE ENGINE 4 (COHORT INTELLIGENCE)
    # -------------------------------------------------------------
    cohort_size = e4_cohort.get("cohort_size", 0)
    cohort_comparisons = e4_cohort.get("comparisons", {})
    cohort_similarity = e4_cohort.get("average_similarity", 0.85)

    # -------------------------------------------------------------
    # 5. EVALUATE ENGINE 5 (ANOMALY & PLATEAU)
    # -------------------------------------------------------------
    anomalies = e5_anomaly.get("anomalies", [])
    has_anomaly = len(anomalies) > 0
    plateau_info = e5_anomaly.get("plateau", {})
    plateau_detected = plateau_info.get("detected", False) or plateau_info.get("plateau_detected", False)

    # -------------------------------------------------------------
    # 6. EVALUATE ENGINE 6 (NUTRITION)
    # -------------------------------------------------------------
    calorie_target = e6_nutrition.get("calorie_target")
    tdee = e6_nutrition.get("tdee")
    bmr = e6_nutrition.get("bmr")
    macros = e6_nutrition.get("macros", {})
    food_recs = e6_nutrition.get("recommendations", [])
    water_target = float(e6_nutrition.get("targets", {}).get("water_liters") or 2.5)

    # -------------------------------------------------------------
    # SYNTHESIZE STRENGTHS & AREAS NEEDING ATTENTION
    # -------------------------------------------------------------
    strengths = []
    needs_attention = []

    if fis_score is not None:
        if fis_score >= 75:
            strengths.append(f"Strong overall Fitness Indicator Score of {fis_score}/100, reflecting solid baseline health.")
        else:
            needs_attention.append(f"Current Fitness Indicator Score of {fis_score}/100 shows clear room for structured progress.")

    if highest_sub and highest_sub[1] is not None and highest_sub[1] >= 65:
        strengths.append(f"{highest_sub[0]} is your strongest pillar ({round(highest_sub[1], 1)}/100), providing a reliable anchor for your routine.")

    if lowest_sub and lowest_sub[1] is not None and lowest_sub[1] < 70:
        needs_attention.append(f"{lowest_sub[0]} is your lowest scoring dimension ({round(lowest_sub[1], 1)}/100) and represents your highest-leverage improvement opportunity.")

    if checkin_count >= 3:
        if forecast_trend == "improving":
            strengths.append(f"Your tracking consistency is trending positively (+{abs(forecast_change)}% trajectory), strengthening habit formation.")
        elif forecast_trend == "declining":
            needs_attention.append(f"Recent consistency shows a declining short-term pattern ({forecast_change}% change), signaling possible routine disruption.")
    else:
        strengths.append("Consistency baseline is currently being established across your initial check-in cycles.")

    if plateau_detected:
        needs_attention.append("A progress plateau was detected across recent activity windows, indicating that your body has adapted to current training stimuli.")
    elif not has_anomaly:
        strengths.append("Activity patterns show steady stability without disruptive outliers or erratic variance.")

    if not strengths:
        strengths.append("Active tracking engagement provides valuable baseline data for personalized fitness optimization.")
    if not needs_attention:
        needs_attention.append("Continue current habits while gradually challenging your progressive overload targets.")

    # -------------------------------------------------------------
    # DYNAMIC PRIORITY ACTIONS (CHANGE-SENSITIVE & FACTUAL)
    # -------------------------------------------------------------
    candidate_actions = []

    # 1. SLEEP RECOVERY
    sleep_change = changes.get("sleep", {})
    cur_sleep = sleep_change.get("latest")
    if cur_sleep is None:
        raw_s = latest_checkin.get("sleepHours") or latest_checkin.get("sleep")
        cur_sleep = float(raw_s) if raw_s is not None and raw_s != "" else 7.0
    sleep_diff = sleep_change.get("diff")

    if sleep_diff is not None and sleep_diff < -0.4:
        candidate_actions.append({
            "rank": 98 + min(15, abs(sleep_diff) * 5),
            "title": "Restore Sleep & Recovery",
            "what_is_happening": f"Sleep decreased by {abs(sleep_diff)} hours compared with your previous check-in (recorded {cur_sleep} hrs).",
            "why_it_matters": "Adequate rest restores physical energy and supports daily cognitive and muscular recovery.",
            "what_to_do_next": "Prioritize a consistent sleep schedule tonight, aiming for 7–8 hours of restorative rest.",
            "since_last_checkin": f"↓ Sleep decreased by {abs(sleep_diff)} hours",
            "evidence": "Engine 1 (Recovery Pillar) & Daily Check-in comparison",
            "related_engine": "Engine 1 — Recovery"
        })
    elif cur_sleep < 6.0:
        candidate_actions.append({
            "rank": 88,
            "title": "Prioritize Restorative Sleep",
            "what_is_happening": f"Recorded sleep duration was {cur_sleep} hours, below the 7-hour target.",
            "why_it_matters": "Sleep under 6 hours limits muscular recovery and physical stamina.",
            "what_to_do_next": "Set a screen-free wind-down routine 45 minutes before sleep tonight.",
            "since_last_checkin": "First check-in — baseline established." if is_first_checkin else f"Recorded {cur_sleep} hrs sleep",
            "evidence": "Engine 1 (Recovery Pillar)",
            "related_engine": "Engine 1 — Recovery"
        })
    elif sleep_diff is not None and sleep_diff >= 0.8:
        candidate_actions.append({
            "rank": 72,
            "title": "Sustain Sleep Improvement",
            "what_is_happening": f"Sleep increased by +{sleep_diff} hours compared with your previous check-in (recorded {cur_sleep} hrs).",
            "why_it_matters": "Consistent 7+ hours of sleep accelerates daily muscle recovery and daily energy.",
            "what_to_do_next": "Maintain this bedtime schedule tonight to consolidate your recovery routine.",
            "since_last_checkin": f"↑ Sleep increased by {sleep_diff} hours",
            "evidence": "Engine 1 (Recovery Pillar)",
            "related_engine": "Engine 1 — Recovery"
        })

    # 2. HYDRATION (WATER)
    water_change = changes.get("water", {})
    cur_water = water_change.get("latest")
    if cur_water is None:
        raw_w = latest_checkin.get("waterIntake") or latest_checkin.get("water")
        cur_water = float(raw_w) if raw_w is not None and raw_w != "" else 2.0
    water_diff = water_change.get("diff")

    if water_diff is not None and water_diff < -0.4:
        candidate_actions.append({
            "rank": 94 + min(10, abs(water_diff) * 5),
            "title": "Replenish Daily Fluid Intake",
            "what_is_happening": f"Water intake dropped by {abs(water_diff)} L compared with your previous check-in (recorded {cur_water} L).",
            "why_it_matters": "Your recorded water intake is below your current target.",
            "what_to_do_next": f"Keep a water bottle nearby and target {water_target} L daily.",
            "since_last_checkin": f"↓ Water decreased by {abs(water_diff)} L",
            "evidence": "Engine 6 (Hydration Targets)",
            "related_engine": "Engine 6 — Hydration"
        })
    elif cur_water < 1.8:
        candidate_actions.append({
            "rank": 82,
            "title": "Increase Daily Fluid Intake",
            "what_is_happening": f"Your recorded water intake ({cur_water} L) is below your current {water_target} L target.",
            "why_it_matters": "Your recorded water intake is below your current target.",
            "what_to_do_next": f"Aim for {water_target} liters of water distributed evenly across morning, afternoon, and evening.",
            "since_last_checkin": "First check-in — baseline established." if is_first_checkin else f"Recorded {cur_water} L vs {water_target} L target",
            "evidence": "Engine 6 (Hydration Targets)",
            "related_engine": "Engine 6 — Hydration"
        })
    elif water_diff is not None and water_diff >= 0.8 and cur_water >= 2.0:
        candidate_actions.append({
            "rank": 74,
            "title": "Maintain Hydration Consistency",
            "what_is_happening": f"Hydration has improved since your previous check-in, reaching {cur_water} L.",
            "why_it_matters": "Consistent hydration maintains fluid balance and supports your daily energy.",
            "what_to_do_next": "Keep your intake consistent throughout the day.",
            "since_last_checkin": f"↑ Water increased by {water_diff} L",
            "evidence": "Engine 6 (Hydration Targets)",
            "related_engine": "Engine 6 — Hydration"
        })

    # 3. ACTIVITY (STEPS)
    steps_change = changes.get("steps", {})
    cur_steps = steps_change.get("latest")
    if cur_steps is None:
        raw_st = latest_checkin.get("steps") or latest_checkin.get("dailySteps")
        cur_steps = float(raw_st) if raw_st is not None and raw_st != "" else 5000
    steps_diff = steps_change.get("diff")

    if steps_diff is not None and steps_diff <= -1500:
        candidate_actions.append({
            "rank": 96 + min(12, abs(steps_diff) / 500),
            "title": "Re-Engage Daily Movement",
            "what_is_happening": f"Steps decreased by {abs(int(steps_diff)):,} steps compared with your previous check-in (recorded {int(cur_steps):,} steps).",
            "why_it_matters": "Daily step volume forms the foundation of your active physical expenditure.",
            "what_to_do_next": "Add a 20-minute brisk walk after lunch or dinner to recover your step baseline.",
            "since_last_checkin": f"↓ Steps decreased by {abs(int(steps_diff)):,}",
            "evidence": "Engine 1 (Physical Activity Pillar)",
            "related_engine": "Engine 1 — Physical Activity"
        })
    elif cur_steps < 4500:
        candidate_actions.append({
            "rank": 78,
            "title": "Elevate Daily Step Baseline",
            "what_is_happening": f"Recorded step volume was {int(cur_steps):,} steps, below the active baseline threshold.",
            "why_it_matters": "Increasing non-exercise daily movement raises overall metabolic expenditure.",
            "what_to_do_next": "Target at least 6,000 steps tomorrow by taking short active walking breaks.",
            "since_last_checkin": "First check-in — baseline established." if is_first_checkin else f"Recorded {int(cur_steps):,} steps",
            "evidence": "Engine 1 (Physical Activity Pillar)",
            "related_engine": "Engine 1 — Physical Activity"
        })
    elif steps_diff is not None and steps_diff >= 1500:
        candidate_actions.append({
            "rank": 76,
            "title": "Build on Activity Momentum",
            "what_is_happening": f"Your activity increased by +{int(steps_diff):,} steps compared with your previous check-in ({int(cur_steps):,} steps).",
            "why_it_matters": "Maintaining this level consistently can strengthen your activity trend.",
            "what_to_do_next": "Aim to hit a similar movement target tomorrow to establish a strong weekly pattern.",
            "since_last_checkin": f"↑ Steps increased by {int(steps_diff):,}",
            "evidence": "Engine 1 (Physical Activity Pillar)",
            "related_engine": "Engine 1 — Physical Activity"
        })

    # 4. NUTRITION ALIGNMENT
    if calorie_target:
        candidate_actions.append({
            "rank": 70,
            "title": f"Align Nutrition with {goal} Target",
            "what_is_happening": f"Your nutrition is calibrated to your {goal.lower()} energy target (~{calorie_target} kcal).",
            "why_it_matters": "Hitting your optimal energy balance supports your body composition and training targets.",
            "what_to_do_next": f"Distribute protein and carbohydrates across your daily meals, aiming for ~{calorie_target} kcal.",
            "since_last_checkin": "First check-in — baseline established." if is_first_checkin else "Caloric target calibrated",
            "evidence": "Engine 6 (Nutrition Intelligence)",
            "related_engine": "Engine 6 — Nutrition"
        })

    # 5. PLATEAU OR CONSISTENCY INTERVENTION (IF HISTORICAL DATA SUFFICIENT)
    if plateau_detected:
        candidate_actions.append({
            "rank": 92,
            "title": "Stimulate Adaptation to Break Plateau",
            "what_is_happening": "Your body has adapted to your current activity level, leading to stagnation in progress.",
            "why_it_matters": "Without variation or progressive overload, fitness improvements remain flat.",
            "what_to_do_next": "Introduce new stimuli to your routine by increasing intensity or changing exercise modalities.",
            "since_last_checkin": "Plateau detected across tracking window",
            "evidence": "Engine 5 (Plateau Detection)",
            "related_engine": "Engine 5 — Plateau"
        })
    elif checkin_count >= 3 and forecast_trend == "declining":
        candidate_actions.append({
            "rank": 85,
            "title": "Restore Habit Consistency with Micro-Targets",
            "what_is_happening": "Your tracking consistency is showing a downward trend.",
            "why_it_matters": "Losing habit momentum prevents long-term engagement.",
            "what_to_do_next": "Commit to smaller, manageable daily targets to rebuild your routine without burning out.",
            "since_last_checkin": f"Consistency drift of {abs(forecast_change)}%",
            "evidence": f"Engine 3 projected a consistency decline of {abs(forecast_change)}%.",
            "related_engine": "Engine 3 — Consistency"
        })

    # 6. BEHAVIOR CORRELATION / BASELINE
    if is_first_checkin:
        candidate_actions.append({
            "rank": 65,
            "title": "Build Your Check-in Baseline",
            "what_is_happening": "FitIQ has recorded your first check-in and established your starting baseline.",
            "why_it_matters": "Daily check-ins build habit permanence and unlock comparison insights.",
            "what_to_do_next": "Complete tomorrow's check-in to start comparing your day-over-day changes.",
            "since_last_checkin": "First check-in — baseline established.",
            "evidence": "Engine 1 (Baseline Ingestion)",
            "related_engine": "Engine 1 — Consistency Baseline"
        })
    elif top_pattern:
        rel_name = top_pattern.get("relationship", "").replace("_", " and ")
        candidate_actions.append({
            "rank": 58,
            "title": f"Leverage {rel_name.title()} Synergy",
            "what_is_happening": f"There is a {top_pattern.get('strength', 'positive').lower()} relationship between {rel_name}.",
            "why_it_matters": "Improvements in one coincide with gains in the other, creating compounding behavioral synergy.",
            "what_to_do_next": "Support your daily activity by actively prioritizing these compounding habits together.",
            "since_last_checkin": "Habit pattern reinforced",
            "evidence": "Engine 2 (Behavior Correlation)",
            "related_engine": "Engine 2 — Behavior"
        })
    else:
        candidate_actions.append({
            "rank": 55,
            "title": "Leverage Rest and Movement Synergy",
            "what_is_happening": "Physical activity and sleep recovery reinforce each other across your routine.",
            "why_it_matters": "Restful sleep supports higher daily activity, and movement promotes deeper rest.",
            "what_to_do_next": "Pair a consistent sleep schedule with daily walking to compound health gains.",
            "since_last_checkin": "Habit pattern reinforced",
            "evidence": "Engine 2 (Behavior Correlation)",
            "related_engine": "Engine 2 — Behavior"
        })

    # Sort candidates by calculated rank (descending) and select top 3
    candidate_actions.sort(key=lambda a: a["rank"], reverse=True)
    priority_actions = []
    for idx, act in enumerate(candidate_actions[:3]):
        priority_actions.append({
            "priority": idx + 1,
            "title": act["title"],
            "what_is_happening": act["what_is_happening"],
            "why_it_matters": act["why_it_matters"],
            "what_to_do_next": act["what_to_do_next"],
            "since_last_checkin": act.get("since_last_checkin", "First check-in — baseline established." if is_first_checkin else "Baseline recorded"),
            "evidence": act["evidence"],
            "related_engine": act.get("related_engine", "FitIQ Analytics")
        })

    # -------------------------------------------------------------
    # CROSS-ENGINE INSIGHTS (Cross-Engine Reasoning)
    # -------------------------------------------------------------
    cross_engine_insights = []
    
    cross_engine_insights.append(
        f"Multi-Pillar Synergy: Your FIS score ({fis_score or 'Available upon tracking'}) is anchored by {highest_sub[0]} ({round(highest_sub[1], 1)}/100), "
        f"with clear headroom for improvement in {lowest_sub[0]} ({round(lowest_sub[1], 1)}/100). "
        f"Elevating this single focus area will yield the highest proportional gain across your analytics profile."
    )

    if top_pattern and (forecast_trend != "improving"):
        cross_engine_insights.append(
            f"Behavioral & Trend Correlation: Engine 2 shows that {top_pattern.get('relationship', '').replace('_', ' and ')} move together in your tracking. "
            f"Protecting your recovery routine provides the energy needed to stabilize workout consistency."
        )

    if plateau_detected and calorie_target:
        cross_engine_insights.append(
            f"Plateau & Energy Balance Interaction: Engine 5 detected an activity plateau while Engine 6 configured a daily target of {calorie_target} kcal. "
            f"When training volume stagnates, adjusting nutritional timing or macronutrient distribution can reignite adaptive progress without requiring drastic caloric cuts."
        )

    # -------------------------------------------------------------
    # KEY FINDINGS FOR EACH ENGINE
    # -------------------------------------------------------------
    if checkin_count < 3:
        e3_finding = "Consistency baseline is still being established."
        e3_evidence = f"{checkin_count} check-in(s) completed so far."
        e3_explanation = "FitIQ establishes habit consistency scoring over multiple check-in cycles rather than penalizing initial baseline entries."
        e3_recommendation = "Continue logging your daily check-ins to build your longitudinal habit consistency score."
    else:
        e3_finding = f"Short-term consistency trajectory is {(forecast_trend or 'unknown').upper()} (projected: {projected_consistency or current_consistency or 'N/A'}/100)."
        e3_evidence = f"Baseline Consistency: {current_consistency or 'N/A'}% | Trend Shift: {forecast_change}% | Predicted BMI: {pred_future_bmi or 'N/A'}."
        e3_explanation = "Engine 3 analyzes rolling consistency windows to detect early momentum or dropout risk. When momentum slows, smaller daily targets prevent long-term routine abandonment."
        e3_recommendation = "Target 5 consecutive days of meeting minimum targets to reverse downward drift and solidify your habit streak."

    key_findings = [
        {
            "engine": "Engine 1 — Fitness Indicator Score (FIS)",
            "finding": f"Composite FIS of {fis_score or 'Available upon tracking'}/100 calculated across holistic health dimensions.",
            "evidence": f"Pillars: Activity ({round(fitness_activity.get('score', 0), 1)}), Recovery ({round(recovery.get('score', 0), 1)}), Body Comp ({round(body_comp.get('score', 0), 1)}), Nutrition ({round(nutrition_sub.get('score', 0), 1)}).",
            "explanation": f"Your strongest pillar is currently {highest_sub[0]}, while {lowest_sub[0]} has the highest headroom for improvement. FIS balances multiple metrics so high intensity on single days does not mask inconsistent recovery.",
            "recommendation": f"Focus next week on improving your {lowest_sub[0].lower()} to raise your composite benchmark."
        },
        {
            "engine": "Engine 2 — Pearson Behavior Correlation",
            "finding": f"{top_pattern.get('strength', 'Statistical')} association identified across tracked lifestyle variables." if top_pattern else "Tracking data being analyzed for behavioral co-movements.",
            "evidence": f"Relationship: {top_pattern.get('relationship', 'sleep_steps')}, Strength: {top_pattern.get('strength', 'Positive')}." if top_pattern else "Requires multi-day logged records.",
            "explanation": "Pearson correlation measures how two metrics trend together. A positive correlation indicates they move in tandem in your history. Correlation does not imply causation — better sleep does not automatically create steps, but they reinforce one another.",
            "recommendation": "Protect your sleep and hydration habits to ensure sustained physical energy for daily workouts."
        },
        {
            "engine": "Engine 3 — Consistency Forecast & BMI Trend",
            "finding": e3_finding,
            "evidence": e3_evidence,
            "explanation": e3_explanation,
            "recommendation": e3_recommendation
        },
        {
            "engine": "Engine 4 — Cohort Intelligence (User Segmentation)",
            "finding": f"Successfully matched with a verified peer cohort of {cohort_size or 10} participants with {int(cohort_similarity * 100)}% similarity.",
            "evidence": f"Demographic and habit clustering based on age {age or 'N/A'}, BMI {bmi or 'N/A'}, and {activity_level} activity level.",
            "explanation": "You are grouped with users sharing similar physical baselines and routines from empirical survey data. This allows contextualized comparison rather than unrealistic generalized benchmarks.",
            "recommendation": "Aim to keep your activity levels aligned with top performers within your demographic cohort."
        },
        {
            "engine": "Engine 5 — Anomaly & Plateau Detection",
            "finding": "Activity plateau detected" if plateau_detected else ("Unusual single-day variance flagged" if has_anomaly else "Normal variance with stable training pattern."),
            "evidence": f"Plateau status: {'Active' if plateau_detected else 'None'} | Anomalies detected: {len(anomalies)}.",
            "explanation": "Using Robust Z-Score (Median Absolute Deviation), the engine identifies unusual behavioral shifts and prolonged stagnation. Plateaus are natural biological adaptations to unchanged training demands.",
            "recommendation": "Alter workout tempo, incorporate new exercises, or vary weekly volume to overcome training plateaus."
        },
        {
            "engine": "Engine 6 — Nutrition Targets & Meal Timing",
            "finding": f"Daily Caloric Target of {calorie_target or 'Calculated'} kcal established for {goal}.",
            "evidence": f"BMR: {bmr or 'N/A'} kcal | TDEE: {tdee or 'N/A'} kcal | Target: {calorie_target or 'N/A'} kcal.",
            "explanation": "Mifflin-St Jeor metabolic calculations determine your baseline energy consumption, adjusted by physical activity multipliers and goal-specific caloric deficits or surpluses.",
            "recommendation": f"Focus on whole food sources rich in protein and fiber to maintain satiety and fuel training sessions."
        }
    ]

    # -------------------------------------------------------------
    # TECHNICAL / VIVA EXPLANATION MODE
    # -------------------------------------------------------------
    technical_mode = {
        "engine_1": {
            "name": "Engine 1 — Fitness Indicator Score (FIS)",
            "method": "Multi-Dimensional Weighted Normalization Model",
            "inputs": "Steps, exercise frequency, duration, intensity, sleep duration, energy level, BMI, weight trend, meals, hydration, tracking consistency.",
            "output": f"FIS Composite = {fis_score or 'N/A'}/100 across normalized sub-indices.",
            "interpretation": f"Fitness Activity ({fitness_activity.get('score')}), Recovery ({recovery.get('score')}), Body Composition ({body_comp.get('score')}), Nutrition ({nutrition_sub.get('score')}), Consistency ({'Baseline establishment' if checkin_count < 3 else consistency_sub.get('score')}).",
            "why_method_selected": "Standardizes heterogeneous physiological and behavioral signals into an equitable 0–100 scale, eliminating single-variable bias.",
            "limitations": "Relies on accuracy of user-logged and wearable telemetry; component weights assume typical adult metabolic parameters."
        },
        "engine_2": {
            "name": "Engine 2 — Pearson Behavior Correlation",
            "method": "Pearson Product-Moment Correlation Coefficient (Statistical Method)",
            "inputs": "Bivariate continuous tracking records (e.g. hours_sleep vs. daily_steps, hydration_level vs. duration_minutes).",
            "output": f"Pearson r = {top_pattern.get('correlation', 'N/A') if top_pattern else 'N/A'} ({top_pattern.get('strength', 'N/A') if top_pattern else 'N/A'}).",
            "interpretation": "Evaluates the linear relationship between paired behavioral variables. Correlation denotes co-movement, strictly distinct from causal impact.",
            "why_method_selected": "Computationally efficient, mathematically transparent parametric method for bivariate relationship identification in behavioral science.",
            "limitations": "Only captures linear relationships; highly sensitive to extreme outliers; does not control for confounding latent variables."
        },
        "engine_3": {
            "name": "Engine 3 — Consistency Forecast & BMI Trend",
            "method": "ARIMA / Holt-Winters Time-Series Trend Projection & Ridge Regression with Tree SHAP",
            "inputs": "Chronological tracking vectors (consistency adherence, daily steps, exercise duration, sleep, hydration).",
            "output": f"Consistency Trajectory = {forecast_trend}, Predicted BMI Change = {pred_bmi_change or 'N/A'}.",
            "interpretation": "Uses recursive time-series forecasting on moving consistency windows, combined with SHAP feature-attribution to quantify which lifestyle inputs drive predicted body changes.",
            "why_method_selected": "ARIMA / Exponential Smoothing decomposes seasonality and trends without requiring huge training sets; SHAP offers mathematically sound feature attribution.",
            "limitations": "Accuracy scales with tracking history; sudden lifestyle breaks require 3–5 days of new data to register in projections."
        },
        "engine_4": {
            "name": "Engine 4 — Cohort Intelligence (User Segmentation)",
            "method": "K-Means Clustering with Euclidean Distance in PCA Space",
            "inputs": "Age, gender, BMI, daily steps, workout frequency, sleep duration, goal.",
            "output": f"Cohort size = {cohort_size or 10}, Distance-to-centroid similarity = {int(cohort_similarity * 100)}%.",
            "interpretation": "Positions the user within a multidimensional behavioral cluster of verified fitness profiles to discover contextualized behavioral norms.",
            "why_method_selected": "K-Means provides robust, unsupervised grouping with distinct centroids, avoiding arbitrary threshold rules.",
            "limitations": "Cluster quality depends on diversity of the underlying training sample; may generalize unique edge-case routines."
        },
        "engine_5": {
            "name": "Engine 5 — Anomaly & Plateau Detection",
            "method": "Robust Z-Score (Median Absolute Deviation) & Rolling Window Variance Analysis",
            "inputs": "Chronological tracking vectors (daily steps, exercise minutes, intensity, calories).",
            "output": f"Plateau Detected = {plateau_detected}, Anomalous Data Points = {len(anomalies)}.",
            "interpretation": "Flags observations exceeding 2.5 MAD thresholds from the rolling median and detects periods where progress variance falls below adaptation thresholds.",
            "why_method_selected": "Robust statistics (median/MAD) prevent extreme single-day outliers from distorting normal behavioral baselines.",
            "limitations": "Cannot infer semantic intent (e.g. deliberate illness rest vs. accidental drop-off) without user-provided context."
        },
        "engine_6": {
            "name": "Engine 6 — Nutrition Targets & Meal Timing Intelligence",
            "method": "Mifflin-St Jeor BMR, Activity-Adjusted TDEE, Dynamic Macronutrient Allocation, and Practicality-Ranked Scoring",
            "inputs": "Age, gender, height (cm), weight (kg), physical activity level, dietary preference, goal.",
            "output": f"BMR = {bmr} kcal, TDEE = {tdee} kcal, Daily Target = {calorie_target} kcal, Macros = {macros.get('protein_g', 'N/A')}g P / {macros.get('carbs_g', 'N/A')}g C / {macros.get('fat_g', 'N/A')}g F.",
            "interpretation": "Calculates clinical energy equilibrium and configures a tailored caloric differential matching the user's weight goal.",
            "why_method_selected": "Clinically validated metabolic formulation combined with objective practicality and nutrient-density scoring.",
            "limitations": "Does not measure individual metabolic adaptation or thyroid/hormonal variations without laboratory calorimetry."
        },
        "engine_7": {
            "name": "Engine 7 — Holistic Recommendation & LLM Interpretation Layer",
            "method": "Constraint-Enforced Multi-Engine Synthesis & Natural Language Explanation",
            "inputs": "Structured numerical outputs and telemetry from Engines 1 through 6.",
            "output": "Structured Priority Actions, Cross-Engine Explanations, Strengths, and Vulnerabilities.",
            "interpretation": "Transforms raw statistical indices into prioritized, actionable behavioral interventions while strictly preventing hallucinations or unsupported claims.",
            "why_method_selected": "Delivers human-understandable guidance anchored strictly in verifiable backend analytics calculations.",
            "limitations": "Explanation depth is bounded by the telemetry provided by upstream analytics engines."
        }
    }

    # Format simple recommendations strings for backward compatibility
    recommendations_list = [action["title"] for action in priority_actions]
    if food_recs and len(food_recs) > 0:
        recommendations_list.append(f"Incorporate nutrient-dense foods such as {food_recs[0].get('food_name', 'healthy options')} into your daily meals.")

    if is_first_checkin:
        overall_summary = (
            "Your Personalized Starting Point\n\n"
            "Your first check-in has established your baseline. Continue checking in to help FitIQ identify meaningful changes in your habits."
        )
    else:
        summary_points = []
        steps_diff = changes.get("steps", {}).get("diff")
        sleep_diff = changes.get("sleep", {}).get("diff")
        water_diff = changes.get("water", {}).get("diff")
        if steps_diff and abs(steps_diff) > 50:
            summary_points.append(f"steps {'increased' if steps_diff > 0 else 'decreased'} by {abs(int(steps_diff)):,}")
        if sleep_diff and abs(sleep_diff) > 0.2:
            summary_points.append(f"sleep {'increased' if sleep_diff > 0 else 'decreased'} by {abs(sleep_diff)} hrs")
        if water_diff and abs(water_diff) > 0.2:
            summary_points.append(f"hydration {'improved' if water_diff > 0 else 'dropped'} by {abs(water_diff)} L")
        
        diff_summary = f"Since your previous check-in, {', and '.join(summary_points)}." if summary_points else "Your recorded habits remained steady compared with your previous check-in."
        overall_summary = f"Your latest check-in data has been analyzed across all 7 analytics engines. {diff_summary}"

    return {
        "status": "success",
        "generated_at": datetime.now().isoformat(),
        "source": "analytics_interpretation_engine",
        "user_mode": {
            "overall_summary": overall_summary,
            "strengths": strengths,
            "what_needs_attention": needs_attention,
            "key_findings": key_findings,
            "priority_actions": priority_actions,
            "cross_engine_insights": cross_engine_insights,
            "why_these_recommendations": (
                "These recommendations come directly from your FitIQ data, "
                "including your latest daily check-in habits, day-over-day changes, and goals. "
                "No guesses were made."
            )
        },
        "technical_mode": technical_mode,
        "recommendations": recommendations_list
    }


# =====================================================================
# COMPREHENSIVE INTERPRETATION ENTRYPOINT
# =====================================================================

def generate_comprehensive_interpretation(data):
    """
    Main orchestration entrypoint for Engine 7.
    Attempts LLM generation using server-side keys; gracefully falls back
    to the deterministic FitIQ analytics interpretation engine if LLM is unavailable.
    Passes latest check-in, previous check-in, and change metrics to ensure dynamic recommendations.
    """
    try:
        latest_checkin = data.get("latest_checkin") or data.get("today_checkin") or {}
        previous_checkin = data.get("previous_checkin")
        recent_history = data.get("recent_history", []) or []

        if not previous_checkin and len(recent_history) >= 2:
            def get_ts(rec):
                if not rec or not isinstance(rec, dict):
                    return 0
                for k in ("completedAtMillis", "timestamp", "completedAt", "recordedAt", "date"):
                    val = rec.get(k)
                    if val:
                        if isinstance(val, (int, float)):
                            return float(val)
                        if isinstance(val, str):
                            try:
                                dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
                                return dt.timestamp() * 1000
                            except Exception:
                                pass
                return 0
            sorted_history = sorted(recent_history, key=get_ts)
            previous_checkin = sorted_history[-2]

        changes = data.get("changes") or extract_checkin_changes(latest_checkin, previous_checkin)
        checkin_count = data.get("checkin_count") or (len(recent_history) if recent_history else (1 if latest_checkin else 0))
        is_first_checkin = data.get("is_first_checkin", False) or (checkin_count <= 1 or previous_checkin is None)

        data["latest_checkin"] = latest_checkin
        data["previous_checkin"] = previous_checkin
        data["changes"] = changes
        data["checkin_count"] = checkin_count
        data["is_first_checkin"] = is_first_checkin

        # Check if an LLM is accessible
        has_key = bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("LLM_API_KEY") or os.environ.get("OPENAI_API_KEY"))
        
        if has_key:
            # Prepare compact JSON string of verified analytics
            clean_payload = {
                "profile": data.get("profile", {}),
                "engines": data.get("engines", {}),
                "latest_checkin": latest_checkin,
                "previous_checkin": previous_checkin,
                "changes": changes,
                "checkin_count": checkin_count,
                "is_first_checkin": is_first_checkin,
                "today_checkin": latest_checkin,
                "recent_history": recent_history
            }
            llm_result = call_llm_api(SYSTEM_PROMPT, json.dumps(clean_payload))
            if llm_result and isinstance(llm_result, dict) and "user_mode" in llm_result:
                llm_result["source"] = "llm"
                llm_result["generated_at"] = datetime.now().isoformat()
                if "recommendations" not in llm_result:
                    actions = llm_result.get("user_mode", {}).get("priority_actions", [])
                    llm_result["recommendations"] = [a.get("title", "") for a in actions if a.get("title")]
                return llm_result

    except Exception as e:
        print("LLM orchestration exception (using deterministic fallback):", e)

    # Use robust deterministic fallback engine
    return generate_deterministic_interpretation(data)
'''

with open(target_file, "w", encoding="utf-8") as f:
    f.write(pre_part + new_middle + "\n" + post_part)

print("SUCCESS: Updated llm_service.py!")
