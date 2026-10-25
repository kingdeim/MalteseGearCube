"use strict";
// 3D-Ansicht des Maltese Gear Cube mit animierten Zügen (Three.js r158, klassisches Skript).
// Nutzt Geometrie und Zustandsmodell aus index.html (FACES, FRAME, SLOTS, quarter() …);
// diese werden erst beim Aufruf gebraucht, daher darf diese Datei vorher geladen werden.
const Cube3D=(()=>{
  let renderer=null,scene,camera,world,container,pieces=[],shown=null;
  // Ansicht: Die Kamera steht fest; gedreht wird der Würfel (world) – frei in alle Richtungen, ohne Anschlag
  let dist=6.4,needRender=false,anim=null;
  const DEF_YAW=0.62,DEF_PITCH=0.52,DEF_DIST=6.4;
  let orient=null; // Quaternion der Würfeldrehung
  const SURF=1.0,LIFT=0.001,THICK=0.004,GEAR_DEPTH=0.06; // Farbflächen hauchdünn, Zahnradkörper
  const RING_W=0.12,RING_IN=0.6,CORE_R=0.62; // halbe Breite des Mittelrings, Innenkante der Mitten, Kern
  const EDGE_HEAD=0.84,EDGE_HW=0.095,STEM_IN=0.45; // Kantenkopf ab 0.84, halbe Breite längs der Kante, Stielbeginn
  const GEAR_TILT=25; // Neigung der Zahnradachse in Grad (180° gedreht → doppelt so schief)
  const CORNER_FLOOR=0.88; // Oberkante des Ecksockels; darauf stehen die Sterne als flache Platten
  const CORNER_IN=0.3;     // Sockel beginnt erst hier: breiter freier Kanal um die Mittelringe für wandernde Zahnräder
  const GEAR_DIP=0.14;     // so weit taucht ein Zahnrad beim Weg über die Würfelkante nach innen ab
  const BODY_GROW=0.065; // schwarzer Körper der Ecksterne ca. 2 mm größer als die Farbfläche

  // ---------- Materialien ----------
  const mats={};
  const cssColor=k=>getComputedStyle(document.documentElement).getPropertyValue(`--c${k}`).trim()||"#888";
  const faceMat=k=>mats[k]||(mats[k]=new THREE.MeshStandardMaterial({color:cssColor(k),roughness:0.5,metalness:0.0}));
  let BODY;

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
  function plate(face,pts,material,smooth,w=SURF+LIFT,depth=THICK){
    const s=new THREE.Shape(),P=pts.map(([u,v])=>[u,-v]);
    if(smooth){
      const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],n=P.length,m0=mid(P[n-1],P[0]);
      s.moveTo(m0[0],m0[1]);
      for(let i=0;i<n;i++){const m=mid(P[i],P[(i+1)%n]);s.quadraticCurveTo(P[i][0],P[i][1],m[0],m[1]);}
    }else{s.moveTo(P[0][0],P[0][1]);for(let i=1;i<P.length;i++)s.lineTo(P[i][0],P[i][1]);}
    const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:2});
    g.applyMatrix4(faceMatrix(face,w));
    return new THREE.Mesh(g,material);
  }
  const rotUV=(pts,deg,du=0,dv=0)=>{const a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return pts.map(([u,v])=>[u*c-v*s+du,u*s+v*c+dv]);};
  function box(x0,x1,y0,y1,z0,z1,material){
    const g=new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0);g.translate((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);
    return new THREE.Mesh(g,material);
  }
  // Umriss um d nach außen vergrößern (für die schwarzen Körper unter den Farbflächen).
  // Robust über ein Raster: Polygon füllen, alles im Abstand ≤ d dazunehmen, Kontur mit
  // Marching Squares nachzeichnen, vereinfachen. So entstehen in engen Kehlen keine Schleifen.
  // Abstand der Sternarme (Körper) zur hohlen Ecke: dort liegen die Wände der Aussparung bündig an
  const holeEdge=body=>Math.min(HOLE0,Math.max(...body.filter(p=>p[1]<-0.62).map(p=>-p[0])));
  function growOutline(pts,d,cell=0.004){
    const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),m=d+3*cell;
    const x0=Math.min(...xs)-m,y0=Math.min(...ys)-m,W=Math.ceil((Math.max(...xs)+m-x0)/cell)+1,H=Math.ceil((Math.max(...ys)+m-y0)/cell)+1;
    const n=pts.length,G=new Uint8Array(W*H);
    const inside=(x,y)=>{let c=false;for(let i=0,j=n-1;i<n;j=i++){const[a,b]=pts[i],[e,f]=pts[j];if((b>y)!==(f>y)&&x<(e-a)*(y-b)/(f-b)+a)c=!c;}return c;};
    const near=(x,y)=>{for(let i=0,j=n-1;i<n;j=i++){const[a,b]=pts[j],[e,f]=pts[i],dx=e-a,dy=f-b,L=dx*dx+dy*dy||1;
      const t=Math.max(0,Math.min(1,((x-a)*dx+(y-b)*dy)/L)),qx=a+t*dx-x,qy=b+t*dy-y;if(qx*qx+qy*qy<=d*d)return true;}return false;};
    for(let j=1;j<H-1;j++)for(let i=1;i<W-1;i++){const x=x0+i*cell,y=y0+j*cell;if(inside(x,y)||near(x,y))G[j*W+i]=1;}
    // Marching Squares: Kantenstücke sammeln und zur längsten geschlossenen Kontur verketten
    const seg=new Map(),g=(i,j)=>G[j*W+i];
    for(let j=0;j<H-1;j++)for(let i=0;i<W-1;i++){
      const k=g(i,j)*8+g(i+1,j)*4+g(i+1,j+1)*2+g(i,j+1);if(k===0||k===15)continue;
      const T=`${2*i+1},${2*j}`,R=`${2*i+2},${2*j+1}`,B=`${2*i+1},${2*j+2}`,L=`${2*i},${2*j+1}`;
      const add=(a,b)=>seg.set(a,b);
      switch(k){case 1:add(B,L);break;case 2:add(R,B);break;case 3:add(R,L);break;case 4:add(T,R);break;case 5:add(T,L);add(B,R);break;
        case 6:add(T,B);break;case 7:add(T,L);break;case 8:add(L,T);break;case 9:add(B,T);break;case 10:add(L,B);add(R,T);break;
        case 11:add(R,T);break;case 12:add(L,R);break;case 13:add(B,R);break;case 14:add(L,B);break;}
    }
    const used=new Set();let best=[];
    for(const s of seg.keys()){if(used.has(s))continue;const loop=[];let c=s;
      while(c&&!used.has(c)){used.add(c);const[a,b]=c.split(",").map(Number);loop.push([x0+a/2*cell,y0+b/2*cell]);c=seg.get(c);}
      if(loop.length>best.length)best=loop;}
    // Treppenstufen entfernen: ausdünnen und glätten
    return smoothPts(best.filter((_,i)=>i%2===0),3);
  }
  let STAR_P,STAR_BODY,GEAR_P,HOLE3D;

  // ---------- Teile aufbauen ----------
  function cornerGroup(c){
    const g=new THREE.Group(),[sx,sy,sz]=c.pos,N=HOLE3D,F=CORNER_FLOOR; // hohle Ecke genau an der Außenkante der Sternarme
    const B=(a0,a1,b0,b1,c0,c1)=>{const iv=(s,p,q)=>s>0?[p,q]:[-q,-p];
      const[X0,X1]=iv(sx,a0,a1),[Y0,Y1]=iv(sy,b0,b1),[Z0,Z1]=iv(sz,c0,c1);g.add(box(X0,X1,Y0,Y1,Z0,Z1,BODY));};
    // Sockel bis CORNER_FLOOR, die hohle Würfelecke ausgespart (drei Quader)
    const I=CORNER_IN;B(I,N,I,F,I,F);B(N,F,I,N,I,F);B(N,F,N,F,I,N);
    // Keine eigenen Wandquader: Die Seitenflächen der (vergrößerten) Sternarme reichen genau bis an
    // die Aussparung und bilden zusammen mit dem Sockel die Wände der hohlen Ecke – rund wie die Sterne.
    // Pro Seite: schwarzer Körper in Sternform (folgt der Kontur) und darauf die etwas
    // kleinere Farbfläche, sodass ringsum ein schwarzer Rand bleibt – wie beim Original
    for(const face of ORDER){const n=FACES[face];if(dot(n,c.pos)<=0.5)continue;
      const[r,d]=FRAME[face],su=Math.sign(dot(c.pos,r)),sv=Math.sign(dot(c.pos,d));
      const col=homeFace(c.R,P3(face,su*0.5,sv*0.5));
      const deg={"-1,-1":0,"1,-1":90,"1,1":180,"-1,1":270}[su+","+sv];
      g.add(plate(face,rotUV(STAR_BODY,deg),BODY,true,F,SURF-F));
      const film=plate(face,rotUV(STAR_P,deg),faceMat(col),true);film.userData.sample=[face,su*0.5,sv*0.5];g.add(film);
    }
    return g;
  }
  // Kanten und Mitten sind starre Steine im Mittelring (Breite 2·RING_W quer zum Ring).
  // Sie werden in ihrer gelösten Lage gebaut und dann mit ihrer Drehung R aus der Simulation
  // transformiert. Eine Kante auf einem Mittenplatz ragt dadurch als Grat aus der Fläche,
  // eine Mitte auf einem Kantenplatz liegt vertieft – wie beim Original.
  function ecGroup(e){
    const g=new THREE.Group(),home=e.id.split(""),lo=new THREE.Vector3(),hi=new THREE.Vector3();
    // Mitte: Säule bis RING_IN; Kante: kleiner Kopf an der Würfelkante (EDGE_HEAD)
    const inner=home.length===1?RING_IN:EDGE_HEAD,half=home.length===1?CEN+0.012:EDGE_HW; // schwarzer Körper nur knapp größer als das Plättchen
    for(let i=0;i<3;i++){
      const f=home.map(k=>FACES[k]).find(v=>v[i]!==0);
      if(f){const s=f[i];lo.setComponent(i,s>0?inner:-1);hi.setComponent(i,s>0?1:-inner);}
      else{lo.setComponent(i,-half);hi.setComponent(i,half);}
    }
    if(home.length===1)g.add(box(lo.x,hi.x,lo.y,hi.y,lo.z,hi.z,BODY)); // Mitte: Säule
    if(home.length===2){
      // Kantenstein aus einem Stück: Stiel diagonal zum Kern, oben das „Dach“ der Würfelkante.
      // Querschnitt = Fünfeck (Breite des Kopfs bis zu seiner breitesten Stelle, dann Spitze).
      const A=V(FACES[home[0]]),Bv=V(FACES[home[1]]),dir=A.clone().add(Bv).normalize();
      const across=A.clone().sub(Bv).normalize(),axis=new THREE.Vector3().crossVectors(across,dir);
      const r0=STEM_IN,r1=(1+EDGE_HEAD)/Math.SQRT2,h=(1-EDGE_HEAD)/Math.SQRT2;
      const s=new THREE.Shape();
      s.moveTo(-h,r0);s.lineTo(h,r0);s.lineTo(h,r1);s.lineTo(0,Math.SQRT2);s.lineTo(-h,r1);s.lineTo(-h,r0);
      const geo=new THREE.ExtrudeGeometry(s,{depth:2*EDGE_HW,bevelEnabled:false});
      geo.translate(0,0,-EDGE_HW);
      geo.applyMatrix4(new THREE.Matrix4().makeBasis(across,dir,axis));
      g.add(new THREE.Mesh(geo,BODY));
    }
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
  // Zahnräder drehen sich um eine leicht geneigte Achse (GEAR_TILT, zur Würfelkante hin geneigt).
  // In gelöster Lage liegen sie flach; bei 90° stehen sie über eine Diagonale schief,
  // bei 180° am stärksten (doppelter Neigungswinkel).
  function gearFrame(g){
    const f=V(g.f),d=V(g.d),P=V(g.P),b=GEAR_TILT*Math.PI/180;
    const axle=f.clone().multiplyScalar(Math.cos(b)).addScaledVector(d,Math.sin(b)).normalize();
    const theta=Math.atan2(new THREE.Vector3().crossVectors(d,P).dot(f),d.dot(P));
    const spin=new THREE.Quaternion().setFromAxisAngle(axle,theta);
    const base=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(d,new THREE.Vector3().crossVectors(f,d),f));
    return {c:V(add(g.f,scl(g.d,GEAR_DRAW))),spin,q:spin.clone().multiply(base)};
  }
  function gearGroup(gp){
    const g=new THREE.Group(),face=letter(gp.f),[du,dv]=localDir(face,gp.d).map(Math.round);
    // flach mit Ausrichtung zur Kante bauen, dann um die geneigte Achse drehen
    // schwarzer Zahnradkörper (Oberseite bündig mit der Fläche) plus dünne Farbschicht
    const ang=Math.atan2(dv,du)*180/Math.PI,pts=rotUV(GEAR_P,ang,du*GEAR_DRAW,dv*GEAR_DRAW);
    const parts=[plate(face,pts,BODY,true,SURF-GEAR_DEPTH,GEAR_DEPTH),plate(face,rotUV(GEAR_P,ang,du*GEAR_DRAW,dv*GEAR_DRAW),faceMat(gp.id[0]),true)];
    const{c,spin}=gearFrame(gp),M=new THREE.Matrix4().makeTranslation(c.x,c.y,c.z).multiply(new THREE.Matrix4().makeRotationFromQuaternion(spin)).multiply(new THREE.Matrix4().makeTranslation(-c.x,-c.y,-c.z));
    for(const m of parts){m.geometry.applyMatrix4(M);g.add(m);}
    return g;
  }
  // Formen-Zwischenspeicher: Die Geometrie eines Teils hängt nur von seinem Platz (Ecken), seiner
  // Drehung (Kanten/Mitten) bzw. Platz und Ausrichtung (Zahnräder) ab – nicht von seiner Farbe.
  // Einmal berechnete Formen werden wiederverwendet; neu entstehen nur die (billigen) Meshes.
  // Ein Eintrag ist eine Liste von {geo, mat} bzw. {geo, sample:[Seite,u,v]} für Farbflächen der Ecken.
  const GEO=new Map();
  function fromTemplate(key,make,matOf){
    let tpl=GEO.get(key);
    if(!tpl){tpl=make().children.map(m=>({geo:m.geometry,mat:m.material,sample:m.userData.sample||null}));GEO.set(key,tpl);}
    const g=new THREE.Group();
    for(const t of tpl)g.add(new THREE.Mesh(t.geo,matOf(t)));
    return g;
  }
  const rk=R=>R.flat().map(x=>Math.round(x*1e4)).join(",");
  function cornerPiece(c){
    return fromTemplate("c"+c.pos.join(","),()=>cornerGroup(c),t=>t.sample?faceMat(homeFace(c.R,P3(...t.sample))):t.mat);
  }
  function ecPiece(e){return fromTemplate("e"+e.id+"|"+rk(e.R),()=>ecGroup(e),t=>t.mat);}
  function gearPiece(gp){
    const th=Math.round(Math.atan2(dot(cross(gp.d,gp.P),gp.f),dot(gp.d,gp.P))*180/Math.PI);
    return fromTemplate("g"+letter(gp.f)+letter(gp.d)+"|"+th,()=>gearGroup(gp),t=>t.mat===BODY?BODY:faceMat(gp.id[0]));
  }
  function build(st){
    for(const p of pieces)world.remove(p.group); // Geometrien bleiben im Zwischenspeicher
    pieces=[];
    for(const c of st.corners){const grp=cornerPiece(c);pieces.push({kind:"c",id:c.id,group:grp});world.add(grp);}
    for(const e of st.ecs){const grp=ecPiece(e);pieces.push({kind:"e",id:e.id,group:grp});world.add(grp);}
    for(const gp of st.gears){const grp=gearPiece(gp);pieces.push({kind:"g",id:gp.id,group:grp});world.add(grp);}
    for(const p of pieces)p.group.matrixAutoUpdate=false; // Lage wird nur noch über die Matrix gesetzt
    shown=st;requestRender();
  }

  // ---------- Animation eines Viertelzugs ----------
  const V=a=>new THREE.Vector3(...a);
  const gearPose=g=>gearFrame(g);
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
        const r=w0.length()+(w1.length()-w0.length())*t-GEAR_DIP*Math.sin(Math.PI*t); // Bogen nach innen
        const ct=w0.clone().normalize().applyAxisAngle(ax,phi*t).multiplyScalar(r).addScaledVector(ax,h);
        return {q:qt,p:ct.sub(a.c.clone().applyQuaternion(qt))};
      });
    }
    return out;
  }
  const ease=t=>t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  // Anfahren/Abbremsen nur am Anfang und Ende eines Schritts, dazwischen gleichmäßig
  const easeIn=t=>-t*t*t+2*t*t, easeOut=t=>1-easeIn(1-t);
  const ONE=typeof THREE!=="undefined"?new THREE.Vector3(1,1,1):null;
  let finalState=null;
  // Spielt eine Liste von Viertelzügen ab; liefert ein Promise, das nach dem letzten Zug erfüllt ist.
  // Der Würfel wird dafür nicht neu aufgebaut: Zeigt die Szene schon st0, werden die vorhandenen
  // Teile bewegt (Gruppenmatrix = Bewegung(t) · Lage davor) und bleiben am Ende einfach stehen.
  // st1 (optional) ist die Zielstellung; wird sie mitgegeben, erkennt der nächste Aufruf sie wieder.
  // Das ist auf langsamen Geräten (Handy) entscheidend – ein Neuaufbau kann dort Sekunden dauern.
  function play(st0,quarters,per=400,st1=null){
    stop();
    if(!renderer||!quarters.length)return Promise.resolve();
    finalState=st1||quarters.reduce((s,q)=>{applyQ(s,q);return s;},clone(st0));
    if(shown!==st0)build(st0);
    return new Promise(resolve=>{
      const n=quarters.length;let st=clone(st0),i=0,mv=null,base=null,t0=0;
      const begin=start=>{const end=clone(st);applyQ(end,quarters[i]);mv=motions(st,end,quarters[i]);st=end;
        base=new Map(pieces.map(p=>[p,p.group.matrix.clone()]));t0=start;};
      const pose=e=>{for(const p of pieces){const f=mv.get(p.kind+p.id);if(!f)continue;const m=f(e);
        p.group.matrix.compose(m.p,m.q,ONE).multiply(base.get(p));}};
      anim={resolve,
        // für „Pause“: aktuelle Vierteldrehung fertig stellen
        // (ist es die letzte, gilt die übergebene Zielstellung – so entfällt der nächste Neuaufbau)
        snap:()=>{if(!mv)return {st,done:i};pose(1);return {st:i+1>=n&&finalState?finalState:st,done:i+1};},
        frame:now=>{
          if(!mv)begin(now);
          const t=Math.min(1,(now-t0)/per);
          pose(n===1?ease(t):i===0?easeIn(t):i===n-1?easeOut(t):t);
          if(t>=1){
            i++;
            if(i>=n){anim=null;shown=finalState;finalState=null;resolve();}
            else begin(Math.max(now-per,t0+per)); // nahtlos weiter, bei starkem Ruckeln nicht nachholen
          }
        }};
      loop();
    });
  }
  // Bricht eine laufende Animation sofort ab und zeigt die Stellung nach der gerade laufenden
  // Vierteldrehung; liefert die Zahl der damit fertigen Vierteldrehungen (oder null)
  function stop(){if(!anim)return null;const r=anim.resolve,s=anim.snap();anim=null;finalState=null;shown=s.st;requestRender();r();return s.done;}

  // ---------- Szene, Kamera, Bedienung ----------
  const resetView=()=>{dist=DEF_DIST;orient=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),DEF_PITCH)
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-DEF_YAW));};
  function placeCamera(){
    camera.position.set(0,0,dist);camera.lookAt(0,0,0);
    world.quaternion.copy(orient);requestRender();
  }
  // Ziehen um dx/dy Pixel: Drehung um die Bildschirmachsen (hoch = y, rechts = x), beliebig weit
  function dragRotate(dx,dy){
    const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),dx*0.01)
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),dy*0.01));
    orient=q.multiply(orient).normalize();placeCamera();
  }
  function requestRender(){needRender=true;loop();}
  let looping=false;
  function loop(){if(looping)return;looping=true;requestAnimationFrame(tick);}
  function tick(now){
    looping=false;
    // Fehler während der Animation dürfen sie nicht einfrieren: Endstellung zeigen und melden
    if(anim){try{anim.frame(now);}catch(e){const a=anim;anim=null;console.error(e);
      try{build(finalState||shown);}catch(_){}finalState=null;a.resolve();
      window.dispatchEvent(new CustomEvent("cube3d-error",{detail:String(e&&e.message||e)}));}}
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
    STAR_P=smoothPts(STAR_SYM);GEAR_P=smoothPts(GEAR_PATH);STAR_BODY=growOutline(STAR_P,BODY_GROW);HOLE3D=holeEdge(STAR_BODY);
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
    // Ein Finger/Maus: drehen; zwei Finger: zoomen (Abstand der Finger)
    const ptrs=new Map();let pinch=0;
    const spread=()=>{const[a,b]=[...ptrs.values()];return Math.hypot(a.x-b.x,a.y-b.y)||1;};
    cv.addEventListener("pointerdown",e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});cv.setPointerCapture(e.pointerId);cv.style.cursor="grabbing";
      if(ptrs.size===2)pinch=spread();});
    cv.addEventListener("pointermove",e=>{const p=ptrs.get(e.pointerId);if(!p)return;
      if(ptrs.size===1)dragRotate(e.clientX-p.x,e.clientY-p.y);
      p.x=e.clientX;p.y=e.clientY;
      if(ptrs.size===2){const s=spread();dist=Math.max(4,Math.min(14,dist*pinch/s));pinch=s;placeCamera();}});
    const up=e=>{ptrs.delete(e.pointerId);if(!ptrs.size)cv.style.cursor="grab";};
    cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);
    cv.addEventListener("wheel",e=>{e.preventDefault();dist=Math.max(4,Math.min(14,dist*(e.deltaY>0?1.08:1/1.08)));placeCamera();},{passive:false});
    cv.addEventListener("dblclick",()=>{resetView();placeCamera();});
    new ResizeObserver(resize).observe(el);
    resetView();resize();placeCamera();
    return true;
  }
  // Neuaufbau nur, wenn wirklich eine andere Stellung gezeigt werden soll
  function show(st){stop();if(renderer&&st!==shown)build(st);}
  // Die angezeigte Stellung entspricht st (z. B. nach „Pause“): spart den Neuaufbau
  function adopt(st){if(!anim)shown=st;}
  return {mount,show,play,stop,adopt,get ready(){return !!renderer;}};
})();
