(() => {
  'use strict';
  const els={conversation:document.querySelector('#conversation'),welcome:document.querySelector('#welcome'),messages:document.querySelector('#messages'),form:document.querySelector('#composer'),input:document.querySelector('#prompt'),send:document.querySelector('#send'),newChat:document.querySelector('#newChat'),status:document.querySelector('#statusText'),availability:document.querySelector('.availability'),notice:document.querySelector('#configNotice')};
  let history=[],busy=false,lastFailed=null;
  const escapeHtml=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function inline(text){return escapeHtml(text).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');}
  function markdown(source){
    const fenced=[];let text=source.replace(/```([^\n`]*)\n([\s\S]*?)```/g,(_,lang,code)=>{const i=fenced.push({lang:escapeHtml(lang.trim()),code:escapeHtml(code.replace(/\n$/,''))})-1;return `\n@@CODE${i}@@\n`;});
    const blocks=text.split(/\n{2,}/);return blocks.map(block=>{const b=block.trim();if(!b)return '';const code=b.match(/^@@CODE(\d+)@@$/);if(code){const item=fenced[+code[1]];return `<div class="code-wrap"><button class="copy-code" type="button" aria-label="Copy code">Copy</button><pre><code${item.lang?` class="language-${item.lang}"`:''}>${item.code}</code></pre></div>`;}
      const lines=b.split('\n');const heading=lines[0].match(/^(#{1,3})\s+(.+)$/);if(heading)return `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>${lines.slice(1).length?`<p>${lines.slice(1).map(inline).join('<br>')}</p>`:''}`;
      if(lines.every(x=>/^\s*[-*+]\s+/.test(x)))return `<ul>${lines.map(x=>`<li>${inline(x.replace(/^\s*[-*+]\s+/,''))}</li>`).join('')}</ul>`;
      if(lines.every(x=>/^\s*\d+[.)]\s+/.test(x)))return `<ol>${lines.map(x=>`<li>${inline(x.replace(/^\s*\d+[.)]\s+/,''))}</li>`).join('')}</ol>`;
      if(lines.every(x=>/^>\s?/.test(x)))return `<blockquote>${lines.map(x=>inline(x.replace(/^>\s?/,''))).join('<br>')}</blockquote>`;
      return `<p>${lines.map(inline).join('<br>')}</p>`;
    }).join('');
  }
  function setBusy(value){busy=value;els.send.disabled=value||!els.input.value.trim();els.input.disabled=value;}
  function appendMessage(role,text,{loading=false,error=false}={}){
    const article=document.createElement('article');article.className=`message ${role}`;const avatar=role==='assistant'?'A':'Y';article.innerHTML=`<div class="avatar" aria-hidden="true">${avatar}</div><div class="message-body"><div class="bubble">${loading?'<span class="loading-dots" role="status" aria-label="Waiting for AI response"><i></i><i></i><i></i></span>':error?`<div class="error-box">${escapeHtml(text)} <button class="retry" type="button">Retry</button></div>`:role==='user'?escapeHtml(text):markdown(text)}</div></div>`;els.messages.append(article);els.welcome.hidden=true;
    if(role==='assistant'&&!loading&&!error){const actions=document.createElement('div');actions.className='message-actions';actions.innerHTML='<button class="message-action copy-response" type="button">Copy response</button><button class="message-action regenerate" type="button">Regenerate</button>';article.querySelector('.message-body').append(actions);}
    return article;
  }
  function nearBottom(){return els.conversation.scrollHeight-els.conversation.scrollTop-els.conversation.clientHeight<140;}
  function scrollLatest(force=false){if(force||nearBottom())els.conversation.scrollTo({top:els.conversation.scrollHeight,behavior:'smooth'});}
  function fitInput(){els.input.style.height='auto';els.input.style.height=`${Math.min(els.input.scrollHeight,160)}px`;els.send.disabled=busy||!els.input.value.trim();}
  function showError(article,message){article.querySelector('.bubble').innerHTML=`<div class="error-box">${escapeHtml(message)} <button class="retry" type="button">Retry</button></div>`;article.dataset.error='true';}
  async function requestResponse({retry=false,regenerate=false}={}){
    if(busy)return;let userText;
    if(retry){userText=lastFailed;if(!userText)return;const old=[...els.messages.querySelectorAll('.message.assistant[data-error="true"]')].at(-1);if(old)old.remove();}
    else if(regenerate){if(!history.length||history.at(-1).role!=='assistant')return;history.pop();const last=[...els.messages.querySelectorAll('.message.assistant')].at(-1);if(last)last.remove();userText=null;}
    else{userText=els.input.value.trim();if(!userText||busy)return;history.push({role:'user',content:userText});appendMessage('user',userText);els.input.value='';fitInput();lastFailed=null;scrollLatest(true);}
    setBusy(true);const loading=appendMessage('assistant','',{loading:true});scrollLatest(true);
    try{const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history})});let data;try{data=await response.json();}catch{throw new Error('The server returned an unreadable response. Please retry.');}
      if(!response.ok)throw new Error(data.error||`The AI service returned an error (${response.status}). Please retry.`);
      if(typeof data.reply!=='string'||!data.reply.trim())throw new Error('The AI service returned an empty response. Please retry.');
      loading.remove();history.push({role:'assistant',content:data.reply});appendMessage('assistant',data.reply);lastFailed=null;scrollLatest();
    }catch(error){showError(loading,error.message||'Could not reach the AI service. Check your connection and retry.');lastFailed=history.filter(m=>m.role==='user').at(-1)?.content||null;scrollLatest(true);}
    finally{setBusy(false);fitInput();}
  }
  els.form.addEventListener('submit',e=>{e.preventDefault();requestResponse();});els.input.addEventListener('input',fitInput);els.input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();els.form.requestSubmit();}});
  document.querySelectorAll('.suggestion').forEach(button=>button.addEventListener('click',()=>{els.input.value=button.textContent;fitInput();requestResponse();}));
  els.newChat.addEventListener('click',()=>{if(busy)return;history=[];lastFailed=null;els.messages.replaceChildren();els.welcome.hidden=false;els.input.value='';fitInput();els.input.focus();});
  els.messages.addEventListener('click',async e=>{const button=e.target.closest('button');if(!button)return;const article=button.closest('.message');if(button.classList.contains('retry'))requestResponse({retry:true});else if(button.classList.contains('regenerate'))requestResponse({regenerate:true});else if(button.classList.contains('copy-response')){const content=history.filter(m=>m.role==='assistant').at(-1)?.content;if(content)await copy(content,button);}else if(button.classList.contains('copy-code')){const code=article.querySelector('code');if(code)await copy(code.innerText,button);}});
  async function copy(text,button){try{await navigator.clipboard.writeText(text);const old=button.textContent;button.textContent='Copied';setTimeout(()=>button.textContent=old,1300);}catch{button.textContent='Copy failed';setTimeout(()=>button.textContent='Copy',1500);}}
  async function checkConfig(){try{const r=await fetch('/api/config');const data=await r.json();if(data.configured){els.status.textContent='AI available';els.availability.classList.add('ready');}else{els.status.textContent='Setup required';els.availability.classList.add('unavailable');els.notice.hidden=false;}}catch{els.status.textContent='Service unavailable';els.availability.classList.add('unavailable');}}
  checkConfig();fitInput();
})();
