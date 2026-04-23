const SAVE_KEY = 'garugal_prototype_save_v4';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const titleScreen = document.getElementById('titleScreen');
const gameScreen = document.getElementById('gameScreen');
const objectiveBox = document.getElementById('objectiveBox');
const interactBtn = document.getElementById('interactBtn');
const dialogueBox = document.getElementById('dialogueBox');
const dialogueName = document.getElementById('dialogueName');
const dialogueText = document.getElementById('dialogueText');
const nextDialogueBtn = document.getElementById('nextDialogueBtn');
const battleOverlay = document.getElementById('battleOverlay');
const battleLog = document.getElementById('battleLog');
const enemyHpText = document.getElementById('enemyHpText');
const controls = document.getElementById('controls');

const WORLD_W = 1448;
const WORLD_H = 1086;
let camera = { x: 0, y: 0, w: WORLD_W, h: WORLD_H };

const assets = {};
const assetPaths = {
  village: 'assets/village.png',
  korupanHouse: 'assets/korupan_house.png',
  rurugarHouse: 'assets/rurugar_house.png',
  mogamoHouse: 'assets/mogamo_house.png',
  cemetery: 'assets/cemetery.png',
  hero: 'assets/hero.png',
  land: 'assets/land.png',
  bird: 'assets/bird.png',
  rurugar: 'assets/rurugar.png',
  taart: 'assets/taart.png',
  meru: 'assets/meru.png',
  mogamo: 'assets/mogamo.png',
  meruFather: 'assets/meru_father.png',
  lumina: 'assets/lumina.png'
};

const state = {
  scene: 'home',
  player: { x: 720, y: 930, dir: 'down', moving: false, frameTick: 0, animFrame: 1 },
  land: { x: 1185, y: 905, dir: 'left', animFrame: 1, follow: false },
  move: { up: false, down: false, left: false, right: false },
  dialogueQueue: [],
  currentDialogue: null,
  objective: '',
  progress: 0,
  melJoined: false,
  lettersDone: { father:false, villagerA:false, villagerB:false },
  battle: { active: false, enemyHp: 12, playerHp: 18, turnLocked: false },
  nearHotspot: null,
  autoTriggered: {},
  transitionCooldown: 0,
};

function setControlsDisabled(disabled) {
  if (!controls) return;
  controls.classList.toggle('disabled', !!disabled);
}


const scenes = {
  home: {
    image: 'korupanHouse',
    spawn: { x: 720, y: 930 },
    bounds: { x1: 84, y1: 110, x2: 1362, y2: 994 },
    zoom: 1.52,
    hotspots: [
      { id:'note', label:'母のメモ', x: 635, y: 445, w: 170, h: 110, visible: () => true, action: 'readNote' },
      { id:'land', label:'ランド', x: 1120, y: 820, w: 180, h: 150, visible: () => state.scene === 'home' && !state.land.follow, action: 'talkLandHome' }
    ],
    exitZones: [
      { x: 620, y: 945, w: 160, h: 85, visible: s => s.progress >= 1, action: 'goVillageFromHome' }
    ]
  },
  village: {
    image: 'village',
    spawn: { x: 705, y: 980 },
    bounds: { x1: 40, y1: 40, x2: 1408, y2: 1045 },
    zoom: 2.15,
    hotspots: [
      { id:'mel', label:'メル', x: 650, y: 500, w: 120, h: 120, visible: s => s.progress === 4, action: 'meetMel' },
      { id:'father', label:'メルの父', x: 255, y: 710, w: 180, h: 180, visible: s => s.progress === 5, action: 'deliverFather' },
      { id:'villagerA', label:'配達先A', x: 930, y: 520, w: 160, h: 170, visible: s => s.progress === 6 && !s.lettersDone.villagerA, action: 'deliverVillagerA' },
      { id:'villagerB', label:'配達先B', x: 1140, y: 770, w: 160, h: 170, visible: s => s.progress === 6 && !s.lettersDone.villagerB, action: 'deliverVillagerB' },
      { id:'cemeteryGate', label:'村はずれへ', x: 40, y: 140, w: 240, h: 270, visible: s => s.progress >= 8, action: 'goCemetery' }
    ],
    autoZones: [
      { id:'enterRurugar', x: 675, y: 324, w: 95, h: 55, visible: s => s.progress !== 12, action: 'enterRurugar' },
      { id:'reportRurugar', x: 675, y: 324, w: 95, h: 55, visible: s => s.progress === 12, action: 'reportRurugar' },
      { id:'enterHome', x: 673, y: 835, w: 98, h: 50, visible: () => true, action: 'enterHome' },
      { id:'enterMogamo', x: 938, y: 850, w: 98, h: 50, visible: () => true, action: 'enterMogamo' }
    ]
  },
  rurugar: {
    image: 'rurugarHouse',
    spawn: { x: 724, y: 945 },
    bounds: { x1: 82, y1: 84, x2: 1372, y2: 996 },
    zoom: 1.44,
    hotspots: [
      { id:'rurugarTalk', label:'ルルガー', x: 1005, y: 255, w: 140, h: 170, visible: s => s.progress >= 2, action: 'talkRurugarAmbient' },
      { id:'taartTalk', label:'タート', x: 1115, y: 775, w: 120, h: 145, visible: s => s.progress === 3, action: 'mailScene' },
      { id:'table', label:'食卓', x: 560, y: 405, w: 300, h: 150, visible: s => s.progress === 2, action: 'lunchEvent' },
      { id:'mail', label:'手紙の束', x: 1065, y: 825, w: 145, h: 95, visible: s => s.progress === 3, action: 'mailScene' }
    ],
    exitZones: [
      { x: 620, y: 945, w: 170, h: 85, visible: s => s.progress >= 4 && s.progress !== 13, action: 'exitToVillage' },
      { x: 620, y: 945, w: 170, h: 85, visible: s => s.progress === 13, action: 'endDemo' }
    ]
  },
  mogamo: {
    image: 'mogamoHouse',
    spawn: { x: 210, y: 930 },
    bounds: { x1: 70, y1: 70, x2: 1375, y2: 1010 },
    zoom: 1.40,
    hotspots: [
      { id:'mogamoTalk', label:'モガモ', x: 210, y: 235, w: 145, h: 180, visible: s => s.progress === 7, action: 'mogamoReveal' }
    ],
    exitZones: [
      { x: 160, y: 945, w: 170, h: 82, visible: s => s.progress >= 8, action: 'backToVillage' }
    ]
  },
  cemetery: {
    image: 'cemetery',
    spawn: { x: 170, y: 180 },
    bounds: { x1: 30, y1: 30, x2: 1410, y2: 1040 },
    zoom: 1.82,
    hotspots: [
      { id:'migamu', label:'ミガムの墓', x: 895, y: 635, w: 220, h: 185, visible: s => s.progress === 9, action: 'inspectMigamu' },
      { id:'returnPath', label:'村へ戻る', x: 60, y: 80, w: 210, h: 230, visible: s => s.progress >= 10, action: 'leaveCemetery' }
    ]
  }
};

const sceneColliders = {
  home: [
    { x: 120, y: 150, w: 220, h: 215 },
    { x: 365, y: 140, w: 305, h: 85 },
    { x: 825, y: 125, w: 510, h: 105 },
    { x: 1180, y: 220, w: 160, h: 160 },
    { x: 545, y: 430, w: 350, h: 140 },
    { x: 1010, y: 615, w: 300, h: 110 },
    { x: 100, y: 815, w: 260, h: 95 },
    { x: 1130, y: 815, w: 220, h: 95 }
  ],
  rurugar: [
    { x: 82, y: 84, w: 1288, h: 24 },
    { x: 115, y: 135, w: 275, h: 140 },
    { x: 500, y: 145, w: 235, h: 155 },
    { x: 990, y: 130, w: 265, h: 165 },
    { x: 560, y: 405, w: 300, h: 150 },
    { x: 1040, y: 760, w: 250, h: 150 },
    { x: 120, y: 760, w: 195, h: 120 }
  ],
  mogamo: [
    { x: 95, y: 95, w: 370, h: 145 },
    { x: 100, y: 430, w: 250, h: 130 },
    { x: 520, y: 120, w: 185, h: 175 },
    { x: 805, y: 130, w: 430, h: 165 },
    { x: 850, y: 400, w: 320, h: 175 },
    { x: 900, y: 690, w: 260, h: 70 }
  ],
  village: [
    { x: 560, y: 100, w: 350, h: 220 },
    { x: 580, y: 650, w: 255, h: 165 },
    { x: 825, y: 645, w: 260, h: 185 },
    { x: 300, y: 650, w: 160, h: 140 },
    { x: 1120, y: 420, w: 150, h: 120 }
  ],
  cemetery: []
};

function makeFallbackSprite(label, w=96, h=96, fill='#775c36') {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = fill;
  x.fillRect(0, 0, w, h);
  x.strokeStyle = '#f2eedf';
  x.lineWidth = 4;
  x.strokeRect(2, 2, w - 4, h - 4);
  x.fillStyle = '#f2eedf';
  x.font = '16px sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(label, w / 2, h / 2);
  const img = new Image();
  img.src = c.toDataURL('image/png');
  return img;
}

function loadAssets() {
  return Promise.all(Object.entries(assetPaths).map(([key, src]) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { assets[key] = img; resolve(); };
    img.onerror = () => {
      console.warn('asset load failed:', src);
      assets[key] = makeFallbackSprite(key.slice(0, 6));
      resolve();
    };
    img.src = src;
  })));
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    scene: state.scene,
    progress: state.progress,
    melJoined: state.melJoined,
    lettersDone: state.lettersDone,
    autoTriggered: state.autoTriggered,
    objective: state.objective,
  }));
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    state.scene = data.scene || 'home';
    state.progress = data.progress || 0;
    state.melJoined = !!data.melJoined;
    state.lettersDone = data.lettersDone || { father:false, villagerA:false, villagerB:false };
    state.autoTriggered = data.autoTriggered || {};
    state.objective = data.objective || '';
    state.land.follow = state.progress >= 1;
    state.transitionCooldown = 0;
    warpToScene(state.scene, false);
    updateObjective();
    return true;
  } catch {
    return false;
  }
}

function resetState() {
  state.scene = 'home';
  state.progress = 0;
  state.melJoined = false;
  state.lettersDone = { father:false, villagerA:false, villagerB:false };
  state.autoTriggered = {};
  state.dialogueQueue = [];
  state.currentDialogue = null;
  state.battle.active = false;
  state.battle.enemyHp = 12;
  state.land.follow = false;
  warpToScene('home', false);
  updateObjective();
  localStorage.removeItem(SAVE_KEY);
}

function startGame(load=false) {
  titleScreen.classList.remove('active');
  gameScreen.classList.add('active');
  if (!load || !loadGame()) {
    resetState();
    triggerSceneAuto();
  }
  saveGame();
}

function showDialogue(queue, onComplete) {
  state.dialogueQueue = queue.slice();
  dialogueBox.classList.remove('hidden');
  setControlsDisabled(true);
  nextDialogueBtn.onclick = () => advanceDialogue(onComplete);
  advanceDialogue(onComplete);
}

function advanceDialogue(onComplete) {
  const next = state.dialogueQueue.shift();
  if (!next) {
    dialogueBox.classList.add('hidden');
    state.currentDialogue = null;
    setControlsDisabled(false);
    if (onComplete) onComplete();
    return;
  }
  state.currentDialogue = next;
  dialogueName.textContent = next.name;
  dialogueText.textContent = next.text;
}

function updateObjective() {
  const messages = {
    0: '目的：真ん中のテーブルにある母さんのメモを読む。',
    1: '目的：ランドと一緒にルルガーおじさんの家へ行く。',
    2: '目的：ルルガーの家で昼食の支度を手伝う。',
    3: '目的：玄関脇の手紙の束を確認する。',
    4: '目的：村の手紙を配る。まずはメルを探そう。',
    5: '目的：メルの父親に手紙を届ける。',
    6: '目的：残りの手紙を村人へ届ける。',
    7: '目的：最後の手紙をモガモさんへ届ける。',
    8: '目的：モガモさんとメルと一緒に村はずれの墓地へ向かう。',
    9: '目的：墓地で「ミガム」の墓を探す。',
    10: '目的：墓を確認した。村へ戻ろう。',
    11: '目的：野雉っぽい鳥と戦う。',
    12: '目的：ルルガーに報告して鳥を渡す。',
    13: '導入イベント完了：試作版はここまで。'
  };
  state.objective = messages[state.progress] || '試作版';
  objectiveBox.textContent = state.objective + (state.melJoined && state.progress >= 8 ? '\n同行：メル / モガモ' : state.melJoined ? '\n同行：メル' : '');
}

function warpToScene(sceneName, resetFollowers=true) {
  state.scene = sceneName;
  const sc = scenes[sceneName];
  state.player.x = sc.spawn.x;
  state.player.y = sc.spawn.y;
  state.player.dir = 'down';
  state.player.animFrame = 1;
  state.transitionCooldown = 18;
  if (resetFollowers) {
    if (sceneName === 'home' && !state.land.follow) {
      state.land.x = 1185; state.land.y = 905; state.land.dir = 'left';
    } else {
      state.land.x = sc.spawn.x - 60; state.land.y = sc.spawn.y + 40; state.land.dir = 'down';
    }
  }
}

function triggerSceneAuto() {
  const key = `${state.scene}_${state.progress}`;
  if (state.autoTriggered[key]) return;
  if (state.scene === 'home' && state.progress === 0) {
    state.autoTriggered[key] = true;
    showDialogue([
      { name:'ナレーション', text:'両親が出発した次の日の朝。\n家の中は少し静かだ。' },
      { name:'ナレーション', text:'部屋の真ん中のテーブルに、母さんの走り書きのメモが置いてある。' }
    ], saveGame);
  }
  if (state.scene === 'rurugar' && state.progress === 2) {
    state.autoTriggered[key] = true;
    showDialogue([
      { name:'ルルガー', text:'来たか、コルパン。ちょうど火の番を頼みたかったところだ。' },
      { name:'ルルガー', text:'腰は相変わらずだが、飯を作るくらいはできる。お前は野菜を刻んでくれ。' },
      { name:'コルパン', text:'うん。母さんにも、毎日様子を見に行けって言われてる。' }
    ], saveGame);
  }
}

function availableHotspots() {
  return scenes[state.scene].hotspots.filter(h => !h.visible || h.visible(state));
}

function getNearHotspot() {
  const px = state.player.x;
  const py = state.player.y;
  return availableHotspots().find(h => {
    const cx = h.x + h.w / 2;
    const cy = h.y + h.h / 2;
    return Math.abs(px - cx) < h.w / 2 + 70 && Math.abs(py - cy) < h.h / 2 + 70;
  }) || null;
}

function handleAction(action) {
  switch(action) {
    case 'readNote':
      showDialogue([
        { name:'母のメモ', text:`急に決まって、先に出ます。\nお父さんの友だちのコットさんのお見舞いです。わたしも一緒に行ってきます。` },
        { name:'母のメモ', text:`お願い\n・ルルガーおじさんの様子を毎日見に行く\n・できたら手伝う\n・ごはんは一緒に食べる\n・ランドのごはん\n・ランドの散歩\n\n3日くらいで帰れると思います。よろしく！\n母` }
      ], () => {
        if (state.progress === 0) {
          state.progress = 1;
          updateObjective();
        }
        saveGame();
      });
      break;
    case 'talkLandHome':
      showDialogue([{ name:'ランド', text:'わふ……。しっぽをふって、コルパンを見上げている。' }], saveGame);
      break;
    case 'goVillageFromHome':
      state.land.follow = true;
      warpToScene('village');
      updateObjective();
      saveGame();
      break;
    case 'enterRurugar':
      if (state.progress === 1) state.progress = 2;
      warpToScene('rurugar');
      updateObjective();
      triggerSceneAuto();
      saveGame();
      break;
    case 'enterHome':
      warpToScene('home');
      saveGame();
      break;
    case 'enterMogamo':
      warpToScene('mogamo');
      saveGame();
      break;
    case 'talkRurugarAmbient':
      showDialogue([{ name:'ルルガー', text:'今は昼の仕度と村のあれこれで手が離せん。必要があれば声をかけてくれ。' }], saveGame);
      break;
    case 'lunchEvent':
      showDialogue([
        { name:'ルルガー', text:'包丁を持つ手つきがずいぶん板についてきたな。' },
        { name:'コルパン', text:'父さんたちがいない間くらい、ちゃんとしないと。' },
        { name:'ルルガー', text:'張り切りすぎるな。だが、助かる。さあ、食べよう。' },
        { name:'ナレーション', text:'二人で昼食をとっていると、表から足音が聞こえた。' },
        { name:'タート', text:'よう、ルルガー村長。今日の分、置いてくぞ。' }
      ], () => {
        state.progress = 3;
        updateObjective();
        saveGame();
      });
      break;
    case 'mailScene':
      showDialogue([
        { name:'タート', text:'相変わらず腰はつらそうだな。無茶するなよ。' },
        { name:'ルルガー', text:'村の仕事は止められんのでな。……さて、仕分けるか。' },
        { name:'ルルガー', text:'ん？ これは……モガモさん宛か？ ミガム……。いや、たぶん見間違いでもなかろう。' },
        { name:'ルルガー', text:'コルパン、これをモガモさんに届けてくれ。ついでに他の分も頼む。' },
        { name:'コルパン', text:'わかった。配ってくる。' }
      ], () => {
        state.progress = 4;
        warpToScene('village');
        updateObjective();
        saveGame();
      });
      break;
    case 'exitToVillage':
    case 'backToVillage':
      warpToScene('village');
      updateObjective();
      saveGame();
      break;
    case 'meetMel':
      showDialogue([
        { name:'メル', text:'コルパン。そんなに手紙持って、また配達？' },
        { name:'コルパン', text:'うん。ルルガーおじさんに頼まれて。' },
        { name:'メル', text:'じゃ、わたしもついてく。どうせ暇だし。まずはうちに来るんでしょ？' }
      ], () => {
        state.melJoined = true;
        state.progress = 5;
        updateObjective();
        saveGame();
      });
      break;
    case 'deliverFather':
      showDialogue([
        { name:'メルの父', text:'おう、配達ご苦労さん。村長さんはどうだい？' },
        { name:'コルパン', text:'腰はまだつらそう。でも昼はちゃんと食べたよ。' },
        { name:'メル', text:'父さん、あとで店の板、打ち直してよ。' },
        { name:'メルの父', text:'はいはい。お前さんはコルパンの邪魔をするなよ。' }
      ], () => {
        state.lettersDone.father = true;
        state.progress = 6;
        updateObjective();
        saveGame();
      });
      break;
    case 'deliverVillagerA':
      showDialogue([
        { name:'店番の村人', text:'ありがとう。ちょうど仕入れの知らせを待ってたところだよ。' },
        { name:'メル', text:'コルパン、まだ何通かあるんでしょ。次、次。' }
      ], () => {
        state.lettersDone.villagerA = true;
        if (state.lettersDone.villagerA && state.lettersDone.villagerB) state.progress = 7;
        updateObjective();
        saveGame();
      });
      break;
    case 'deliverVillagerB':
      showDialogue([
        { name:'畑の村人', text:'おお、助かる。タートが来たってことは、町の種屋も動き出すかな。' },
        { name:'メル', text:'これで残りはモガモさん宛だけだね。' }
      ], () => {
        state.lettersDone.villagerB = true;
        if (state.lettersDone.villagerA && state.lettersDone.villagerB) state.progress = 7;
        updateObjective();
        saveGame();
      });
      break;
    case 'mogamoReveal':
      showDialogue([
        { name:'コルパン', text:'モガモさん、ルルガーおじさんから。' },
        { name:'モガモ', text:'……これは、私宛ではありませんね。宛名は「ミガム」です。' },
        { name:'メル', text:'ミガム？ モガモさんと似てるけど、全然違うじゃない。' },
        { name:'モガモ', text:'差出人はピョール。町の名はリントチャート。しかもこの封蝋……。' },
        { name:'モガモ', text:'百年以上前に滅んだ貴族の紋章です。どうして今さら……。' },
        { name:'モガモ', text:'ミガムという名、たしか村はずれの墓地で見た覚えがあります。\n少し確かめに行きませんか。' }
      ], () => {
        state.progress = 8;
        warpToScene('village');
        updateObjective();
        saveGame();
      });
      break;
    case 'goCemetery':
      warpToScene('cemetery');
      updateObjective();
      saveGame();
      break;
    case 'inspectMigamu':
      showDialogue([
        { name:'ナレーション', text:'一部は苔むしているが、刻まれた字はまだ読める。\nそこにはたしかに「ミガム」と彫られていた。' },
        { name:'メル', text:'ほんとにあった……。なんだか、ぞくっとするね。' },
        { name:'モガモ', text:'誤配では済みません。ですが、まずは村へ戻りましょう。\n考えるのはそれからです。' }
      ], () => {
        state.progress = 10;
        updateObjective();
        saveGame();
      });
      break;
    case 'leaveCemetery':
      showDialogue([
        { name:'ナレーション', text:'帰り道、草むらの向こうで羽音がした。' },
        { name:'メル', text:'あっ、あれ……野雉じゃない？' },
        { name:'コルパン', text:'ルルガーおじさんの好物だ。仕留められたら夕飯になる。' }
      ], () => {
        state.progress = 11;
        updateObjective();
        startBattle();
      });
      break;
    case 'reportRurugar':
      warpToScene('rurugar');
      showDialogue([
        { name:'ルルガー', text:'戻ったか。……その顔だと、何か見つかったな。' },
        { name:'コルパン', text:'墓地に、ミガムの墓があった。字もちゃんと読めたよ。' },
        { name:'モガモ', text:'封蝋も町名も、やはり普通ではありません。' },
        { name:'メル', text:'それと、帰りに野雉も取れた。今日はごちそうだよ。' },
        { name:'ルルガー', text:'……まずは飯にしよう。話はそのあとだ。\nいい一日とは言えんが、悪くもなかった。' }
      ], () => {
        state.progress = 13;
        updateObjective();
        saveGame();
      });
      break;
    case 'endDemo':
      showDialogue([{ name:'試作版', text:'ここまででガーガル村の導入イベントは終了です。\n続きは今後の拡張で実装できます。' }], saveGame);
      break;
  }
}

function startBattle() {
  state.battle.active = true;
  state.battle.enemyHp = 12;
  state.battle.turnLocked = false;
  enemyHpText.textContent = '敵HP: 12 / 12';
  battleLog.textContent = '野雉っぽい鳥がこちらをうかがっている。';
  battleOverlay.classList.remove('hidden');
  setControlsDisabled(true);
}

function endBattleWin() {
  state.battle.active = false;
  battleOverlay.classList.add('hidden');
  setControlsDisabled(false);
  showDialogue([
    { name:'ナレーション', text:'コルパンは鳥を仕留めた。今夜の食卓にのぼるだろう。' },
    { name:'メル', text:'やった。ルルガーおじさん、喜ぶね。' },
    { name:'モガモ', text:'では急ぎましょう。村で落ち着いて話を整理したい。' }
  ], () => {
    state.progress = 12;
    warpToScene('village');
    updateObjective();
    saveGame();
  });
}

document.querySelectorAll('[data-battle]').forEach(btn => btn.addEventListener('click', () => battleAction(btn.dataset.battle)));

function battleAction(kind) {
  if (!state.battle.active || state.battle.turnLocked) return;
  state.battle.turnLocked = true;
  let playerText = '';
  let damage = 0;
  if (kind === 'attack') {
    damage = 5; playerText = 'コルパンの矢が鳥に当たった。';
  } else if (kind === 'skill') {
    damage = 8; playerText = 'ねらいうち！ 鳥の動きを見切って深く命中した。';
  } else if (kind === 'item') {
    playerText = 'まだ使える道具はない。';
  } else if (kind === 'run') {
    playerText = '夕飯のおかずを前にして、逃げるわけにはいかない。';
  }
  if (damage > 0) state.battle.enemyHp = Math.max(0, state.battle.enemyHp - damage);
  enemyHpText.textContent = `敵HP: ${state.battle.enemyHp} / 12`;
  if (state.battle.enemyHp <= 0) {
    battleLog.textContent = playerText + '\n鳥は倒れた。';
    setTimeout(endBattleWin, 900);
    return;
  }
  battleLog.textContent = playerText + '\n鳥はばたいて突いてきたが、大きな傷にはならなかった。';
  setTimeout(() => { state.battle.turnLocked = false; }, 350);
}

function getPlayerRect(x = state.player.x, y = state.player.y) {
  return { x: x - 18, y: y - 16, w: 36, h: 32 };
}
function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function tryMoveAxis(axis, amount) {
  const b = scenes[state.scene].bounds;
  let candidateX = state.player.x;
  let candidateY = state.player.y;
  if (axis === 'x') candidateX += amount;
  if (axis === 'y') candidateY += amount;
  candidateX = Math.max(b.x1, Math.min(b.x2, candidateX));
  candidateY = Math.max(b.y1, Math.min(b.y2, candidateY));
  const rect = getPlayerRect(candidateX, candidateY);
  for (const block of (sceneColliders[state.scene] || [])) {
    if (intersects(rect, block)) return axis === 'x' ? state.player.x : state.player.y;
  }
  return axis === 'x' ? candidateX : candidateY;
}

function updatePlayer() {
  if (!dialogueBox.classList.contains('hidden') || state.battle.active) {
    state.move.up = state.move.down = state.move.left = state.move.right = false;
    return;
  }
  if (state.transitionCooldown > 0) state.transitionCooldown -= 1;

  const speed = 4;
  let dx = 0, dy = 0;
  if (state.move.left) dx -= speed;
  if (state.move.right) dx += speed;
  if (state.move.up) dy -= speed;
  if (state.move.down) dy += speed;
  state.player.moving = dx !== 0 || dy !== 0;

  if (dx !== 0 || dy !== 0) {
    if (Math.abs(dx) > Math.abs(dy)) state.player.dir = dx > 0 ? 'right' : 'left';
    else state.player.dir = dy > 0 ? 'down' : 'up';
    state.player.x = tryMoveAxis('x', dx);
    state.player.y = tryMoveAxis('y', dy);
  }

  state.player.frameTick = (state.player.frameTick + 1) % 24;
  if (state.player.moving && state.player.frameTick % 8 === 0) state.player.animFrame = (state.player.animFrame + 1) % 3;
  if (!state.player.moving) state.player.animFrame = 1;

  updateLand();
  state.nearHotspot = getNearHotspot();
  interactBtn.style.display = state.nearHotspot ? 'block' : 'none';
  checkAutoZone();
}

function updateLand() {
  const visibleFollowerScenes = ['village', 'cemetery'];
  if (state.scene === 'home' && !state.land.follow) {
    state.land.x = 1185; state.land.y = 905; state.land.dir = 'left'; state.land.animFrame = 1; return;
  }
  if (!visibleFollowerScenes.includes(state.scene) || !state.land.follow) return;
  const tx = state.player.x - 54, ty = state.player.y + 42;
  state.land.x += (tx - state.land.x) * 0.08;
  state.land.y += (ty - state.land.y) * 0.08;
  state.land.dir = state.player.dir;
  state.land.animFrame = state.player.moving ? state.player.animFrame : 1;
}

function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
function checkAutoZone() {
  if (state.transitionCooldown > 0) return;
  const zones = [ ...(scenes[state.scene].exitZones || []), ...(scenes[state.scene].autoZones || []) ];
  for (const z of zones) {
    if (z.visible && !z.visible(state)) continue;
    if (pointInRect(state.player.x, state.player.y, z)) { handleAction(z.action); break; }
  }
}

function updateCamera() {
  const zoom = scenes[state.scene].zoom || 1;
  camera.w = WORLD_W / zoom;
  camera.h = WORLD_H / zoom;
  camera.x = state.player.x - camera.w / 2;
  camera.y = state.player.y - camera.h / 2;
  camera.x = Math.max(0, Math.min(WORLD_W - camera.w, camera.x));
  camera.y = Math.max(0, Math.min(WORLD_H - camera.h, camera.y));
}
function worldToScreen(wx, wy) {
  return { x: (wx - camera.x) / camera.w * canvas.width, y: (wy - camera.y) / camera.h * canvas.height };
}

function drawSpriteSheet(img, wx, wy, dir, frame, sizeSrc=362, dw=64, dh=64) {
  if (!img) return;
  const dirRow = { down:0, left:1, right:2, up:3 };
  const sx = frame * sizeSrc;
  const sy = dirRow[dir] * sizeSrc;
  const pos = worldToScreen(wx, wy);
  const screenW = dw * (canvas.width / camera.w);
  const screenH = dh * (canvas.height / camera.h);
  ctx.drawImage(img, sx, sy, sizeSrc, sizeSrc, pos.x - screenW/2, pos.y - screenH/2, screenW, screenH);
}

function drawScene() {
  updateCamera();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const bg = assets[scenes[state.scene].image];
  ctx.drawImage(bg, camera.x, camera.y, camera.w, camera.h, 0, 0, canvas.width, canvas.height);
  drawHomeNote();
  drawStaticNPCs();
  drawDog();
  drawHero();
}

function drawHomeNote() {
  if (state.scene !== 'home') return;
  const p1 = worldToScreen(675, 462), p2 = worldToScreen(770, 515);
  const x = p1.x, y = p1.y, w = p2.x-p1.x, h = p2.y-p1.y;
  ctx.fillStyle = '#efe4be'; ctx.fillRect(x,y,w,h);
  ctx.strokeStyle = '#866f4a'; ctx.lineWidth = 2; ctx.strokeRect(x,y,w,h);
  ctx.fillStyle = '#8f7f60';
  for (let i=0;i<4;i++) ctx.fillRect(x+6, y+8+i*8, w-12, 2);
}

function drawHero() { drawSpriteSheet(assets.hero, state.player.x, state.player.y, state.player.dir, state.player.animFrame, 362, 66, 66); }
function drawDog() {
  const showDog = (state.scene === 'home' && !state.land.follow) || ['village','cemetery'].includes(state.scene);
  if (!showDog) return;
  drawSpriteSheet(assets.land, state.land.x, state.land.y, state.land.dir, state.land.animFrame, 362, 78, 78);
}

function label(text, wx, wy) {
  const p = worldToScreen(wx, wy);
  ctx.fillStyle = 'rgba(20,20,20,0.80)';
  ctx.fillRect(p.x-42, p.y-20, 84, 16);
  ctx.fillStyle = '#f2eedf';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, p.x, p.y-8);
}

function drawStaticNPCs() {
  if (state.scene === 'village') {
    drawSpriteSheet(assets.lumina, 1145, 485, 'down', 1, 362, 58, 58);
    label('ルミナ', 1145, 455);
    if (state.progress >= 4 && state.progress < 8) {
      drawSpriteSheet(assets.meru, 690, 560, 'down', 1, 362, 56, 56);
      label('メル', 690, 530);
    }
    if (state.progress >= 5) {
      drawSpriteSheet(assets.meruFather, 330, 780, 'down', 1, 362, 58, 58);
      label('メルの父', 330, 750);
    }
    if (state.progress === 6 && !state.lettersDone.villagerA) {
      drawSpriteSheet(assets.villagerFemaleA || assets.lumina, 980, 620, 'down', 1, 362, 54, 54);
    }
    if (state.progress === 6 && !state.lettersDone.villagerB) {
      drawSpriteSheet(assets.villagerMaleA || assets.meruFather, 1195, 860, 'down', 1, 362, 54, 54);
    }
  }
  if (state.scene === 'rurugar' && state.progress >= 2) {
    drawSpriteSheet(assets.rurugar, 1080, 320, 'down', 1, 362, 62, 62);
    label('ルルガー', 1080, 290);
    if (state.progress === 3) {
      drawSpriteSheet(assets.taart, 1150, 835, 'left', 1, 362, 58, 58);
      label('タート', 1150, 805);
    }
  }
  if (state.scene === 'mogamo') {
    drawSpriteSheet(assets.mogamo, 265, 300, 'down', 1, 362, 58, 58);
    label('モガモ', 265, 270);
  }
}

function interact() {
  if (state.currentDialogue || state.battle.active) return;
  const hotspot = state.nearHotspot;
  if (hotspot) handleAction(hotspot.action);
}

function setupControls() {
  document.querySelectorAll('[data-dir]').forEach(btn => {
    const dir = btn.dataset.dir;
    const start = e => { e.preventDefault(); state.move[dir] = true; };
    const end = e => { e.preventDefault(); state.move[dir] = false; };
    btn.addEventListener('touchstart', start, { passive:false });
    btn.addEventListener('touchend', end, { passive:false });
    btn.addEventListener('mousedown', start); btn.addEventListener('mouseup', end); btn.addEventListener('mouseleave', end);
  });
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'w') state.move.up = true;
    if (e.key === 'ArrowDown' || e.key === 's') state.move.down = true;
    if (e.key === 'ArrowLeft' || e.key === 'a') state.move.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') state.move.right = true;
    if (e.key === ' ' || e.key === 'Enter') interact();
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowUp' || e.key === 'w') state.move.up = false;
    if (e.key === 'ArrowDown' || e.key === 's') state.move.down = false;
    if (e.key === 'ArrowLeft' || e.key === 'a') state.move.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') state.move.right = false;
  });
  interactBtn.addEventListener('click', interact);
  document.getElementById('newGameBtn').addEventListener('click', () => startGame(false));
  document.getElementById('continueBtn').addEventListener('click', () => startGame(true));
  document.getElementById('resetBtn').addEventListener('click', () => {
    gameScreen.classList.remove('active');
    titleScreen.classList.add('active');
    dialogueBox.classList.add('hidden');
    battleOverlay.classList.add('hidden');
    setControlsDisabled(false);
  });
}

function loop() {
  updatePlayer();
  drawScene();
  requestAnimationFrame(loop);
}

setupControls();
objectiveBox.textContent = '読み込み中…';
loadAssets().then(() => {
  objectiveBox.textContent = '準備完了';
}).catch(() => {
  objectiveBox.textContent = '一部素材を読み込めませんでした';
});
requestAnimationFrame(loop);
