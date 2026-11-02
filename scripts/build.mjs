import {mkdir,cp,access} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const path of ['index.html','brand.css','assets','minddocket','garmin','explorations.html','layouts','uploads','design-canvas.jsx','image-slot.js','tweaks-panel.jsx']){
 try{await access(path)}catch{continue}await cp(path,'dist/'+path,{recursive:true});
}
