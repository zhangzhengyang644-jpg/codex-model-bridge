import {App} from '@modelcontextprotocol/ext-apps';
const app=new App({name:'DeepSeek 协作',version:'0.1.0'},{availableDisplayModes:['inline','fullscreen']});
let id=null,busy=false;
const $=s=>document.querySelector(s);
function paint(data){
  const s=data.session;if(!s)return;
  id=s.id;$('#status').textContent=s.turns.some(t=>t.status==='running')?'DeepSeek 正在处理…':'等待明确委派';
  const select=$('#sessions');select.replaceChildren();for(const v of data.sessions||[]){const option=document.createElement('option');option.value=v.id;option.textContent=v.title;option.selected=v.id===id;select.append(option);}
  const box=$('#turns');box.replaceChildren();
  if(!s.turns.length){const p=document.createElement('p');p.className='empty';p.textContent='在左侧主聊天中说“请让 DeepSeek 处理……”。这里会展示主 Codex 实际发出的任务及返回的回复。';box.append(p);}
  for(const t of s.turns){const row=document.createElement('section');row.className='turn';for(const [label,value] of [['主 Codex → DeepSeek',t.task],['DeepSeek → 主 Codex',t.status==='running'?'处理中…':t.status==='failed'?t.error:t.answer]]){const cell=document.createElement('article');const h=document.createElement('h2');h.textContent=label;const p=document.createElement('pre');p.textContent=value;cell.append(h,p);row.append(cell);}box.append(row);}
}
app.ontoolresult=r=>paint(r.structuredContent||{});
async function refresh(){if(busy)return;busy=true;try{const r=await app.callServerTool({name:'deepseek_history',arguments:id?{session_id:id}:{}});if(r.isError)throw Error(r.content?.[0]?.text||'读取失败');paint(r.structuredContent||{});}catch(e){$('#status').textContent=e.message;}finally{busy=false;}}
$('#sessions').onchange=()=>{id=$('#sessions').value;refresh();};
$('#refresh').onclick=refresh;
$('#stop').onclick=async()=>{if(id)await app.callServerTool({name:'deepseek_cancel',arguments:{session_id:id}});await refresh();};
await app.connect();setInterval(refresh,2500);
