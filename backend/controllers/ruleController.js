import { Rule } from "../models/ruleModel.js";
import { create_rule, combine_rules, evaluate_rule } from "../ruleengine.js";
export const createRule = async (req, res) => {
    try {
        const { name, description, ruleString } = req.body;
        console.log(ruleString)
        const ast = create_rule(ruleString);
        console.log(ast)
        const rule = new Rule({
            name,
            description,
            ast
        });

        await rule.save();
        res.json(rule);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export const applyRule = async (req, res) => {
    try {
        const { ruleIds, data } = req.body;

        const rules = await Rule.find({ _id: { $in: ruleIds } });
        const ruleStrings = rules.map(rule => rule.ast);
        console.log(rules)
        const combinedAst = combine_rules(ruleStrings);

        const result = evaluate_rule(rules[0].ast, data);
        console.log(result)
        res.json({ eligible: result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}