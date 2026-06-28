export function buildCallHtml(params: {
  token: string;
  callId: string;
  peerId: string;
  peerName: string;
  direction: string;
  kind: string;
  domain: string;
}): string {
  const { token, callId, peerId, peerName, direction, kind, domain } = params;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<title>Appel</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;overflow:hidden;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fff}
#app{position:relative;width:100%;height:100%}
#remoteVideo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#111}
#localVideo{position:absolute;top:16px;right:16px;width:110px;height:160px;object-fit:cover;border-radius:14px;border:2px solid rgba(255,255,255,0.4);background:#222;z-index:10;transform:scaleX(-1)}
#avatar{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;z-index:5}
#avatarCircle{width:110px;height:110px;border-radius:55px;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:700;color:#fff}
#peerLabel{font-size:24px;font-weight:700;margin-top:8px}
#statusLabel{font-size:15px;color:rgba(255,255,255,0.75)}
#topBar{position:absolute;top:0;left:0;right:0;padding:28px 20px 0;z-index:20}
#topCard{display:inline-block;background:rgba(0,0,0,0.45);border-radius:12px;padding:10px 14px}
#topName{font-size:15px;font-weight:600}
#topStatus{font-size:12px;color:rgba(255,255,255,0.85);margin-top:2px}
#controls{position:absolute;bottom:0;left:0;right:0;padding:0 0 40px;display:flex;align-items:center;justify-content:center;gap:22px;z-index:20}
.ctrl{width:62px;height:62px;border-radius:31px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.ctrl-normal{background:rgba(255,255,255,0.18)}
.ctrl-end{background:#ef4444;transform:rotate(135deg)}
#errorBox{display:none;position:absolute;inset:0;align-items:center;justify-content:center;flex-direction:column;gap:16px;padding:32px;background:#0a0a0a;z-index:30;text-align:center}
#errorBox.show{display:flex}
</style>
</head>
<body>
<div id="app">
  <video id="remoteVideo" autoplay playsinline></video>
  <video id="localVideo" autoplay playsinline muted></video>
  <div id="avatar">
    <div id="avatarCircle"></div>
    <div id="peerLabel"></div>
    <div id="statusLabel">Connexion…</div>
  </div>
  <div id="topBar"><div id="topCard"><div id="topName"></div><div id="topStatus">Connexion…</div></div></div>
  <div id="controls">
    <button class="ctrl ctrl-normal" id="muteBtn">🎤</button>
    <button class="ctrl ctrl-end" id="endBtn">📞</button>
    <button class="ctrl ctrl-normal" id="videoBtn" style="display:none">📹</button>
  </div>
  <div id="errorBox">
    <div id="errorMsg"></div>
    <button onclick="closeCall()" style="background:#ef4444;border:none;color:#fff;padding:12px 28px;border-radius:24px;font-size:15px;cursor:pointer;margin-top:8px">Fermer</button>
  </div>
</div>
<script>
(function(){
  var token=${JSON.stringify(token)};
  var callId=${JSON.stringify(callId)};
  var peerId=${JSON.stringify(peerId)};
  var direction=${JSON.stringify(direction)};
  var kind=${JSON.stringify(kind)};
  var peerName=${JSON.stringify(peerName)};
  var domain=${JSON.stringify(domain)};

  function rnLog(data){
    if(typeof window.ReactNativeWebView!=='undefined'){
      window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({type:'debug'},data)));
    }
  }

  document.getElementById('peerLabel').textContent=peerName;
  document.getElementById('topName').textContent=peerName;

  var colors=['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899'];
  var ci=0;
  for(var i=0;i<peerId.length;i++) ci=(ci*31+peerId.charCodeAt(i))&0x7fffffff;
  document.getElementById('avatarCircle').style.background=colors[ci%colors.length];
  document.getElementById('avatarCircle').textContent=peerName.trim().charAt(0).toUpperCase()||'?';
  if(kind==='video') document.getElementById('videoBtn').style.display='flex';

  var isMuted=false,isVideoOff=false,localStream=null,pc=null,ws=null,ended=false,pending=[],remoteSet=false;

  function setStatus(t){
    document.getElementById('statusLabel').textContent=t;
    document.getElementById('topStatus').textContent=t;
  }

  function closeCall(){
    if(typeof window.ReactNativeWebView!=='undefined'){
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'call-ended'}));
    } else { window.close(); }
  }

  function hangup(notify){
    if(ended) return;
    ended=true;
    if(notify&&ws&&ws.readyState===1) ws.send(JSON.stringify({type:'call-end',to:peerId,callId:callId}));
    if(pc){try{pc.close();}catch(e){} pc=null;}
    if(localStream){localStream.getTracks().forEach(function(t){t.stop();}); localStream=null;}
    setStatus('Appel terminé');
    setTimeout(closeCall,1200);
  }

  document.getElementById('endBtn').onclick=function(){hangup(true);};
  document.getElementById('muteBtn').onclick=function(){
    isMuted=!isMuted;
    if(localStream) localStream.getAudioTracks().forEach(function(t){t.enabled=!isMuted;});
    document.getElementById('muteBtn').textContent=isMuted?'🔇':'🎤';
  };
  document.getElementById('videoBtn').onclick=function(){
    isVideoOff=!isVideoOff;
    if(localStream) localStream.getVideoTracks().forEach(function(t){t.enabled=!isVideoOff;});
    document.getElementById('videoBtn').textContent=isVideoOff?'🚫':'📹';
  };

  async function getMedia(){
    try{
      localStream=await navigator.mediaDevices.getUserMedia({
        audio:true,
        video:kind==='video'?{facingMode:'user'}:false
      });
      document.getElementById('localVideo').srcObject=localStream;
      if(kind!=='video') document.getElementById('localVideo').style.display='none';
      rnLog({msg:'getMedia OK'});
      return true;
    }catch(e){
      document.getElementById('errorMsg').textContent='Caméra/Micro inaccessible: '+e.message;
      document.getElementById('errorBox').classList.add('show');
      rnLog({msg:'getMedia FAILED: '+e.message});
      return false;
    }
  }

  function createPeer(){
    pc=new RTCPeerConnection({iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}]});
    pc.ontrack=function(e){
      var s=e.streams&&e.streams[0];
      if(!s) return;
      document.getElementById('remoteVideo').srcObject=s;
      if(kind==='video') document.getElementById('avatar').style.display='none';
      setStatus('En appel');
      rnLog({msg:'remoteTrack received'});
    };
    pc.onicecandidate=function(e){
      if(e.candidate&&ws&&ws.readyState===1){
        ws.send(JSON.stringify({type:'ice-candidate',to:peerId,callId:callId,candidate:e.candidate.toJSON()}));
        rnLog({msg:'ice-candidate sent'});
      }
    };
    pc.onconnectionstatechange=function(){
      rnLog({msg:'pc state: '+pc.connectionState});
      if(pc.connectionState==='failed'){setStatus('Connexion perdue');setTimeout(function(){hangup(false);},2000);}
    };
    if(localStream) localStream.getTracks().forEach(function(t){pc.addTrack(t,localStream);});
  }

  async function sendOffer(){
    try{
      rnLog({msg:'sendOffer start'});
      var o=await pc.createOffer({offerToReceiveAudio:true,offerToReceiveVideo:kind==='video'});
      await pc.setLocalDescription(o);
      ws.send(JSON.stringify({type:'webrtc-offer',to:peerId,callId:callId,sdp:pc.localDescription}));
      setStatus('Connexion en cours…');
      rnLog({msg:'sendOffer done'});
    }catch(e){
      document.getElementById('errorMsg').textContent='Erreur: '+e.message;
      document.getElementById('errorBox').classList.add('show');
      rnLog({msg:'sendOffer ERROR: '+e.message});
    }
  }

  async function handleOffer(sdp,from){
    try{
      rnLog({msg:'handleOffer from '+from});
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      remoteSet=true;
      for(var i=0;i<pending.length;i++){try{await pc.addIceCandidate(new RTCIceCandidate(pending[i]));}catch(e){}}
      pending=[];
      var a=await pc.createAnswer();
      await pc.setLocalDescription(a);
      ws.send(JSON.stringify({type:'webrtc-answer',to:from||peerId,callId:callId,sdp:pc.localDescription}));
      setStatus('Connexion en cours…');
      rnLog({msg:'handleOffer answer sent'});
    }catch(e){rnLog({msg:'handleOffer ERROR: '+e.message});}
  }

  async function handleAnswer(sdp){
    try{
      rnLog({msg:'handleAnswer'});
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      remoteSet=true;
      for(var i=0;i<pending.length;i++){try{await pc.addIceCandidate(new RTCIceCandidate(pending[i]));}catch(e){}}
      pending=[];
    }catch(e){rnLog({msg:'handleAnswer ERROR: '+e.message});}
  }

  async function handleIce(c){
    if(!pc) return;
    if(!remoteSet){pending.push(c);return;}
    try{await pc.addIceCandidate(new RTCIceCandidate(c));}catch(e){}
  }

  async function start(){
    var wsUrl='ws://'+domain+'/ws/signal?token='+encodeURIComponent(token);
    rnLog({msg:'WS connecting to '+wsUrl, direction:direction, peerId:peerId});
    ws=new WebSocket(wsUrl);

    ws.onerror=function(){
      document.getElementById('errorMsg').textContent='Impossible de se connecter au serveur.';
      document.getElementById('errorBox').classList.add('show');
      rnLog({msg:'WS error'});
    };

    ws.onclose=function(e){
      rnLog({msg:'WS closed code:'+e.code});
      if(!ended) setStatus('Connexion perdue');
    };

    ws.onopen=async function(){
      rnLog({msg:'WS opened direction='+direction});
      var ok=await getMedia();
      if(!ok) return;
      createPeer();
      if(direction==='outgoing'){
        setStatus('Sonnerie…');
        rnLog({msg:'outgoing: waiting for call-ready or call-accept'});
      } else {
        setStatus('Connexion…');
        rnLog({msg:'incoming: sending call-ready to '+peerId});
        ws.send(JSON.stringify({type:'call-ready',to:peerId,callId:callId}));
      }
    };

    ws.onmessage=async function(ev){
      var msg;
      try{msg=JSON.parse(ev.data);}catch(e){return;}

      // LOG TOUS LES MESSAGES REÇUS
      rnLog({msg:'MSG RECEIVED type='+msg.type+' from='+msg.from});

      if(msg.type==='ready'){rnLog({msg:'server ready, userId='+msg.userId});return;}
      if(msg.type==='pong'){return;}

      if(msg.type==='call-accept'&&direction==='outgoing'){
        rnLog({msg:'call-accept received, sending offer'});
        await sendOffer();
        return;
      }
      if(msg.type==='call-ready'&&direction==='outgoing'){
        rnLog({msg:'call-ready received, sending offer'});
        await sendOffer();
        return;
      }
      if(msg.type==='webrtc-offer'){await handleOffer(msg.sdp,msg.from);return;}
      if(msg.type==='webrtc-answer'){await handleAnswer(msg.sdp);return;}
      if(msg.type==='ice-candidate'){await handleIce(msg.candidate);return;}
      if(msg.type==='call-reject'){
        setStatus('Appel refusé');
        setTimeout(function(){hangup(false);},1500);
        return;
      }
      if(msg.type==='call-end'){
        setStatus('Appel terminé');
        setTimeout(function(){hangup(false);},1200);
        return;
      }
      if(msg.type==='peer-offline'){
        rnLog({msg:'peer-offline received'});
        setStatus('Correspondant hors ligne');
        setTimeout(function(){hangup(false);},2000);
        return;
      }
    };
  }

  start();
})();
</script>
</body>
</html>`;
}