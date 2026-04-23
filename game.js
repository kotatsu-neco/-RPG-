const SAVE_KEY = 'garugal_prototype_save_v1';

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

const assets = {};
const assetPaths = {
  village: 'assets/village.png',
  korupanHouse: 'assets/korupan_house.png',
  rurugarHouse: 'assets/rurugar_house.png',
  mogamoHouse: 'assets/mogamo_house.png',
  cemetery: 'assets/cemetery.png',
  hero: 'assets/hero.png',
  land: 'assets/land.png',
  bird: 'assets/bird.png'
};

const state = {
  scene: 'home',
  player: { x: 720, y: 900, dir: 'down', moving: false, frameTick: 0, animFrame: 1 },
  land: { x: 640, y: 940, dir: 'down', animFrame: 1 },
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
  overlayMessage: '',
};

const scenes = {
  home: {
    image: 'korupanHouse',
    spawn: { x: 720, y: 930 },
    bounds: { x1: 70, y1: 110, x2: 1370, y2: 980 },
    hotspots: [
      { id:'note', label:'母のメモ', x: 1040, y: 240, w: 170, h: 130, visible: s => s.progress === 0, action: 'readNote' },
      { id:'door', label:'外へ', x: 640, y: 965, w: 160, h: 85, visible: s => s.progress >= 1, action: 'goVillageFromHome' },
      { id:'land', label:'ランド', x: 1180, y: 900, w: 180, h: 120, visible: s => s.progress === 0, action: 'talkLandHome' }
    ]
  },
  village: {
    image: 'village',
    spawn: { x: 705, y: 980 },
    bounds: { x1: 40, y1: 40, x2: 1408, y2: 1045 },
    hotspots: [
      { id:'rurugarExt', label:'ルルガーの家', x: 560, y: 110, w: 350, h: 280, visible: s => true, action: 'enterRurugar' },
      { id:'homeExt', label:'コルパンの家', x: 585, y: 650, w: 250, h: 220, visible: s => true, action: 'enterHome' },
      { id:'mogamoExt', label:'モガモの家', x: 825, y: 645, w: 260, h: 250, visible: s => true, action: 'enterMogamo' },
      { id:'mel', label:'メル', x: 590, y: 450, w: 120, h: 120, visible: s => s.progress === 4, action: 'meetMel' },
      { id:'father', label:'メルの父', x: 210, y: 610, w: 260, h: 240, visible: s => s.progress === 5, action: 'deliverFather' },
      { id:'villagerA', label:'配達先A', x: 840, y: 445, w: 220, h: 205, visible: s => s.progress === 6 && !s.lettersDone.villagerA, action: 'deliverVillagerA' },
      { id:'villagerB', label:'配達先B', x: 1080, y: 680, w: 240, h: 260, visible: s => s.progress === 6 && !s.lettersDone.villagerB, action: 'deliverVillagerB' },
      { id:'cemeteryGate', label:'村はずれへ', x: 40, y: 140, w: 240, h: 270, visible: s => s.progress >= 8, action: 'goCemetery' },
      { id:'reportRurugar', label:'ルルガーへ報告', x: 560, y: 110, w: 350, h: 280, visible: s => s.progress === 12, action: 'reportRurugar' }
    ]
  },
  rurugar: {
    image: 'rurugarHouse',
    spawn: { x: 724, y: 960 },
    bounds: { x1: 60, y1: 50, x2: 1390, y2: 1010 },
    hotspots: [
      { id:'table', label:'食卓', x: 520, y: 350, w: 420, h: 240, visible: s => s.progress === 2, action: 'lunchEvent' },
      { id:'door', label:'外へ', x: 610, y: 975, w: 180, h: 80, visible: s => s.progress >= 4 && s.progress !== 13, action: 'exitToVillage' },
      { id:'mail', label:'手紙の束', x: 1005, y: 785, w: 300, h: 200, visible: s => s.progress === 3, action: 'mailScene' },
      { id:'endDoor', label:'外へ', x: 610, y: 975, w: 180, h: 80, visible: s => s.progress === 13, action: 'endDemo' }
    ]
  },
  mogamo: {
    image: 'mogamoHouse',
    spawn: { x: 210, y: 900 },
    bounds: { x1: 50, y1: 40, x2: 1390, y2: 1025 },
    hotspots: [
      { id:'mogamoTalk', label:'モガモ', x: 170, y: 170, w: 350, h: 260, visible: s => s.progress === 7, action: 'mogamoReveal' },
      { id:'exit', label:'村へ戻る', x: 160, y: 935, w: 190, h: 95, visible: s => s.progress >= 8, action: 'backToVillage' }
    ]
  },
  cemetery: {
    image: 'cemetery',
    spawn: { x: 170, y: 180 },
    bounds: { x1: 30, y1: 30, x2: 1410, y2: 1040 },
    hotspots: [
      { id:'migamu', label:'ミガムの墓', x: 895, y: 635, w: 220, h: 185, visible: s => s.progress === 9, action: 'inspectMigamu' },
      { id:'returnPath', label:'村へ戻る', x: 60, y: 80, w: 210, h: 230, visible: s => s.progress >= 10, action: 'leaveCemetery' }
    ]
  }
};

function loadAssets() {
  return Promise.all(Object.entries(assetPaths).map(([key, src]) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { assets[key] = img; resolve(); };
    img.src = src;
  })));
}

function saveGame() {
  const saveData = {
    scene: state.scene,
    progress: state.progress,
    melJoined: state.melJoined,
    lettersDone: state.lettersDone,
    autoTriggered: state.autoTriggered,
    objective: state.objective,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
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
  state.battle.playerHp = 18;
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
  nextDialogueBtn.onclick = () => advanceDialogue(onComplete);
  advanceDialogue(onComplete);
}

function advanceDialogue(onComplete) {
  const next = state.dialogueQueue.shift();
  if (!next) {
    dialogueBox.classList.add('hidden');
    state.currentDialogue = null;
    if (onComplete) onComplete();
    return;
  }
  state.currentDialogue = next;
  dialogueName.textContent = next.name;
  dialogueText.textContent = next.text;
}

function updateObjective() {
  const messages = {
    0: '目的：机の上の母さんのメモを読む。',
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
  objectiveBox.textContent = state.objective + (state.melJoined ? '\n同行：メル / モガモ' : '');
}

function warpToScene(sceneName, resetFollowers=true) {
  state.scene = sceneName;
  const sc = scenes[sceneName];
  const spawn = sc.spawn;
  state.player.x = spawn.x;
  state.player.y = spawn.y;
  state.player.dir = 'down';
  state.player.animFrame = 1;
  if (resetFollowers) {
    state.land.x = spawn.x - 60;
    state.land.y = spawn.y + 40;
    state.land.dir = 'down';
  }
}

function triggerSceneAuto() {
  const key = `${state.scene}_${state.progress}`;
  if (state.autoTriggered[key]) return;

  if (state.scene === 'home' && state.progress === 0) {
    state.autoTriggered[key] = true;
    showDialogue([
      { name:'ナレーション', text:'両親が出発した次の日の朝。\n家の中は少し静かだ。' },
      { name:'ナレーション', text:'机の上に、母さんの走り書きのメモが置いてある。' }
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
        { name:'母のメモ', text:'急に決まって、先に出ます。\nお父さんの友だちのコットさんのお見舞いです。わたしも一緒に行ってきます。' },
        { name:'母のメモ', text:'お願い\n・ルルガーおじさんの様子を毎日見に行く\n・できたら手伝う\n・ごはんは一緒に食べる\n・ランドのごはん\n・ランドの散歩\n\n3日くらいで帰れると思います。よろしく！\n母' }
      ], () => {
        state.progress = 1;
        updateObjective();
        saveGame();
      });
      break;
    case 'talkLandHome':
      showDialogue([{ name:'ランド', text:'わふ……。しっぽをふって、コルパンを見上げている。' }], saveGame);
      break;
    case 'goVillageFromHome':
      warpToScene('village');
      updateObjective();
      saveGame();
      break;
    case 'enterRurugar':
      warpToScene('rurugar');
      triggerSceneAuto();
      saveGame();
      break;
    case 'enterHome':
      warpToScene('home');
      saveGame();
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
    case 'enterMogamo':
      warpToScene('mogamo');
      saveGame();
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
      showDialogue([
        { name:'試作版', text:'ここまででガーガル村の導入イベントは終了です。\n続きは今後の拡張で実装できます。' }
      ], saveGame);
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
}

function endBattleWin() {
  state.battle.active = false;
  battleOverlay.classList.add('hidden');
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

function battleAction(kind) {
  if (!state.battle.active || state.battle.turnLocked) return;
  state.battle.turnLocked = true;
  let playerText = '';
  let damage = 0;
  if (kind === 'attack') {
    damage = 5;
    playerText = 'コルパンの矢が鳥に当たった。';
  } else if (kind === 'skill') {
    damage = 8;
    playerText = 'ねらいうち！ 鳥の動きを見切って深く命中した。';
  } else if (kind === 'item') {
    playerText = 'まだ使える道具はない。';
  } else if (kind === 'run') {
    playerText = '夕飯のおかずを前にして、逃げるわけにはいかない。';
  }
  if (damage > 0) {
    state.battle.enemyHp = Math.max(0, state.battle.enemyHp - damage);
  }
  enemyHpText.textContent = `敵HP: ${state.battle.enemyHp} / 12`;
  if (state.battle.enemyHp <= 0) {
    battleLog.textContent = playerText + '\n鳥は倒れた。';
    setTimeout(endBattleWin, 900);
    return;
  }
  const enemyText = '鳥はばたいて突いてきたが、大きな傷にはならなかった。';
  battleLog.textContent = playerText + '\n' + enemyText;
  setTimeout(() => { state.battle.turnLocked = false; }, 350);
}

document.querySelectorAll('[data-battle]').forEach(btn => btn.addEventListener('click', () => battleAction(btn.dataset.battle)));

function updatePlayer() {
  if (dialogueBox.classList.contains('hidden') === false || state.battle.active) return;
  const speed = 4;
  let dx = 0, dy = 0;
  if (state.move.left) dx -= speed;
  if (state.move.right) dx += speed;
  if (state.move.up) dy -= speed;
  if (state.move.down) dy += speed;
  state.player.moving = dx !== 0 || dy !== 0;
  if (dx !== 0 || dy !== 0) {
    state.player.x += dx;
    state.player.y += dy;
    const b = scenes[state.scene].bounds;
    state.player.x = Math.max(b.x1, Math.min(b.x2, state.player.x));
    state.player.y = Math.max(b.y1, Math.min(b.y2, state.player.y));
    if (Math.abs(dx) > Math.abs(dy)) state.player.dir = dx > 0 ? 'right' : 'left';
    else state.player.dir = dy > 0 ? 'down' : 'up';
  }
  state.player.frameTick = (state.player.frameTick + 1) % 24;
  if (state.player.moving && state.player.frameTick % 8 === 0) {
    state.player.animFrame = (state.player.animFrame + 1) % 3;
  }
  if (!state.player.moving) state.player.animFrame = 1;

  // Land follow
  const tx = state.player.x - 54;
  const ty = state.player.y + 42;
  state.land.x += (tx - state.land.x) * 0.08;
  state.land.y += (ty - state.land.y) * 0.08;
  state.land.dir = state.player.dir;
  state.land.animFrame = state.player.moving ? state.player.animFrame : 1;

  state.nearHotspot = getNearHotspot();
  interactBtn.style.display = state.nearHotspot ? 'block' : 'none';
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const scene = scenes[state.scene];
  const bg = assets[scene.image];
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  // debug hotspots prototype markers
  const scaleX = canvas.width / 1448;
  const scaleY = canvas.height / 1086;
  for (const h of availableHotspots()) {
    ctx.fillStyle = state.nearHotspot && state.nearHotspot.id === h.id ? 'rgba(255, 221, 120, 0.35)' : 'rgba(80, 160, 220, 0.16)';
    ctx.strokeStyle = state.nearHotspot && state.nearHotspot.id === h.id ? 'rgba(255, 220, 120, 0.9)' : 'rgba(180, 220, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.fillRect(h.x * scaleX, h.y * scaleY, h.w * scaleX, h.h * scaleY);
    ctx.strokeRect(h.x * scaleX, h.y * scaleY, h.w * scaleX, h.h * scaleY);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(h.x * scaleX, (h.y - 22) * scaleY, Math.max(70, h.label.length * 18), 22);
    ctx.fillStyle = '#fff6d6';
    ctx.font = '14px sans-serif';
    ctx.fillText(h.label, h.x * scaleX + 8, (h.y - 6) * scaleY);
  }

  // draw sprites
  drawDog();
  drawHero();
}

function drawHero() {
  const dirRow = { down:0, left:1, right:2, up:3 };
  const size = 362;
  const dw = 52, dh = 52;
  const sx = state.player.animFrame * size;
  const sy = dirRow[state.player.dir] * size;
  const dx = state.player.x / 1448 * canvas.width - dw / 2;
  const dy = state.player.y / 1086 * canvas.height - dh / 2;
  ctx.drawImage(assets.hero, sx, sy, size, size, dx, dy, dw, dh);
}

function drawDog() {
  const dirRow = { down:0, left:1, right:2, up:3 };
  const size = 362;
  const dw = 58, dh = 58;
  const sx = state.land.animFrame * size;
  const sy = dirRow[state.land.dir] * size;
  const dx = state.land.x / 1448 * canvas.width - dw / 2;
  const dy = state.land.y / 1086 * canvas.height - dh / 2;
  ctx.drawImage(assets.land, sx, sy, size, size, dx, dy, dw, dh);
}

function loop() {
  updatePlayer();
  drawScene();
  requestAnimationFrame(loop);
}

function interact() {
  if (state.currentDialogue || state.battle.active) return;
  const hotspot = state.nearHotspot;
  if (!hotspot) return;
  handleAction(hotspot.action);
}

function setupControls() {
  document.querySelectorAll('[data-dir]').forEach(btn => {
    const dir = btn.dataset.dir;
    const start = e => { e.preventDefault(); state.move[dir] = true; };
    const end = e => { e.preventDefault(); state.move[dir] = false; };
    btn.addEventListener('touchstart', start, { passive:false });
    btn.addEventListener('touchend', end, { passive:false });
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
    btn.addEventListener('mouseleave', end);
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
  });
}

loadAssets().then(() => {
  setupControls();
  objectiveBox.textContent = '準備完了';
  requestAnimationFrame(loop);
});
