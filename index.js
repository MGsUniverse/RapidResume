const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

const apiKey = process.env.OPENAI_API_KEY;

var parameters = [
  "removing any information not required by the job applying for",
  "highlight accomplishments",
  "use plain language",
  "remove unnecessary personal information",
  "remove personal pronouns",
  "remove reasons for leaving previous jobs, hobbies and references"
];

var previous_prompts = [];

function chatgpt(contents, param) {
  return new Promise((resolve, reject) => {
    console.log(param);

    const processed_prompt = "fix up this resume \"" + contents + "\" by " + param;
    var prompt = "";

    if (param == "removing any information not required by the job applying for") {
      prompt = processed_prompt;
    } else {
      prompt = "Now " + param + " remember to keep any changes made in the previous requests";
    }

    if (param == "highlight accomplishments" || param == "removing any information not required by the job applying for"){
      previous_prompts.push({ 'role': 'user', 'content': prompt });
    }
    else {
      previous_prompts[2] = { 'role': 'user', 'content': prompt };
    }

    const maxTokens = 3000;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    const requestBody = {
      model: 'gpt-3.5-turbo',
      messages: previous_prompts,
      max_tokens: maxTokens
    };

    axios.post('https://api.openai.com/v1/chat/completions', requestBody, { headers })
      .then(response => {
        const completion = response.data.choices[0].message.content;
        console.log('ChatGPT Response:', completion);
        resolve(completion);
      })
      .catch(error => {
        console.error('Error:', error);
        reject(error);
      });
  });
}

app.use(cors());

var resume = "";

app.get("/getdata", async (req, res) => {
  const paramValue = req.query.param;
  var paramValue2 = req.query.param2;
  console.log("Received parameter:", paramValue);
  console.log("Received parameter2:", paramValue2);

  var is_md = false;

  // Check if paramValue is an array
  if (Array.isArray(paramValue)) {
    // Join the array elements into a single string
    resume = paramValue.join(" ");
  } else {
    resume = paramValue;
  }

  paramValue2 = paramValue2.split(",");

  parameters.push(
    "Write it in a maximum of " + paramValue2[1] + " words"
  );

  if (paramValue2[0] == "Markdown"){
    is_md = true;
    parameters.push("Write it in Markdown format",)
  }

  // Use Promise.all to call chatgpt for each parameter
  const results = [];
  for (const param of parameters) {
    try {
      const got = await chatgpt(resume, param);
      results.push(got);
      resume = got;
      if (previous_prompts.length < 4){
        previous_prompts.push({ 'role': 'system', 'content': got });
      }
      else {
        previous_prompts[3] == { 'role': 'system', 'content': got };
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error occurred');
      return;
    }
  }
  if (!is_md){
    res.send(resume);
  } else {
    res.send(resume);
  }
  previous_prompts = [];
  parameters = [
  "removing any information not required by the job applying for",
  "highlight accomplishments",
  "use plain language",
  "remove unnecessary personal information",
  "remove personal pronouns",
  "remove reasons for leaving previous jobs, hobbies and references"
];
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
