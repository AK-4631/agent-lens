import express from "express";
import cors from "cors";
import {stats,providers,events,addEvent} from "../../core/src/storage";

const app=express();
const port=Number(process.env.AGENT_LENS_PORT)||4321;

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({limit:"1mb"}));

app.get("/api/health",(_,res)=>res.json({
 ok:true,
 service:"agent-lens",
 version:"MAX"
}));

app.get("/api/stats",(_,res)=>res.json(stats()));
app.get("/api/providers",(_,res)=>res.json(providers()));

app.get("/api/events",(req,res)=>{
 const limit=Number(req.query.limit)||250;
 res.json({events:events(limit)});
});

app.post("/api/events",(req,res)=>{
 if(!req.body?.sessionId||!req.body?.type||!req.body?.timestamp)
   return res.status(400).json({error:"sessionId,type,timestamp required"});

 res.status(201).json({
   id:addEvent(req.body)
 });
});

app.listen(port,"127.0.0.1",()=>{
 console.log(`Agent Lens MAX API: http://127.0.0.1:${port}`);
});
