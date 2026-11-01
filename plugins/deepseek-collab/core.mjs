import {randomUUID} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync,renameSync,existsSync,readdirSync,openSync,closeSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
const exec=promisify(execFile);
export const assetRoot=new URL(import.meta.url.includes('/dist/')?'../':'./',import.meta.url);
export const MODEL=process.env.COLLAB_MODEL?.trim()||'deepseek-v4.1-flash-1017';
export const ENDPOINT=process.env.COLLAB_ENDPOINT?.trim()||'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const custom=Boolean(process.env.COLLAB_ENDPOINT?.trim());
function validateEndpoint(){let url;try{url=new URL(ENDPOINT);}catch{throw new Error('供应商地址无效。');}if(url.protocol!=='https:'||url.username||url.password||url.hash||url.search)throw new Error('供应商地址必须是 HTTPS，且不能包含用户名、密码、查询参数或片段。');}
export const stateDir=()=>process.env.DEEPSEEK_COLLAB_STATE||join(process.env.LOCALAPPDATA||process.cwd(),'deepseek-collab');
export async function localKey(){
  const key=custom?process.env.COLLAB_API_KEY:process.env.DASHSCOPE_API_KEY;
  if(key?.trim()) return key.trim();
  const binding=join(stateDir(),'custom-endpoint.txt');
  if(custom&&(!existsSync(binding)||readFileSync(binding,'utf8').replace(/^\uFEFF/,'').trim()!==ENDPOINT))throw new Error('自定义地址与本机密钥绑定不一致，请重新运行 setup-key.ps1 -Provider custom -Endpoint <供应商地址>。');
  const path=join(stateDir(),custom?'custom-key.dpapi':'key.dpapi');
  if(!existsSync(path)) throw new Error(custom?'请运行 setup-key.ps1 -Provider custom 配置独立密钥；不要在聊天中发送 API Key。':'请先在本机运行 setup-key.ps1；不要在聊天中发送 API Key。');
  // The key travels only in the local pipe, never in arguments, logs or MCP responses.
  try {const {stdout}=await exec('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',fileURLToPath(new URL('./decrypt-key.ps1',assetRoot)),'-CredentialPath',path],{windowsHide:true});if(!stdout.trim())throw Error('empty');return stdout.trim();}
  catch {throw new Error('无法解密本机凭据，请重新运行 setup-key.ps1。');}
}
export class Store {
  constructor(directory=stateDir(),provider=null){this.directory=directory;this.provider=provider;this.active=new Map();this.sessions={};mkdirSync(directory,{recursive:true});}
  path(id){if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('无效协作编号。');return join(this.directory,id+'.json');}
  save(s){const target=this.path(s.id),temp=target+'.'+process.pid+'.tmp';writeFileSync(temp,JSON.stringify(s),{mode:0o600});renameSync(temp,target);}
  create(){validateEndpoint();const s={id:randomUUID(),model:MODEL,endpoint:ENDPOINT,turns:[]};this.sessions[s.id]=s;this.save(s);return s;}
  get(id){if(this.active.has(id))return this.sessions[id];const path=this.path(id);if(!existsSync(path))throw new Error('找不到这次协作，请新建面板。');return this.sessions[id]=JSON.parse(readFileSync(path,'utf8'));}
  list(){return readdirSync(this.directory).filter(f=>/^[a-f0-9-]{36}\.json$/.test(f)).map(f=>this.get(f.slice(0,-5))).map(s=>({id:s.id,title:s.turns[0]?.task.slice(0,45)||'新协作',running:s.turns.some(t=>t.status==='running')}));}
  cancel(id){this.get(id);this.active.get(id)?.abort();return {stopped:true};}
  async delegate(id,task){
    const s=this.get(id);
    if((s.endpoint||'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions')!==ENDPOINT)throw new Error('此协作属于其他供应商；请新建协作，避免发送旧记录。');
    if(typeof task!=='string'||!task.trim()||task.length>80000)throw new Error('任务不能为空，最多 80,000 字符。');
    if(this.active.has(id))throw new Error('该协作仍在执行；请等待或先停止。');
    const messages=[{role:'system',content:'完成提供的任务，区分事实和推测，不编造证据。你没有本地文件或命令执行工具，不声称已完成未执行的操作。'}];
    for(const t of s.turns)if(t.status==='completed')messages.push({role:'user',content:t.task},{role:'assistant',content:t.answer});
    messages.push({role:'user',content:task});
    if(JSON.stringify(messages).length>300000)throw new Error('该协作历史过长，请新建协作。');
    const lock=this.path(id)+'.lock';let handle;try{handle=openSync(lock,'wx');}catch{throw new Error('该协作已被另一个进程占用；若上次意外退出，请新建协作。');}
    const controller=new AbortController();this.active.set(id,controller);
    const turn={id:randomUUID(),task,answer:'',status:'running',at:new Date().toISOString()};s.turns.push(turn);
    const timeout=setTimeout(()=>controller.abort(),120000);
    try{
      this.save(s);
      const result=this.provider?await this.provider(messages,controller.signal):await this.request(messages,controller.signal);
      turn.answer=result.answer;turn.actualModel=result.model;turn.status='completed';
    }catch(error){turn.status='failed';turn.error=error.name==='AbortError'?'已停止或请求超过两分钟。':error.message;}
    finally{clearTimeout(timeout);this.active.delete(id);try{this.save(s);}finally{closeSync(handle);unlinkSync(lock);}}
    return turn;
  }
  async request(messages,signal){
    validateEndpoint();
    const key=await localKey();
    let response;
    try{response=await fetch(ENDPOINT,{method:'POST',headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:MODEL,messages,stream:false,max_tokens:8192}),signal});}
    catch(error){if(error.name==='AbortError')throw error;throw new Error('无法连接供应商，请检查网络。');}
    if(!response.ok)throw new Error(`供应商请求失败（HTTP ${response.status}），请检查密钥权限、余额和模型可用性。`);
    let result;try{result=await response.json();}catch{throw new Error('供应商返回了无效 JSON。');}
    const answer=result.choices?.[0]?.message?.content;
    if(typeof answer!=='string'||!answer.trim())throw new Error('供应商未返回可用文本，本次协作未完成。');
    if(result.choices[0].finish_reason==='length')throw new Error('回复达到输出上限，未作为完整结果接收；请缩小任务。');
    return {answer,model:result.model||MODEL};
  }
}
