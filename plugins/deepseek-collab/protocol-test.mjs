import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const state=mkdtempSync(join(tmpdir(),'deepseek-mcp-test-'));
const client=new Client({name:'local-verifier',version:'1.0.0'});
const transport=new StdioClientTransport({command:process.execPath,args:['dist/server.mjs'],env:{...process.env,COLLAB_PROVIDER:'bailian',DASHSCOPE_API_KEY:'',DEEPSEEK_COLLAB_STATE:state},stderr:'pipe'});
try{
  await client.connect(transport);
  const {tools}=await client.listTools();
  assert.equal(tools.length,4);
  assert.equal(tools.find(t=>t.name==='deepseek_panel')._meta['openai/ui'].entrypoints[0].type,'thread');
  const resource=await client.readResource({uri:'ui://deepseek-collab/panel'});
  assert.match(resource.contents[0].text,/Codex Model Bridge/);
  const opened=await client.callTool({name:'deepseek_panel',arguments:{}});
  const id=opened.structuredContent.session_id;assert.ok(id);
  const history=await client.callTool({name:'deepseek_history',arguments:{session_id:id}});
  assert.equal(history.structuredContent.session.id,id);
  const failed=await client.callTool({name:'deepseek_delegate',arguments:{session_id:id,task:'No credential smoke check'}});
  assert.equal(failed.structuredContent.turn.status,'failed');
  assert.match(failed.structuredContent.turn.error,/setup-key/);
  console.log('PASS: bundled MCP handshake, 4 tools, thread entrypoint, UI resource, history and missing-key failure. No API request.');
}finally{await client.close();rmSync(state,{recursive:true,force:true});}
