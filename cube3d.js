"use strict";
// 3D-Ansicht des Maltese Gear Cube mit animierten Zügen (Three.js r158, klassisches Skript).
// Nutzt Geometrie und Zustandsmodell aus index.html (FACES, FRAME, SLOTS, quarter() …);
// diese werden erst beim Aufruf gebraucht, daher darf diese Datei vorher geladen werden.
const Cube3D=(()=>{
  let renderer=null,scene,camera,world,container,pieces=[],shown=null;
  let yaw=0.62,pitch=0.52,dist=6.4,needRender=false,anim=null;
  const DEF={yaw:0.62,pitch:0.52,dist:6.4};
  const SURF=1.0,LIFT=0.004,THICK=0.03;
  const RING_W=0.12,RING_IN=0.6,CORE_R=0.62; // halbe Breite des Mittelrings, Innenkante der Ringsteine, Kern

  // ---------- Materialien ----------
  const mats={};
  const cssColor=k=>getComputedStyle(document.documentElement).getPropertyValue(`--c${k}`).trim()||"#888";
  const faceMat=k=>mats[k]||(mats[k]=new THREE.MeshStandardMaterial({color:cssColor(k),roughness:0.5,metalness:0.0}));
  let BODY,HOLE;

  // ---------- Geometrie-Helfer ----------
  // Abbildung Seitenkoordinaten (u nach rechts, v nach unten, w nach außen) → Welt.
  // v wird gespiegelt, damit die Abbildung orientierungserhaltend ist (Normalen zeigen nach außen).
  function faceMatrix(face,w){
    const[r,d]=FRAME[face],n=FACES[face];
    const m=new THREE.Matrix4();
    m.makeBasis(new THREE.Vector3(...r),new THREE.Vector3(...scl(d,-1)),new THREE.Vector3(...n));
    m.setPosition(...scl(n,w));
    return m;
  }
  // Polygon (Liste von [u,v]) als dünnes Plättchen auf einer Seite; smooth = weiche Kurve durch Mittelpunkte
  function plate(face,pts,material,smooth){
    const s=new THREE.Shape(),P=pts.map(([u,v])=>[u,-v]);
    if(smooth){
      const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],n=P.length,m0=mid(P[n-1],P[0]);
      s.moveTo(m0[0],m0[1]);
      for(let i=0;i<n;i++){const m=mid(P[i],P[(i+1)%n]);s.quadraticCurveTo(P[i][0],P[i][1],m[0],m[1]);}
    }else{s.moveTo(P[0][0],P[0][1]);for(let i=1;i<P.length;i++)s.lineTo(P[i][0],P[i][1]);}
    const g=new THREE.ExtrudeGeometry(s,{depth:THICK,bevelEnabled:false,curveSegments:2});
    g.applyMatrix4(faceMatrix(face,SURF+LIFT));
    return new THREE.Mesh(g,material);
  }
  const rotUV=(pts,deg,du=0,dv=0)=>{const a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return pts.map(([u,v])=>[u*c-v*s+du,u*s+v*c+dv]);};
  function box(x0,x1,y0,y1,z0,z1,material){
    const g=new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0);g.translate((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);
    return new THREE.Mesh(g,material);
  }
  let STAR_P,GEAR_P;

  // ---------- Teile aufbauen ----------
  function cornerGroup(c){
    const g=new THREE.Group(),[sx,sy,sz]=c.pos,N=HOLE0;
    // Oktant ohne die hohle Würfelecke: drei Quader
    const B=(a0,a1,b0,b1,c0,c1,m)=>{const iv=(s,p,q)=>s>0?[p,q]:[-q,-p];
      const[X0,X1]=iv(sx,a0,a1),[Y0,Y1]=iv(sy,b0,b1),[Z0,Z1]=iv(sz,c0,c1);g.add(box(X0,X1,Y0,Y1,Z0,Z1,m));};
    // Ecken lassen die drei Mittelringe (|x|,|y|,|z| < RING_W) frei
    B(RING_W,N,RING_W,1,RING_W,1,BODY);B(N,1,RING_W,N,RING_W,1,BODY);B(N,1,N,1,RING_W,N,BODY);
    B(N,N+0.02,N,1,N,1,HOLE);B(N,1,N,N+0.02,N,1,HOLE);B(N,1,N,1,N,N+0.02,HOLE); // dunkle Innenseiten der Öffnung
    for(const face of ORDER){const n=FACES[face];if(dot(n,c.pos)<=0.5)continue;
      const[r,d]=FRAME[face],su=Math.sign(dot(c.pos,r)),sv=Math.sign(dot(c.pos,d));
      const col=homeFace(c.R,P3(face,su*0.5,sv*0.5));
      const deg={"-1,-1":0,"1,-1":90,"1,1":180,"-1,1":270}[su+","+sv];
      g.add(plate(face,rotUV(STAR_P,deg),faceMat(col),true));
    }
    return g;
  }
  // Kanten und Mitten sind starre Steine im Mittelring (Breite 2·RING_W quer zum Ring).
  // Sie werden in ihrer gelösten Lage gebaut und dann mit ihrer Drehung R aus der Simulation
  // transformiert. Eine Kante auf einem Mittenplatz ragt dadurch als Grat aus der Fläche,
  // eine Mitte auf einem Kantenplatz liegt vertieft – wie beim Original.
  function ecGroup(e){
    const g=new THREE.Group(),home=e.id.split(""),lo=new THREE.Vector3(),hi=new THREE.Vector3();
    for(let i=0;i<3;i++){
      const f=home.map(k=>FACES[k]).find(v=>v[i]!==0);
      if(f){const s=f[i];lo.setComponent(i,s>0?RING_IN:-1);hi.setComponent(i,s>0?1:-RING_IN);}
      else{lo.setComponent(i,-RING_W);hi.setComponent(i,RING_W);}
    }
    g.add(box(lo.x,hi.x,lo.y,hi.y,lo.z,hi.z,BODY));
    for(const face of home){
      let region;
      if(home.length===1)region=rect(-CEN,-CEN,CEN,CEN);
      else{const nb=home.find(k=>k!==face),[du,dv]=localDir(face,FACES[nb]).map(Math.round);region=stubRect(du,dv);}
      g.add(plate(face,region,faceMat(face),false));
    }
    const R=e.R,m=new THREE.Matrix4().set(R[0][0],R[0][1],R[0][2],0,R[1][0],R[1][1],R[1][2],0,R[2][0],R[2][1],R[2][2],0,0,0,0,1);
    g.children.forEach(c=>c.geometry.applyMatrix4(m));
    return g;
  }
  function gearGroup(gp){
    const g=new THREE.Group(),face=letter(gp.f),[du,dv]=localDir(face,gp.d).map(Math.round),[pu,pv]=localDir(face,gp.P);
    const ang=Math.atan2(pv,pu)*180/Math.PI;
    g.add(plate(face,rotUV(GEAR_P,ang,du*GEAR_DRAW,dv*GEAR_DRAW),faceMat(gp.id[0]),true));
    return g;
  }
  function build(st){
    for(const p of pieces){world.remove(p.group);p.group.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
    pieces=[];
    for(const c of st.corners){const grp=cornerGroup(c);pieces.push({kind:"c",id:c.id,group:grp});world.add(grp);}
    for(const e of st.ecs){const grp=ecGroup(e);pieces.push({kind:"e",id:e.id,group:grp});world.add(grp);}
    for(const gp of st.gears){const grp=gearGroup(gp);pieces.push({kind:"g",id:gp.id,group:grp});world.add(grp);}
    shown=st;requestRender();
  }

  // ---------- Animation eines Viertelzugs ----------
  const V=a=>new THREE.Vector3(...a);
  function gearPose(g){const X=V(g.P).normalize(),Z=V(g.f),Y=new THREE.Vector3().crossVectors(Z,X);
    return {c:V(add(g.f,scl(g.d,GEAR_DRAW))),q:new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X,Y,Z))};}
  // Liefert pro Teil eine Funktion t∈[0,1] → (Quaternion, Position) der Gruppe
  function motions(st0,st1,q){
    const out=new Map(),whole="xyz".includes(q.face),sense=q.prime?-1:1;
    const n=V(whole?FACES[{x:"R",y:"U",z:"F"}[q.face]]:FACES[q.face]),nA=n.toArray();
    const rigid=deg=>t=>({q:new THREE.Quaternion().setFromAxisAngle(n,deg*Math.PI/180*t),p:new THREE.Vector3()});
    const half=rigid(-90*sense),ring=rigid(-45*sense);
    for(const c of st0.corners)if(whole||dot(c.pos,nA)>EPS)out.set("c"+c.id,half);
    for(const e of st0.ecs){const d=dot(e.dir,nA);if(whole||d>EPS)out.set("e"+e.id,half);else if(Math.abs(d)<EPS)out.set("e"+e.id,ring);}
    for(const g of st0.gears){const p=add(g.f,scl(g.d,GEAR_R));
      if(whole||dot(p,nA)>EPS){out.set("g"+g.id,half);continue;}
      if(Math.abs(dot(g.f,nA))>EPS||Math.abs(dot(g.d,nA))>EPS)continue;
      // Zahnrad im Ring: Weg um die Achse, Ausrichtung per Slerp vom Start- zum Zielzustand
      const a=gearPose(g),b=gearPose(st1.gears.find(x=>x.id===g.id));
      const ax=n.clone(),w0=a.c.clone().projectOnPlane(ax),w1=b.c.clone().projectOnPlane(ax),h=a.c.dot(ax);
      const phi=Math.atan2(new THREE.Vector3().crossVectors(w0,w1).dot(ax),w0.dot(w1));
      const qInv=a.q.clone().invert();
      out.set("g"+g.id,t=>{
        const qt=a.q.clone().slerp(b.q,t).multiply(qInv);
        const r=w0.length()+(w1.length()-w0.length())*t;
        const ct=w0.clone().normalize().applyAxisAngle(ax,phi*t).multiplyScalar(r).addScaledVector(ax,h);
        return {q:qt,p:ct.sub(a.c.clone().applyQuaternion(qt))};
      });
    }
    return out;
  }
  const ease=t=>t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  // Spielt eine Liste von Viertelzügen ab; liefert ein Promise, das nach dem letzten Zug erfüllt ist
  function play(st0,quarters,dur=320){
    stop();
    if(!renderer)return Promise.resolve();
    return new Promise(resolve=>{
      let st=clone(st0),i=0;
      const per=quarters.length>8?Math.max(110,dur*8/quarters.length):dur;
      const next=()=>{
        if(i>=quarters.length){anim=null;resolve();return;}
        const q=quarters[i++],end=clone(st);applyQ(end,q);
        build(st);const mv=motions(st,end,q),t0=performance.now();
        anim={resolve,frame:now=>{
          const t=Math.min(1,(now-t0)/per),e=ease(t);
          for(const p of pieces){const f=mv.get(p.kind+p.id);if(!f)continue;const m=f(e);p.group.quaternion.copy(m.q);p.group.position.copy(m.p);}
          if(t>=1){st=end;next();if(!anim)build(st);}
        }};
      };
      next();loop();
    });
  }
  function stop(){if(anim){const r=anim.resolve;anim=null;r();}}

  // ---------- Szene, Kamera, Bedienung ----------
  function placeCamera(){
    camera.position.set(dist*Math.cos(pitch)*Math.sin(yaw),dist*Math.sin(pitch),dist*Math.cos(pitch)*Math.cos(yaw));
    camera.lookAt(0,0,0);requestRender();
  }
  function requestRender(){needRender=true;loop();}
  let looping=false;
  function loop(){if(looping)return;looping=true;requestAnimationFrame(tick);}
  function tick(now){
    looping=false;
    if(anim)anim.frame(now);
    if(renderer&&(needRender||anim)){renderer.render(scene,camera);needRender=false;}
    if(anim)loop();
  }
  function resize(){
    if(!renderer)return;const w=container.clientWidth||300,h=Math.round(w*1.05);
    renderer.setSize(w,h,false);renderer.domElement.style.width="100%";renderer.domElement.style.height="auto";
    camera.aspect=w/h;camera.updateProjectionMatrix();requestRender();
  }
  function mount(el){
    container=el;
    if(renderer){el.appendChild(renderer.domElement);resize();return true;}
    if(typeof THREE==="undefined")return false;
    BODY=new THREE.MeshStandardMaterial({color:0x141416,roughness:0.35,metalness:0.15});
    HOLE=new THREE.MeshStandardMaterial({color:0x050506,roughness:0.9});
    STAR_P=smoothPts(STAR_TL);GEAR_P=smoothPts(GEAR_PATH);
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    scene=new THREE.Scene();world=new THREE.Group();scene.add(world);
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(CORE_R,32,16),BODY)); // fester Kern
    camera=new THREE.PerspectiveCamera(35,1,0.1,100);
    scene.add(new THREE.HemisphereLight(0xffffff,0x444450,1.6));
    const d1=new THREE.DirectionalLight(0xffffff,2.2);d1.position.set(3,5,4);scene.add(d1);
    const d2=new THREE.DirectionalLight(0xffffff,0.7);d2.position.set(-4,-2,-3);scene.add(d2);
    el.appendChild(renderer.domElement);
    const cv=renderer.domElement;cv.style.touchAction="none";cv.style.cursor="grab";
    let drag=null;
    cv.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId);cv.style.cursor="grabbing";});
    cv.addEventListener("pointermove",e=>{if(!drag)return;yaw-=(e.clientX-drag.x)*0.01;pitch=Math.max(-1.45,Math.min(1.45,pitch+(e.clientY-drag.y)*0.01));drag={x:e.clientX,y:e.clientY};placeCamera();});
    const up=()=>{drag=null;cv.style.cursor="grab";};
    cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);
    cv.addEventListener("wheel",e=>{e.preventDefault();dist=Math.max(4,Math.min(14,dist*(e.deltaY>0?1.08:1/1.08)));placeCamera();},{passive:false});
    cv.addEventListener("dblclick",()=>{({yaw,pitch,dist}=DEF);placeCamera();});
    new ResizeObserver(resize).observe(el);
    resize();placeCamera();
    return true;
  }
  function show(st){stop();if(renderer)build(st);}
  return {mount,show,play,stop,get ready(){return !!renderer;}};
})();
