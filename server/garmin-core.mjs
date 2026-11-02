import {createHash,randomBytes,createCipheriv,createDecipheriv,timingSafeEqual} from 'node:crypto';
export const hash=v=>createHash('sha256').update(v).digest('hex');
export const random=()=>randomBytes(32).toString('base64url');
export const challenge=v=>createHash('sha256').update(v).digest('base64url');
export function equal(a,b){return typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));}
export function encrypt(value,key){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',Buffer.from(key,'base64'),iv);return Buffer.concat([iv,c.update(JSON.stringify(value)),c.final(),c.getAuthTag()]).toString('base64');}
export function decrypt(value,key){const b=Buffer.from(value,'base64'),d=createDecipheriv('aes-256-gcm',Buffer.from(key,'base64'),b.subarray(0,12));d.setAuthTag(b.subarray(-16));return JSON.parse(Buffer.concat([d.update(b.subarray(12,-16)),d.final()]).toString());}
const number=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
const text=v=>typeof v==='string'?v.slice(0,160):null;
// Explicit allowlist: GPS coordinates, complete raw files and unrelated health data never enter activity storage.
export function normalizeActivity(record){const s=record.summary||record;const id=record.activityId??s.activityId??String(record.summaryId||'').replace(/-detail$/,'');if(!id||String(id).length>160)return null;const samples=(Array.isArray(record.samples)?record.samples:[]).filter(x=>number(x.heartRate)!==null&&number(x.startTimeInSeconds)!==null).sort((a,b)=>a.startTimeInSeconds-b.startTimeInSeconds);const stride=Math.max(1,Math.ceil(samples.length/240));return {id:String(id),name:text(s.activityName)||text(s.activityType)||'Workout',start:number(s.startTimeInSeconds),duration:number(s.durationInSeconds),distance:number(s.distanceInMeters),avgHr:number(s.averageHeartRateInBeatsPerMinute),device:text(s.deviceName),manual:s.manual===true,samples:samples.filter((_,i)=>i%stride===0||i===samples.length-1).map(x=>({t:x.startTimeInSeconds,hr:x.heartRate})),hasDetails:!!record.summary||Array.isArray(record.samples)};}
export function validateDate(v,now=new Date()){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===v&&+d>+now-86400000&&+d<+now+90*86400000;}
export function cookie(req,name){const match=(req.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='));return match?.slice(name.length+1)||'';}

export function sanitizePacket(packet){
 const summaryKeys=['activityId','activityName','activityType','startTimeInSeconds','durationInSeconds','distanceInMeters','averageHeartRateInBeatsPerMinute','deviceName','manual'];
 const pick=s=>Object.fromEntries(summaryKeys.filter(k=>s[k]!==undefined).map(k=>[k,s[k]]));
 return Object.fromEntries(Object.entries(packet).map(([kind,records])=>[kind,records.map(r=>{
  if(kind==='deregistrations'||kind==='userPermissionsChange')return {userId:String(r.userId||'')};
  return {...pick(r),userId:String(r.userId||''),summaryId:r.summaryId,activityId:r.activityId,...(r.summary?{summary:pick(r.summary)}:{}),...(Array.isArray(r.samples)?{samples:r.samples.map(x=>({heartRate:x.heartRate,startTimeInSeconds:x.startTimeInSeconds}))}:{})};
 })]));
}
