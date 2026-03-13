export default async function handler(req, res) {

if (req.method !== "POST") {
return res.status(405).json({ error: "Method not allowed" })
}

try {

const { messages } = req.body

const last = messages[messages.length - 1]?.content || ""

let response = {
summary: "Pipeline created successfully",
answer: "I analyzed your request and generated the pipeline plan.",
sql: "SELECT * FROM sales LIMIT 10",
agentPlan: [
{ step:1, title:"Analyze user request" },
{ step:2, title:"Design pipeline architecture" },
{ step:3, title:"Generate SQL queries" },
{ step:4, title:"Prepare transformation layers" },
{ step:5, title:"Validate pipeline design" }
]
}

return res.status(200).json(response)

} catch (err) {

return res.status(500).json({
error: err.message
})

}

}
