import { useState } from 'react';
import { ToastContainer, toast, Bounce } from 'react-toastify';

const CalorieCalculator = () => {
  const [formData, setFormData] = useState({
    age: '',
    gender: 'male',
    weight: '',
    height: '',
    activityLevel: '1.2',
    goal: 'maintain',
    macroSplit: 'balanced',
    calculationType: 'average',
    carbs: '0',
    protein: '0',
    fat: '0'
  });

  const [results, setResults] = useState(null);
  const [flippedCards, setFlippedCards] = useState({
    bmr: false,
    tdee: false
  });

  const activityLevels = {
    '1.2': 'Sedentary (little or no exercise)',
    '1.375': 'Lightly active (light exercise 1-3 days/week)',
    '1.55': 'Moderately active (moderate exercise 3-5 days/week)',
    '1.725': 'Very active (hard exercise 6-7 days/week)',
    '1.9': 'Extremely active (very hard exercise, physical job)'
  };

  const goals = {
    'lose': { label: 'Lose weight', modifier: 0.9 },
    'maintain': { label: 'Maintain weight', modifier: 1 },
    'gain': { label: 'Gain weight', modifier: 1.1 }
  };

  const macroSplits = {
    'customized': {
      label: 'Customized',
      carbs: 0.0, protein: 0.0, fat: 0.0
    },
    'balanced': {
      label: 'Balanced (40% Carbs, 30% Protein, 30% Fat)',
      carbs: 0.4, protein: 0.3, fat: 0.3
    },
    'lowCarb': {
      label: 'Low Carb (20% Carbs, 40% Protein, 40% Fat)',
      carbs: 0.2, protein: 0.4, fat: 0.4
    },
    'highProtein': {
      label: 'High Protein (30% Carbs, 45% Protein, 25% Fat)',
      carbs: 0.3, protein: 0.45, fat: 0.25
    },
    'keto': {
      label: 'Ketogenic (5% Carbs, 25% Protein, 70% Fat)',
      carbs: 0.05, protein: 0.25, fat: 0.7
    }
  };

  const validateNumericFields = (name, target) => {
    const { value, min, max } = target;
    const numericFields = ['age', 'weight', 'height', 'carbs', 'protein', 'fat'];
    let newValue = value;

    if (numericFields.includes(name)) {
      const num = parseFloat(value);

      // Field-specific validation
      if (num < min || num > max) return '';
      // if ((name === 'weight' || name === 'height') && (num < 1 || num > 300)) return;

      // Save valid number or empty value (for clearing input)
      newValue = value === '' ? '' : num;
    }
    return newValue;
  }

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      calculationType: 'average',
    }));

    setResults(null);
    setFlippedCards({ bmr: false, tdee: false });

    // Convert to number only for numeric fields
    const { name } = e.target;
    const newValue = validateNumericFields(name, e.target);

    setFormData((prev) => ({
      ...prev,
      [name]: newValue
    }));
  };

  const proceedMacrosValue = (weight, gender, calories, split) => {
    let carb, fat, protein;
    if (split.label.toLowerCase() === 'customized') {
      protein = weight * split.protein * 4;
      if (gender === 'male') {
        carb = weight * split.carbs * 4;

        fat = (!split.fat || parseFloat(split.fat) === 0)
          ? calories - (protein + carb)
          : weight * split.fat * 9;
      }
      else {
        carb = (!split.carbs || parseFloat(split.carbs) === 0)
          ? calories - (protein + fat)
          : weight * split.carbs * 4;

        fat = weight * split.fat * 9;
      }
    }
    else {
      carb = calories * split.carbs;
      protein = calories * split.protein;
      fat = calories * split.fat;
    }
    return {
      carbCalories: carb,
      proteinCalories: protein,
      fatCalories: fat
    }
  }

  const calculateMacros = (calories, split) => {
    const macrosType = split.label.toLowerCase();
    const macrosCalories = proceedMacrosValue(formData.weight, formData.gender, calories, split);
    if (macrosCalories.fatCalories / 9 < 50) {
      notify('Be careful, you should consume at least 50g of fat per day.')
    }

    return {
      carbs: {
        grams: Math.round(macrosCalories.carbCalories / 4), // 4 calories per gram
        calories: Math.round(macrosCalories.carbCalories),
        percentage: macrosType === 'customized'
          ? Math.round(macrosCalories.carbCalories / calories * 100)
          : Math.round(split.carbs * 100)
      },
      protein: {
        grams: Math.round(macrosCalories.proteinCalories / 4), // 4 calories per gram
        calories: Math.round(macrosCalories.proteinCalories),
        percentage: macrosType === 'customized'
          ? Math.round(macrosCalories.proteinCalories / calories * 100)
          : Math.round(split.protein * 100)
      },
      fat: {
        grams: Math.round(macrosCalories.fatCalories / 9), // 9 calories per gram
        calories: Math.round(macrosCalories.fatCalories),
        percentage: macrosType === 'customized'
          ? Math.round(macrosCalories.fatCalories / calories * 100)
          : Math.round(split.fat * 100)
      }
    };
  };

  function getRestDayCoeff(trainingCoeff) {
    if (trainingCoeff <= 1.2) return 1.2;
    else if (trainingCoeff <= 1.375) return trainingCoeff - 0.1;
    else if (trainingCoeff <= 1.55) return trainingCoeff - 0.15;
    else if (trainingCoeff <= 1.725) return trainingCoeff - 0.2;
    else if (trainingCoeff <= 1.9) return trainingCoeff - 0.35;
    else return 1.2; // fallback
  }

  const notify = (text) => toast.error(text, {
    position: "top-center",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
    transition: Bounce,
  });

  const proceedCustomizedMacros = (macrosName, macrosValue, isFocused) => {
    if (isFocused && (!macrosValue || parseFloat(macrosValue) === 0)) {
      notify('Please fill ' + macrosName + ' coeff')
      return false;
    }
    else {
      macrosName === 'protein'
        ? macroSplits['customized'].protein = macrosValue
        : macrosName === 'carbs'
          ? macroSplits['customized'].carbs = macrosValue
          : macroSplits['customized'].fat = macrosValue;
    }
    return true;
  }

  const notifyOnError = (props) => {
    if (!props.age || !props.weight || !props.height) {
      notify('Please fill in all required fields')

      return false;
    }
    if (props.macroSplit === 'customized') {
      const proteinMacros = proceedCustomizedMacros('protein', props.protein, true);
      const carbsMacros = proceedCustomizedMacros('carbs', props.carbs, props.gender === 'male');
      const fatMacros = proceedCustomizedMacros('fat', props.fat, props.gender === 'female');

      return proteinMacros && carbsMacros && fatMacros;
    }
    return true;
  }

  const calculateCalories = () => {
    const { age, gender, weight, height, activityLevel, goal, macroSplit, calculationType } = formData;

    // Validate required fields before calculation

    if (!notifyOnError(formData)) { return; }

    // Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
    // This represents calories burned at complete rest
    let bmr;
    if (gender === 'male') {
      // Male BMR formula: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
      bmr = (10 * parseFloat(weight)) + (6.25 * parseFloat(height)) - (5 * parseFloat(age)) + 5;
    } else {
      // Female BMR formula: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
      bmr = (10 * parseFloat(weight)) + (6.25 * parseFloat(height)) - (5 * parseFloat(age)) - 161;
    }

    // Calculate TDEE (Total Daily Energy Expenditure) = BMR × Activity Level
    // This represents total calories burned including daily activities
    const tdee = bmr * parseFloat(activityLevel);

    // Adjust calories based on user's goal (lose/maintain/gain weight)
    // Lose: -500 cal/day (≈1 lb/week), Maintain: no change, Gain: +500 cal/day (≈1 lb/week)
    const targetCalories = tdee * goals[goal].modifier;

    // Get the selected macronutrient split ratios
    const split = macroSplits[macroSplit];

    if (calculationType === 'average') {
      // Single daily target - same calories every day
      const macros = calculateMacros(targetCalories, split);
      const macrosCalories = macros.carbs.calories + macros.protein.calories + macros.fat.calories;
      const calucaltedCalories = (split.label.toLowerCase() === 'customized' && macrosCalories !== targetCalories)
        ? macrosCalories
        : targetCalories;

      setResults({
        type: 'average',
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targetCalories: Math.round(calucaltedCalories),
        goal: goals[goal].label,
        macros,
        splitLabel: split.label
      });
    } else {
      // Split calculation: exercise days vs rest days
      // Exercise days: Use the selected activity level (represents training days)
      // Rest days: Use sedentary level (1.2) as baseline for non-training days
      const exerciseMultiplier = parseFloat(activityLevel);
      const restMultiplier = getRestDayCoeff(exerciseMultiplier); // Sedentary level for rest days

      // Calculate TDEE for each day type
      const exerciseTdee = tdee;
      const restTdee = bmr * restMultiplier;

      // Apply goal modifier to both day types
      const exerciseCalories = exerciseTdee * goals[goal].modifier;
      const restCalories = restTdee * goals[goal].modifier;

      // Calculate macronutrient breakdown for each day type
      const exerciseMacros = calculateMacros(exerciseCalories, split);
      const restMacros = calculateMacros(restCalories, split);

      setResults({
        type: 'split',
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        goal: goals[goal].label,
        splitLabel: split.label,
        exercise: {
          calories: Math.round(exerciseCalories),
          tdee: Math.round(exerciseTdee),
          macros: exerciseMacros
        },
        rest: {
          calories: Math.round(restCalories),
          tdee: Math.round(restTdee),
          macros: restMacros
        }
      });
    }
  };

  const resetForm = () => {
    setFormData({
      age: '',
      gender: 'male',
      weight: '',
      height: '',
      activityLevel: '1.2',
      goal: 'maintain',
      macroSplit: 'balanced',
      calculationType: 'average',
      carbs: '',
      protein: '',
      fat: ''
    });
    setResults(null);
    setFlippedCards({ bmr: false, tdee: false });
  };

  const toggleCard = (cardType) => {
    setFlippedCards(prev => ({
      ...prev,
      [cardType]: !prev[cardType]
    }));
  };

  const checkIfCustomizedChoosen = () => {
    return formData.macroSplit !== 'customized' ||
    (formData.gender === 'male' && (!formData.fat || parseFloat(formData.fat) === 0)) ||
    (formData.gender === 'female' && (!formData.carbs || parseFloat(formData.carbs) === 0))
  }

  const MacroCard = ({ title, macro, color }) => (
    <div className={`macro-card ${color}`}>
      <h4>{title}</h4>
      <div className="macro-value">{macro.grams}g</div>
      <div className="macro-details">
        <span>{macro.calories} cal</span>
        <span>{macro.percentage}%</span>
      </div>
    </div>
  );

  const DayResults = ({ title, data, className = "" }) => (
    <div className={`day-results ${className}`}>
      <h3>{title}</h3>
      <div className="calories-display">
        <span className="calories-number">{data.calories}</span>
        <span className="calories-label">calories/day</span>
      </div>
      <div className="macros-grid">
        <MacroCard title="Carbs" macro={data.macros.carbs} color="carbs" />
        <MacroCard title="Protein" macro={data.macros.protein} color="protein" />
        <MacroCard title="Fat" macro={data.macros.fat} color="fat" />
      </div>
    </div>
  );

  return (
    <div className="calculator-container">
      <div className="calculator-card">
        <div className="header">
          <h1>Advanced Calorie & Macro Calculator</h1>
          <p>Calculate your daily caloric needs and macronutrient breakdown based on your goals</p>
        </div>

        <form className="calculator-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="age">Age *</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="Enter your age"
                min="1"
                max="120"
                className='no-spinner'
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="weight">Weight (kg) *</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="Enter your weight"
                min="1"
                max="300"
                step="0.1"
                className='no-spinner'
              />
            </div>

            <div className="form-group">
              <label htmlFor="height">Height (cm) *</label>
              <input
                type="number"
                id="height"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                placeholder="Enter your height"
                min="1"
                max={300}
                step="0.1"
                className='no-spinner'
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="activityLevel">Activity Level</label>
            <select
              id="activityLevel"
              name="activityLevel"
              value={formData.activityLevel}
              onChange={handleInputChange}
            >
              {Object.entries(activityLevels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="goal">Goal</label>
              <select
                id="goal"
                name="goal"
                value={formData.goal}
                onChange={handleInputChange}
              >
                {Object.entries(goals).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="macroSplit">Macro Split</label>
              <select
                id="macroSplit"
                name="macroSplit"
                value={formData.macroSplit}
                onChange={handleInputChange}
              >
                <optgroup label="User engaged">
                  <option value="customized">{macroSplits["customized"].label}</option>
                </optgroup>

                <optgroup label="Pre-defined">
                  {Object.entries(macroSplits)
                    .filter(([key]) => key !== "customized")
                    .map(([value, { label }]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>
          </div>

          {formData.macroSplit === 'customized' && (
            <div className='customized-macros'>
              <div className='macros-grid'>
                <div className='form-group'>
                  <label htmlFor='carbs'>Carbs *</label>
                  <input
                    type="number"
                    id="carbs"
                    name="carbs"
                    onChange={handleInputChange}
                    placeholder="Enter carbs coeff"
                    value={formData.carbs}
                    min="0"
                    max="10"
                    step="0.1"
                    className='no-spinner'
                  />
                </div>
                <div className='form-group'>
                  <label htmlFor='protein'>Protein *</label>
                  <input
                    type="number"
                    id="protein"
                    name="protein"
                    onChange={handleInputChange}
                    placeholder="Enter protein coeff"
                    value={formData.protein}
                    min="0"
                    max="5"
                    step="0.1"
                    className='no-spinner'
                  />
                </div>
                <div className='form-group'>
                  <label htmlFor='fat'>Fat *</label>
                  <input
                    type="number"
                    id="fat"
                    name="fat"
                    onChange={handleInputChange}
                    placeholder="Enter fat coeff"
                    value={formData.fat}
                    min="0"
                    max="2"
                    step="0.1"
                    className='no-spinner'
                  />
                </div>
              </div>

              <div className="disclaimer">
                {
                  formData.gender === 'male'
                  && (
                    <p>
                      <strong>Male. </strong>
                      Left Fats coeff empty or zero to use predefined calculation formula:
                      <br />Fat calories = Total calories - (Protein calories + Carbs calories)
                    </p>
                  )
                  || (
                    <p>
                      <strong>Female. </strong>
                      Left Carbs coeff empty or zero to use predefined calculation formula:
                      <br />Carbs calories = Total calories - (Protein calories + Fat calories)
                    </p>
                  )
                }
              </div>
            </div>
          )}

          {(formData.activityLevel !== '1.2'
            && checkIfCustomizedChoosen()) && (
              <div className="form-group">
                <label htmlFor="calculationType">Calculation Type</label>
                <select
                  id="calculationType"
                  name="calculationType"
                  value={formData.calculationType}
                  onChange={handleInputChange}
                >
                  <option value="average">Average Daily Intake</option>
                  <option value="split">Split: Exercise Days vs Rest Days</option>
                </select>
              </div>
            )}

          <div className="button-group">
            <button type="button" onClick={calculateCalories} className="calculate-btn">
              Calculate Nutrition Plan
            </button>
            <button type="button" onClick={resetForm} className="reset-btn">
              Reset
            </button>
          </div>
        </form>

        {results && (
          <div className="results-section">
            <h2>Your Nutrition Plan</h2>

            <div className="basic-results">
              <div
                className={`basic-result-card flip-card ${flippedCards.bmr ? 'flipped' : ''}`}
                onClick={() => toggleCard('bmr')}
              >
                <div className="flip-card-inner">
                  <div className="flip-card-front">
                    <h3>BMR</h3>
                    <p className="result-value">{results.bmr}</p>
                    <p className="result-label">calories/day</p>
                    <p className="flip-hint">Click to learn more</p>
                  </div>
                  <div className="flip-card-back">
                    <h4>Basal Metabolic Rate</h4>
                    <p className="flip-description">Calories needed for basic body functions at rest</p>
                    <p className="flip-note">Uses Mifflin-St Jeor formula</p>
                    <p className="flip-hint">Click to go back</p>
                  </div>
                </div>
              </div>

              <div
                className={`basic-result-card flip-card ${flippedCards.tdee ? 'flipped' : ''}`}
                onClick={() => toggleCard('tdee')}
              >
                <div className="flip-card-inner">
                  <div className="flip-card-front">
                    <h3>TDEE</h3>
                    <p className="result-value">{results.tdee}</p>
                    <p className="result-label">calories/day</p>
                    <p className="flip-hint">Click to learn more</p>
                  </div>
                  <div className="flip-card-back">
                    <h4>Total Daily Energy Exp.</h4>
                    <p className="flip-description">BMR × activity level = total daily calories burned</p>
                    <p className="flip-note">Maintains current weight</p>
                    <p className="flip-hint">Click to go back</p>
                  </div>
                </div>
              </div>

              <div className="basic-result-card primary">
                <h3>Goal</h3>
                <p className="result-text">{results.goal}</p>
                <p className="result-label">{results.splitLabel}</p>
              </div>
            </div>

            {results.type === 'average' ? (
              <DayResults
                title="Daily Nutrition Target"
                data={{ calories: results.targetCalories, macros: results.macros }}
                className="single-day"
              />
            ) : (
              <div className="split-results">
                <DayResults
                  title="Exercise Days"
                  data={results.exercise}
                  className="exercise-day"
                />
                <DayResults
                  title="Rest Days"
                  data={results.rest}
                  className="rest-day"
                />
              </div>
            )}

            <div className="info-section">
              <h3>Understanding Your Macronutrients</h3>
              <div className="macro-info">
                <div className="macro-info-item carbs">
                  <h4>Carbohydrates</h4>
                  <p>Primary energy source for your body and brain. 4 calories per gram.</p>
                </div>
                <div className="macro-info-item protein">
                  <h4>Protein</h4>
                  <p>Essential for muscle building, repair, and maintenance. 4 calories per gram.</p>
                </div>
                <div className="macro-info-item fat">
                  <h4>Fats</h4>
                  <p>Important for hormone production and nutrient absorption. 9 calories per gram.</p>
                </div>
              </div>

              <div className="disclaimer">
                <p><strong>Disclaimer:</strong> This calculator provides estimates based on standard formulas. Individual needs may vary based on genetics, medical conditions, and other factors. Consult with a healthcare professional or registered dietitian for personalized nutrition advice.</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />
    </div>
  );
};

export default CalorieCalculator;