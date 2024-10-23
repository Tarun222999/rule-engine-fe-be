import { useState } from 'react';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

const App = () => {
  const [screen, setScreen] = useState('create');
  const [rule, setRule] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [currentRuleId, setCurrentRuleId] = useState(null);

  const validateRule = (ruleString) => {
    const errors = [];

    if (!ruleString.trim()) {
      errors.push('Rule cannot be empty');
      return errors;
    }

    const stack = [];
    for (let char of ruleString) {
      if (char === '(') stack.push(char);
      if (char === ')') {
        if (stack.length === 0) {
          errors.push('Unmatched closing parenthesis');
          break;
        }
        stack.pop();
      }
    }
    if (stack.length > 0) {
      errors.push('Unmatched opening parenthesis');
    }

    const validOperators = ['AND', 'OR', '=', '>', '<', '>=', '<=', '!='];
    const words = ruleString.split(/\s+/);

    if (!validOperators.some(op => ruleString.includes(op))) {
      errors.push('Rule must contain at least one valid operator (AND, OR, =, >, <, >=, <=, !=)');
    }

    for (let i = 0; i < words.length - 1; i++) {
      const current = words[i].toUpperCase();
      const next = words[i + 1].toUpperCase();
      if (current === 'AND' && next === 'OR' || current === 'OR' && next === 'AND') {
        errors.push('Invalid operator combination (AND OR or OR AND)');
      }
    }

    const quoteCount = (ruleString.match(/'/g) || []).length;
    if (quoteCount % 2 !== 0) {
      errors.push('Unmatched quotes in string values');
    }

    return errors;
  };

  const handleRuleChange = (e) => {
    const newRule = e.target.value;
    // Remove all \n characters and normalize whitespace
    const cleanRule = newRule.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
    setRule(cleanRule);
    setValidationErrors(validateRule(cleanRule));
  };

  const handleRuleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateRule(rule);
    setValidationErrors(errors);

    if (errors.length > 0) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Rule',
          description: 'Test Rule Description',
          ruleString: rule,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create rule');
      }

      const data = await response.json();
      setCurrentRuleId(data._id); // Save the created rule ID
      setScreen('evaluate');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();

    if (!currentRuleId) {
      setError('No rule available for evaluation');
      return;
    }

    try {
      let parsedData = {};
      try {
        parsedData = JSON.parse(jsonData);
      } catch (err) {
        throw new Error('Invalid JSON data');
      }

      const response = await fetch('http://localhost:8000/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ruleIds: [currentRuleId], // Send the current rule ID
          data: parsedData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate rule');
      }

      const data = await response.json();
      setResult(data.eligible);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = () => {
    setScreen('create');
    setRule('');
    setJsonData('');
    setResult(null);
    setError('');
    setValidationErrors([]);
    setCurrentRuleId(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800">Rule Engine</h1>
          <p className="text-gray-600 mt-1">Create and evaluate business rules</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Create Rule Screen */}
        {screen === 'create' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Rule</h2>
            <form onSubmit={handleRuleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Rule Expression
                </label>
                <textarea
                  value={rule}
                  onChange={handleRuleChange}
                  className={`w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.length > 0 ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Example: (age > 30 AND department = 'Sales') OR (experience > 5)"
                />
                {validationErrors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {validationErrors.map((error, index) => (
                      <p key={index} className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={validationErrors.length > 0}
                className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${validationErrors.length > 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* Evaluate Rule Screen */}
        {screen === 'evaluate' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Evaluate Rule</h2>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Current Rule:</p>
              <p className="text-gray-800 mt-1">{rule}</p>
            </div>
            <form onSubmit={handleEvaluate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter JSON Data
                </label>
                <textarea
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={'{\n  "age": 35,\n  "department": "Sales",\n  "experience": 6\n}'}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Evaluate
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
                >
                  Start Over
                </button>
              </div>
            </form>

            {/* Result Display */}
            {result !== null && (
              <div className={`mt-6 p-4 rounded-lg flex items-center gap-2 ${result ? 'bg-green-50' : 'bg-red-50'}`}>
                {result ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <p className={result ? 'text-green-700' : 'text-red-700'}>
                  Rule evaluation: {result ? 'Success' : 'Failure'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;