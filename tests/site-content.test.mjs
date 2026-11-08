import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const home=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const mind=readFileSync(new URL('../minddocket/index.html',import.meta.url),'utf8');
const garmin=readFileSync(new URL('../garmin/index.html',import.meta.url),'utf8');
test('MindDocket launch pricing is consistent without claiming App Store availability',()=>{
 for(const html of [home,mind]){assert.match(html,/Free at launch/);assert.doesNotMatch(html,/\$7\.99|\$49|SAVE 49%|Billed monthly|Billed annually/);}
 assert.match(mind,/verified App Store link will be added/);
});
test('home preserves interactive hooks, contact form and booking link',()=>{
 for(const id of ['sensor-play','sensor-next','puck-screen','puck-heading','story-image','story-caption','interface-display','contact-form','contact-success','contact-again']) assert.ok(home.includes('id="'+id+'"'),id);
 assert.match(home,/https:\/\/calendar\.app\.google\/fxoMtwEKzqQfTcPJA/);
 assert.match(home,/fetch\('\/api\/contact'/);
 assert.equal((home.match(/class="applied-card"/g)||[]).length,3);
});
test('Garmin introductions accurately identify preview status',()=>{
 assert.match(garmin,/live Garmin connection, workout delivery, and post-sync activity are coming soon/);
 assert.match(garmin,/Garmin connection and workout delivery are not live yet/);
});
test('HTML pages have unique ids and valid local fragment links',()=>{
 for(const html of [home,mind,garmin]){
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(ids.length,new Set(ids).size,'duplicate id');
  for(const [,fragment] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(fragment),'missing fragment '+fragment);
 }
});
