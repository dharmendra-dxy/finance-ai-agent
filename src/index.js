import dotenv from 'dotenv';
import Groq from "groq-sdk";

// configure :
dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAgent(){
    const completion = await groq.chat.completions
    .create({
      messages: [
        {
            role: 'system',
            content: 'You are josh, a personal finance assisatance. You need to assis user with their expenses, balances and financial planning.'
        },
        {
          role: "user",
          content: "How much i have spend this month ?",
        },
      ],
      model: "llama-3.3-70b-versatile",
      tools:[
        {
            type: 'function',
            function: {
                name: 'getTotalExpense',
                description: 'Get total expense from fromDate to toDate.',
                parameters: {
                    type: 'object',
                    properties: {
                        fromDate:{
                            type: 'string',
                            description: 'from date to get the expenses.'
                        },
                        toDate:{
                            type: 'string',
                            description: 'to date to get the expenses.'
                        }
                    }
                }
            }
        }
      ]
    })

    console.log(JSON.stringify(completion.choices[0],null,2));
}

await callAgent();

/* 
    * GET Total Expenses
*/

function getTotalExpense({fromDate, toData}){

    // In REALITY -> call db and calculate expense fromDate to toDate:
    return 10000;
}

