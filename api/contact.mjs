import {createHash} from 'node:crypto';
const attempts=new Map();
const topics=new Set(['A product or business idea','Advisory work','Speaking or a podcast','Introductory call','Something else']);
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req){
 if(!['https://www.davehannum.com','https://davehannum.com'].includes(req.headers.get('origin')))return json({error:'Please send your message from davehannum.com.'},403);
 if(!req.headers.get('content-type')?.startsWith('application/json'))return json({error:'Invalid request.'},415);
 if(Number(req.headers.get('content-length'))>10000)return json({error:'Message is too long.'},413);
 let d;try{const raw=await req.text();if(raw.length>10000)return json({error:'Message is too long.'},413);d=JSON.parse(raw);}catch{return json({error:'Invalid request.'},400);}
 if(!d||typeof d!=='object')return json({error:'Invalid request.'},400);
 if(d.website)return json({ok:true});
 const {name,email,topic,message}=d;
 if(typeof name!=='string'||!name.trim()||name.length>100||/[\r\n]/.test(name)||typeof email!=='string'||email.length>200||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||/[\r\n]/.test(email)||!topics.has(topic)||typeof message!=='string'||!message.trim()||message.length>1500)return json({error:'Please check your name, email, topic, and message.'},400);
 if(!process.env.RESEND_API_KEY)return json({error:'Sending is temporarily unavailable. Please email dave@hannumstrategy.com.'},503);
 const now=Date.now(),ip=req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown';
 for(const [key,value]of attempts)if(now-value.start>600000)attempts.delete(key);
 const rate=attempts.get(ip)||{start:now,count:0};
 if(rate.count>=5)return json({error:'Please wait a few minutes before sending another message.'},429);
 rate.count++;attempts.set(ip,rate);
 const text='Website inquiry from davehannum.com\n\nName: '+name.trim()+'\nEmail: '+email+'\nTopic: '+topic+'\n\n'+message.trim();
 const key=createHash('sha256').update(text+Math.floor(now/600000)).digest('hex');
 try{
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'contact-'+key},body:JSON.stringify({from:'Dave Hannum Website <website@hannumstrategy.com>',to:['dave@hannumstrategy.com'],reply_to:email,subject:'Website inquiry: '+topic,text}),signal:AbortSignal.timeout(15000)});
 if(!response.ok){console.error('Contact delivery provider status',response.status);return json({error:'Your message could not be sent. Please try again or email dave@hannumstrategy.com.'},502);}
 const result=await response.json();if(!result.id)throw Error('Missing receipt');
 return json({ok:true});
 }catch{return json({error:'We could not confirm sending. Please retry or email dave@hannumstrategy.com.'},502);}
}
