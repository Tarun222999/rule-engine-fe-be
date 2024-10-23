// Data structures and types
export class Node {
    constructor(type, value = null, left = null, right = null) {
        this.type = type;  // 'operator' or 'operand'
        this.value = value;
        this.left = left;
        this.right = right;
    }
}

export function tokenize(ruleString) {
    const tokens = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < ruleString.length; i++) {
        const char = ruleString[i];
        // Handle quotes
        if (char === "'") {
            inQuotes = !inQuotes;
            current += char;
            continue;
        }
        // If we're in quotes, keep adding characters
        if (inQuotes) {
            current += char;
            continue;
        }
        if (char === ' ' && !inQuotes) {
            if (current) {
                tokens.push(current);
                current = '';
            }
            continue;
        }
        if ('()'.includes(char)) {
            if (current) {
                tokens.push(current);
                current = '';
            }
            tokens.push(char);
            continue;
        }
        if ('><!'.includes(char)) {
            if (current) {
                tokens.push(current);
                current = '';
            }
            // Look ahead for compound operators (>=, <=, !=)
            if (i + 1 < ruleString.length && '=' === ruleString[i + 1]) {
                tokens.push(char + '=');
                i++; // Skip next character
            } else {
                tokens.push(char);
            }
            continue;
        }
        current += char;
    }
    if (current) {
        tokens.push(current);
    }
    return tokens.filter(token => token.trim() !== '');
}

export function parse(tokens) {
    let position = 0;
    function parseExpression() {
        let left = parseCondition();
        while (position < tokens.length && ['AND', 'OR'].includes(tokens[position])) {
            const operator = tokens[position];
            position++;
            const right = parseCondition();
            left = new Node('operator', operator, left, right);
        }
        return left;
    }
    function parseCondition() {
        if (tokens[position] === '(') {
            position++; // Skip opening parenthesis
            const expr = parseExpression();
            if (position < tokens.length && tokens[position] === ')') {
                position++; // Skip closing parenthesis
            }
            return expr;
        }
        // Parse simple condition
        const field = tokens[position++];
        const operator = tokens[position++];
        let value = tokens[position++];
        // Clean up string values
        if (typeof value === 'string' && value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
        }
        return new Node('operand', {
            field,
            operator,
            value: isNaN(value) ? value : Number(value)
        });
    }
    return parseExpression();
}

export function create_rule(rule_string) {
    const tokens = tokenize(rule_string);
    return parse(tokens);
}

export function combine_rules(rules) {
    if (rules.length === 0) return null;
    if (rules.length === 1) return create_rule(rules[0]);
    const nodes = rules.map(rule => create_rule(rule));
    return nodes.reduce((combined, node) =>
        new Node('operator', 'AND', combined, node)
    );
}

export function evaluate_rule(ast, data) {
    function evaluate_node(node) {
        if (!node) return true;
        if (node.type === 'operator') {
            const left = evaluate_node(node.left);
            const right = evaluate_node(node.right);
            if (node.value === 'AND') return left && right;
            if (node.value === 'OR') return left || right;
            throw new Error(`Unknown logical operator: ${node.value}`);
        }
        // Operand node
        const { field, operator, value } = node.value;
        const fieldValue = data[field];
        switch (operator) {
            case '>': return fieldValue > value;
            case '<': return fieldValue < value;
            case '=': return fieldValue === value;
            case '>=': return fieldValue >= value;
            case '<=': return fieldValue <= value;
            case '!=': return fieldValue !== value;
            default: throw new Error(`Unknown comparison operator: ${operator}`);
        }
    }
    return evaluate_node(ast);
}
function runTests() {
    console.log('Running tests...');

    // // Test case 1: Simple rule
    // const rule1 = "age > 30 AND department = 'Marketing'";
    // console.log('\nTesting rule 1:', rule1);
    // const ast1 = create_rule(rule1);
    // console.log('AST 1:', JSON.stringify(ast1, null, 2));

    // Test case 2: Complex rule with nested conditions
    const rule2 = "((age > 30 AND department = 'Sales') OR (age < 25 AND department = 'Marketing')) AND (salary > 50000 OR experience > 5)";
    console.log('\nTesting rule 2:', rule2);
    const ast2 = create_rule(rule2);
    console.log('AST 2:', JSON.stringify(ast2, null, 2));

    // Test evaluation
    const testData = {
        "age": 35,
        "department": "Sales",
        "salary": 60000,
        "experience": 3
    }
    // console.log('\nTest data:', testData);
    // console.log('Rule 1 evaluation:', evaluate_rule(ast1, testData));
    console.log('Rule 2 evaluation:', evaluate_rule(ast2, testData));

    // // Test case 3: Testing different operators
    // const rule3 = "salary >= 20000 AND age <= 40 AND department != 'Sales'";
    // console.log('\nTesting rule 3:', rule3);
    // const ast3 = create_rule(rule3);
    // console.log('AST 3:', JSON.stringify(ast3, null, 2));
    // console.log('Rule 3 evaluation:', evaluate_rule(ast3, testData));
}

//runTests()