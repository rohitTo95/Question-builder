import dotenv from 'dotenv';
dotenv.config();
const apikey: string = process.env.GEMINI_API_KEY || '';

export const geminiAPIConnect = async(prompt: string, n:number) => {
    let res: any;
    try {
        const templatePrompt = `You are a teaching assistant. Your job is to create MCQ type questions from the passage or text given to you. You may have to create ${n} number of question/questions. Your response should be in the following json format:

[
    {
        "question": "<the question you have made>",
        "options": ["option1", "option2", "option3", "option4"
        "answer" : "<answer>"
    }
]

and in case you have created multiple questions response should be:
[
    {
        "question": "<the question you have made>",
        "options": ["option1", "option2", "option3", "option4"]
        "answer" : "<answer>"
    },
    {
        "question": "<the question you have made>",
        "options": ["option1", "option2", "option3", "option4"]
        "answer" : "<answer>"
    }
]

Text/Passage: ${prompt}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apikey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: templatePrompt
                    }]
                }]
            })
        });

        const data: any = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            res = {
                message: "Success",
                data: data.candidates[0].content.parts[0].text
            };
        } else {
            res = {
                message: "No response generated",
                data: null
            };
        }

    } catch (err) {
        res = {
            message: "Some error had occurred.",
            error: err
        };
    }
    
    return res;
}