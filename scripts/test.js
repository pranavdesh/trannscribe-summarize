import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";


import './config.js';


const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

// const msg = await anthropic.messages.create({
//   model: "claude-3-opus-20240229",
//   max_tokens: 1000,
//   temperature: 0,
//   messages: [
//     {
//       "role": "user",
//       "content": [
//         {
//           "type": "text",
//           "text": "What are they key achievements of Cesar Augustus"
//         }
//       ]
//     },
//     {
//       "role": "assistant",
//       "content": [
//         {
//           "type": "text",
//           "text": "Cesar Augustus, also known as Octavian, was the first Roman emperor and one of the most influential figures in ancient history. Here are some of his key achievements:\n\n1. Ending the Roman Republic: Augustus successfully transformed the Roman Republic into the Roman Empire, becoming its first emperor and establishing a new system of government.\n\n2. Pax Romana: He ushered in an era of relative peace and stability known as the Pax Romana (Roman Peace), which lasted for approximately 200 years.\n\n3. Expanding the Roman Empire: Under his rule, the Roman Empire expanded significantly, annexing territories such as Egypt, Dalmatia, and parts of Spain and Germany.\n\n4. Administrative reforms: Augustus implemented various administrative reforms, including the establishment of a standing army, a police force, and a postal service. He also reformed the tax system and conducted a census of the empire's population.\n\n5. Patronage of the arts and literature: Augustus was a great patron of the arts and literature, supporting poets like Virgil and Horace, and encouraging the construction of grand public buildings and monuments.\n\n6. Religious reforms: He revived traditional Roman religious practices and values, building temples and promoting moral reforms.\n\n7. Establishing a dynasty: Augustus founded the Julio-Claudian dynasty, which ruled the Roman Empire for over a century after his death.\n\nThese achievements laid the foundation for the Roman Empire's success and longevity, making Augustus one of the most significant figures in ancient Roman history."
//         }
//       ]
//     },
//     {
//       "role": "user",
//       "content": [
//         {
//           "type": "text",
//           "text": "Who succeeded him and what were their key achievements?"
//         }
//       ]
//     }
//   ]
// });

// console.log(msg);



const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    {
      "role": "user",
      "content": "What are they key achievements of Caesar Augustus\n"
    }
  ],
  temperature: 1,
  max_tokens: 256,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
});

console.log(response.choices[0].message.content);