import dotenv from "dotenv";
import Groq from "groq-sdk";
import readline from "node:readline/promises";

// configure :
dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// global constant (for manipulating data like DB):
const expenseDB = [];
const incomeDB = [];

async function callAgent() {
  // interface for readline:
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // dynamic messages array:
  const messages = [
    {
      role: "system",
      content: `You are josh, a personal finance assisatance. You need to assis user with their expenses, balances and financial planning. 
      You have access to following tools:
      1. getTotalExpense({fromDate, toDate}): string // get total expense for a time period between fromDate and toDate. 
      2. addExpense({name, amount}): string // adds new expense to the expenseDatabase, where name is the name of the product or entity and amount is the amount spend on the product or entity. 
      3. addIncome({name, amount}): string // adds new income to the incomeDatabase, where name is the source of the amount generated and amount is the amount received from the source. 
      4. addIncome(): string // Get the remaining money balance from the database. 
      Current datetime: ${new Date().toUTCString()}`,
    },
  ];

  // Loop for user propmt loop:
  while (true) {
    const question = await rl.question("USER: ");

    if (question === "stop") break; // to break question loop and end.

    // push to message array
    messages.push({
      role: "user",
      content: question,
    });

    // Loop for agent bases on question:
    // repeat the process in loop:
    while (true) {
      const completion = await groq.chat.completions.create({
        messages: messages,
        model: "llama-3.3-70b-versatile",
        tools: [
          {
            type: "function",
            function: {
              name: "getTotalExpense",
              description: "Get total expense from fromDate to toDate.",
              parameters: {
                type: "object",
                properties: {
                  fromDate: {
                    type: "string",
                    description: "from date to get the expenses.",
                  },
                  toDate: {
                    type: "string",
                    description: "to date to get the expenses.",
                  },
                },
              },
            },
          },
          {
            type: "function",
            function: {
              name: "addIncome",
              description: "Add new income entry to income database",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description:
                      "Name of the source of income. e.g., Income from freelancing, Income from office, salary credited",
                  },
                  amount: {
                    type: "string",
                    description: "Amount of the income.",
                  },
                },
              },
            },
          },
          {
            type: "function",
            function: {
              name: "addExpenses",
              description: "Add new expense entry to expense database",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description:
                      "Name of the expense. e.g., Purchase an Iphone",
                  },
                  amount: {
                    type: "string",
                    description: "Amount of the expense.",
                  },
                },
              },
            },
          },
          {
            type: "function",
            function: {
              name: "getMoneyBalance",
              description: "Get the remaining money balance from the database",
              
            },
          },
        ],
      });

      // console.log(JSON.stringify(completion.choices[0], null, 2));`

      // update messages array[]: for history
      messages.push(completion.choices[0]?.message);

      // check tool calls:
      const toolCalls = completion?.choices[0]?.message.tool_calls;

      // if !toolCalls -> we get final ans:
      if (!toolCalls) {
        console.log(`ASSISTANT: ${completion?.choices[0]?.message.content}`);
        break; // break and exit the loop when final result is received.
      }

      // get result -> using function calls:
      // there can be multiple tools (i.e. toolCalls is [{},{},{}...]) -> so loop them and use:

      for (const tool of toolCalls) {
        const functionName = tool.function.name;
        const functionArg = tool.function.arguments;

        let result = "";

        if (functionName === "getTotalExpense") {
          result = getTotalExpense(JSON.parse(functionArg));
        } else if (functionName === "addExpenses") {
          result = addExpenses(JSON.parse(functionArg));
        }
        else if (functionName === "addIncome") {
          result = addIncome(JSON.parse(functionArg));
        }
        else if (functionName === "getMoneyBalance") {
          result = getMoneyBalance();
        }

        // add result in message history:
        messages.push({
          role: "tool",
          content: result,
          tool_call_id: tool.id,
        });

        //   console.log("ANSWER--------------->");
        //   console.log(JSON.stringify(completion2.choices[0], null, 2));

        // console.log("Messages------------->");
        // console.log(messages);

        // console.log("Expense DataBase------------>");
        // console.log(expenseDB);
      }
    }
  }
  // close rl:
  rl.close();
}

await callAgent();

/*
 * GET Total Expenses
 */

function getTotalExpense({ fromDate, toData }) {

  // In REALITY -> call db and calculate expense fromDate to toDate:

  const expense = expenseDB.reduce((acc, item) => {
    return acc + item.amount;
  }, 0);

  return `${expense} INR`;
}

/*
 * ADD EXPENSES FUNCTION
 */

function addExpenses({ name, amount }) {
  expenseDB.push({ name, amount });

  return "Added to the expense database";
}

/* 
* ADD INCOME 
*/

function addIncome({ name, amount }) {
  incomeDB.push({ name, amount });

  return "Added to the income database";
}

/* 
* Get MOney Balance
*/

function getMoneyBalance() {

    const totalIncome = incomeDB.reduce((acc,item) => acc+item.amount,0);
    const totalExpense = expenseDB.reduce((acc,item) => acc+item.amount,0);

  return `${totalIncome - totalExpense} INR`;
}

