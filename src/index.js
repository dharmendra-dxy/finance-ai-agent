import dotenv from "dotenv";
import Groq from "groq-sdk";

// configure :
dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


// global constant (for manipulating data like DB):
const expenseDB = [];


async function callAgent() {
  // dynamic messages array:
  const messages = [
    {
      role: "system",
      content: `You are josh, a personal finance assisatance. You need to assis user with their expenses, balances and financial planning. Current datetime: ${new Date().toUTCString()}`,
    },
  ];

  messages.push({
    role: "user",
    content: "Hey, I have just bought an Macbook worth 50000.",
  });

  // Need to repeat the process in loop:
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
            name: "addExpenses",
            description: "Add new expense entry to expense database",
            parameters: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Name of the expense. e.g., Purchase an Iphone",
                },
                amount: {
                  type: "string",
                  description: "Amount of the expense.",
                },
              },
            },
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
      console.log(`Assistant: ${completion?.choices[0]?.message.content}`);
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
      }

      else if (functionName === "addExpenses") {
        result = addExpenses(JSON.parse(functionArg));
      }

      // add result in message history:
      messages.push({
        role: "tool",
        content: result,
        tool_call_id: tool.id,
      });

    //   console.log("ANSWER--------------->");
    //   console.log(JSON.stringify(completion2.choices[0], null, 2));

      console.log("Messages------------->");
      console.log(messages);

      console.log("Expense DataBase------------>");
      console.log(expenseDB);
    }
  }
}

await callAgent();

/*
 * GET Total Expenses
 */

function getTotalExpense({ fromDate, toData }) {
  console.log("Inside get total Expense function");

  // In REALITY -> call db and calculate expense fromDate to toDate:

    const expense = expenseDB.reduce((acc, item) => {
        return acc + item.amount;
    }, 0);

  return `${expense} INR`;
}


/* 
* ADD EXPENSES FUNCTION
*/

function addExpenses({name, amount}){
    console.log(`Adding ${amount} to expenseDB for ${name}`);
    expenseDB.push({name, amount});

    return "Added to the database";
}
