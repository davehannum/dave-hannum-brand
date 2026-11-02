export const workouts = [
 {id:'steady',name:'Find your rhythm',eyebrow:'01 / STEADY RUN',minutes:25,intent:'An easy, conversational run. Get moving and see how your effort settles.',blocks:[['WARMUP',300,'Walk into an easy jog'],['ACTIVE',900,'Run at a comfortable, conversational effort'],['COOLDOWN',300,'Ease back to a walk']],pattern:[18,22,27,32,37,40,41,42,42,43,44,44,43,42,41,38,32,25]},
 {id:'intervals',name:'Change the pace',eyebrow:'02 / RUN INTERVALS',minutes:30,intent:'Six controlled efforts with room to recover. A visible rhythm on your wrist and in your results.',blocks:[['WARMUP',300,'Easy walk or jog'],...Array.from({length:6},()=>[['ACTIVE',120,'Controlled, purposeful run — leave something in reserve'],['RECOVERY',60,'Easy walk or jog']]).flat(),['COOLDOWN',420,'Easy walk or jog']],pattern:[17,21,28,55,28,59,29,62,30,64,31,63,30,62,30,27,23,18]},
 {id:'ride',name:'Build your base',eyebrow:'03 / STEADY RIDE',minutes:35,intent:'A comfortable ride with a gradual start and finish. Indoors or out, on a compatible cycling device.',blocks:[['WARMUP',300,'Easy spin'],['ACTIVE',1500,'Ride at a comfortable, conversational effort'],['COOLDOWN',300,'Gradually ease off']],pattern:[16,20,25,30,35,38,40,42,44,43,44,45,44,43,40,34,27,20]}
];
export function workoutPayload(id){
 const w=workouts.find(x=>x.id===id);if(!w)throw new Error('Unknown workout');
 const sport=id==='ride'?'CYCLING':'RUNNING';
 return {workoutName:w.name,description:w.intent,sport,workoutProvider:'Dave Hannum',workoutSourceId:'Dave Hannum',segments:[{segmentOrder:1,sport,steps:w.blocks.map(([intensity,durationValue,description],i)=>({type:'WorkoutStep',stepOrder:i+1,intensity,durationType:'TIME',durationValue,targetType:'OPEN',description}))}]};
}
