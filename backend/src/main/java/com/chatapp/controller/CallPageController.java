package com.chatapp.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CallPageController {

  @GetMapping("/call-page")
  public ResponseEntity<String> callPage() {
    return ResponseEntity.ok()
        .header("Feature-Policy", "camera *; microphone *")
        .header("Permissions-Policy", "camera=*, microphone=*")
        .contentType(MediaType.TEXT_HTML)
        .body(
            """
                <!DOCTYPE html>
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
                #topBar{position:absolute;top:0;left:0;right:0;padding:env(safe-area-inset-top,28px) 20px 0;z-index:20}
                #topCard{display:inline-block;background:rgba(0,0,0,0.45);border-radius:12px;padding:10px 14px}
                #topName{font-size:15px;font-weight:600}
                #topStatus{font-size:12px;color:rgba(255,255,255,0.85);margin-top:2px}
                #controls{position:absolute;bottom:0;left:0;right:0;padding:0 0 calc(env(safe-area-inset-bottom,20px) + 20px);display:flex;align-items:center;justify-content:center;gap:22px;z-index:20}
                .ctrl{width:62px;height:62px;border-radius:31px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent}
                .ctrl-normal{background:rgba(255,255,255,0.18)}
                .ctrl-active{background:#fff}
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
                  <div id="errorBox"><div id="errorMsg"></div><button onclick="closeCall()" style="background:#ef4444;border:none;color:#fff;padding:12px 28px;border-radius:24px;font-size:15px;cursor:pointer;margin-top:8px">Fermer</button></div>
                </div>
                <script>
                (function(){
                  var p=new URLSearchParams(location.search);
                  var token=p.get('token')||'',callId=p.get('callId')||'',peerId=p.get('peerId')||'';
                  var direction=p.get('direction')||'outgoing',kind=p.get('kind')||'video';
                  var peerName=decodeURIComponent(p.get('peerName')||'Correspondant');
                  var domain=p.get('domain')||location.host;
                  document.getElementById('peerLabel').textContent=peerName;
                  document.getElementById('topName').textContent=peerName;
                  var colors=['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899'];
                  var ci=0;for(var i=0;i<peerId.length;i++)ci=(ci*31+peerId.charCodeAt(i))&0x7fffffff;
                  document.getElementById('avatarCircle').style.background=colors[ci%colors.length];
                  document.getElementById('avatarCircle').textContent=peerName.trim().charAt(0).toUpperCase()||'?';
                  if(kind==='video')document.getElementById('videoBtn').style.display='flex';
                  var isMuted=false,isVideoOff=false,localStream=null,pc=null,ws=null,ended=false,pending=[],remoteSet=false;
                  function setStatus(t){document.getElementById('statusLabel').textContent=t;document.getElementById('topStatus').textContent=t;}
                  function closeCall(){if(typeof window.ReactNativeWebView!=='undefined'){window.ReactNativeWebView.postMessage(JSON.stringify({type:'call-ended'}));}else{window.close();}}
                  function hangup(notify){if(ended)return;ended=true;if(notify&&ws&&ws.readyState===1)ws.send(JSON.stringify({type:'call-end',to:peerId,callId:callId}));if(pc){try{pc.close();}catch(e){}pc=null;}if(localStream){localStream.getTracks().forEach(function(t){t.stop();});localStream=null;}setStatus('Appel terminé');setTimeout(closeCall,1200);}
                  document.getElementById('endBtn').onclick=function(){hangup(true);};
                  document.getElementById('muteBtn').onclick=function(){isMuted=!isMuted;if(localStream)localStream.getAudioTracks().forEach(function(t){t.enabled=!isMuted;});document.getElementById('muteBtn').textContent=isMuted?'🔇':'🎤';};
                  document.getElementById('videoBtn').onclick=function(){isVideoOff=!isVideoOff;if(localStream)localStream.getVideoTracks().forEach(function(t){t.enabled=!isVideoOff;});document.getElementById('videoBtn').textContent=isVideoOff?'🚫':'📹';};
                  async function getMedia(){try{localStream=await navigator.mediaDevices.getUserMedia({audio:true,video:kind==='video'?{facingMode:'user'}:false});document.getElementById('localVideo').srcObject=localStream;if(kind!=='video')document.getElementById('localVideo').style.display='none';return true;}catch(e){document.getElementById('errorMsg').textContent='Caméra/Micro inaccessible: '+e.message;document.getElementById('errorBox').classList.add('show');return false;}}
                  function createPeer(){pc=new RTCPeerConnection({iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}]});pc.ontrack=function(e){var s=e.streams&&e.streams[0];if(!s)return;document.getElementById('remoteVideo').srcObject=s;if(kind==='video')document.getElementById('avatar').style.display='none';setStatus('En appel');};pc.onicecandidate=function(e){if(e.candidate&&ws&&ws.readyState===1)ws.send(JSON.stringify({type:'ice-candidate',to:peerId,callId:callId,candidate:e.candidate.toJSON()}));};pc.onconnectionstatechange=function(){if(pc.connectionState==='failed'){setStatus('Connexion perdue');setTimeout(function(){hangup(false);},2000);}};if(localStream)localStream.getTracks().forEach(function(t){pc.addTrack(t,localStream);});}
                  async function sendOffer(){try{var o=await pc.createOffer({offerToReceiveAudio:true,offerToReceiveVideo:kind==='video'});await pc.setLocalDescription(o);ws.send(JSON.stringify({type:'webrtc-offer',to:peerId,callId:callId,sdp:pc.localDescription}));setStatus('Connexion en cours…');}catch(e){document.getElementById('errorMsg').textContent='Erreur: '+e.message;document.getElementById('errorBox').classList.add('show');}}
                  async function handleOffer(sdp,from){try{await pc.setRemoteDescription(new RTCSessionDescription(sdp));remoteSet=true;for(var i=0;i<pending.length;i++){try{await pc.addIceCandidate(new RTCIceCandidate(pending[i]));}catch(e){}}pending=[];var a=await pc.createAnswer();await pc.setLocalDescription(a);ws.send(JSON.stringify({type:'webrtc-answer',to:from||peerId,callId:callId,sdp:pc.localDescription}));setStatus('Connexion en cours…');}catch(e){}}
                  async function handleAnswer(sdp){try{await pc.setRemoteDescription(new RTCSessionDescription(sdp));remoteSet=true;for(var i=0;i<pending.length;i++){try{await pc.addIceCandidate(new RTCIceCandidate(pending[i]));}catch(e){}}pending=[];}catch(e){}}
                  async function handleIce(c){if(!pc)return;if(!remoteSet){pending.push(c);return;}try{await pc.addIceCandidate(new RTCIceCandidate(c));}catch(e){}}
                  async function start(){var proto=location.protocol==='https:'?'wss':'ws';ws=new WebSocket(proto+'://'+domain+'/ws/signal?token='+encodeURIComponent(token));ws.onerror=function(){document.getElementById('errorMsg').textContent='Impossible de se connecter au serveur.';document.getElementById('errorBox').classList.add('show');};ws.onclose=function(){if(!ended)setStatus('Connexion perdue');};ws.onopen=async function(){var ok=await getMedia();if(!ok)return;createPeer();if(direction==='outgoing'){setStatus('Sonnerie…');}else{setStatus('Connexion…');ws.send(JSON.stringify({type:'call-ready',to:peerId,callId:callId}));}};ws.onmessage=async function(ev){var msg;try{msg=JSON.parse(ev.data);}catch(e){return;}if(msg.type==='call-accept'&&direction==='outgoing'){await sendOffer();return;}if(msg.type==='call-ready'&&direction==='outgoing'){await sendOffer();return;}if(msg.type==='webrtc-offer'){await handleOffer(msg.sdp,msg.from);return;}if(msg.type==='webrtc-answer'){await handleAnswer(msg.sdp);return;}if(msg.type==='ice-candidate'){await handleIce(msg.candidate);return;}if(msg.type==='call-reject'){setStatus('Appel refusé');setTimeout(function(){hangup(false);},1500);return;}if(msg.type==='call-end'){setStatus('Appel terminé');setTimeout(function(){hangup(false);},1200);return;}if(msg.type==='peer-offline'){setStatus('Correspondant hors ligne');setTimeout(function(){hangup(false);},2000);return;}};}
                  start();
                })();
                </script>
                </body>
                </html>
                            """);
  }
}