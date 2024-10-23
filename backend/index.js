import express from 'express'
import dotenv from "dotenv";
import { applyRule, createRule } from './controllers/ruleController.js';
import connectDB from './dbConfig.js';
import cors from 'cors'

dotenv.config()
const app = express();
app.use(express.json());
app.use(cors())
connectDB()



// Express API endpoints


app.post('/api/rules', createRule);

app.post('/api/evaluate', applyRule);

app.listen(8000, () => {
    console.log('Rule engine server running on port 3000');
});


