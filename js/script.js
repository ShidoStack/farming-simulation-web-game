
/* ================================================================
   CROP DATA
================================================================ */
const CROPS = [
  { id:'wheat',      name:'Wheat',      emoji:'🌾', cost:5,  growDays:2, basePrice:12, bestSeason:0, multiHarvest:1 },
  { id:'corn',       name:'Corn',       emoji:'🌽', cost:8,  growDays:3, basePrice:20, bestSeason:1, multiHarvest:1 },
  { id:'carrot',     name:'Carrot',     emoji:'🥕', cost:6,  growDays:2, basePrice:14, bestSeason:2, multiHarvest:1 },
  { id:'tomato',     name:'Tomato',     emoji:'🍅', cost:10, growDays:4, basePrice:28, bestSeason:1, multiHarvest:1 },
  { id:'potato',     name:'Potato',     emoji:'🥔', cost:7,  growDays:3, basePrice:18, bestSeason:2, multiHarvest:1 },
  { id:'pepper',     name:'Pepper',     emoji:'🌶️', cost:12, growDays:5, basePrice:36, bestSeason:1, multiHarvest:1 },
  { id:'blueberry',  name:'Blueberry',  emoji:'🫐', cost:15, growDays:4, basePrice:32, bestSeason:0, multiHarvest:3 },
  { id:'strawberry', name:'Strawberry', emoji:'🍓', cost:12, growDays:3, basePrice:26, bestSeason:0, multiHarvest:2 },
];

/* Seasons: 0=Spring 1=Summer 2=Autumn 3=Winter */
const SEASONS = [
  { name:'Spring', icon:'🌸' },
  { name:'Summer', icon:'☀️' },
  { name:'Autumn', icon:'🍂' },
  { name:'Winter', icon:'❄️' },
];

/* Weather types */
const WEATHERS = [
  { name:'Sunny',   icon:'☀️',  key:'sunny'   },
  { name:'Rainy',   icon:'🌧️',  key:'rainy'   },
  { name:'Storm',   icon:'⛈️',  key:'storm'   },
  { name:'Drought', icon:'🏜️',  key:'drought' },
];

/* Market events */
const MARKET_EVENTS = [
  { cropId:'corn',       name:'🌽 Corn Festival!',         multiplier:2.0, duration:3 },
  { cropId:'tomato',     name:'🍅 Tomato Shortage!',        multiplier:1.8, duration:2 },
  { cropId:'wheat',      name:'🌾 Wheat Demand Surge!',     multiplier:1.6, duration:2 },
  { cropId:'pepper',     name:'🌶️ Spice Festival!',         multiplier:2.2, duration:2 },
  { cropId:'blueberry',  name:'🫐 Berry Harvest Season!',   multiplier:1.9, duration:3 },
  { cropId:'strawberry', name:'🍓 Jam Factory Orders!',     multiplier:1.7, duration:3 },
  { cropId:'potato',     name:'🥔 Potato Shortage!',        multiplier:1.8, duration:2 },
];

/* ================================================================
   GAME STATE
================================================================ */
let state = {
  money:           150,
  score:           0,
  day:             1,
  season:          0,
  weather:         'sunny',
  totalPlots:      10,
  expandCost:      80,
  plots:           [],
  selectedCrop:    null,
  activeTool:      'plant',
  harvest:         {},
  marketPrices:    {},
  marketEvent:     null,
  dailyProfit:     [],
  moneyAtStart:    150,
  harvestHistory:  [],
  isNight:         false,
  /* Challenge trackers */
  totalHarvested:  0,   /* total crops ever harvested */
  highQualCount:   0,   /* total "high" quality harvests */
  badWeatherDays:  0,   /* storm + drought days survived */
  totalSellEarned: 0,   /* total gold earned from selling */
  bestDayProfit:   0,   /* best single-day earnings */
};

/* ================================================================
   INIT
================================================================ */
function init() {
  CROPS.forEach(c => { state.marketPrices[c.id] = c.basePrice; });
  state.plots = [];
  for (let i = 0; i < 30; i++) {
    state.plots.push(createEmptyPlot(i >= state.totalPlots));
  }
  buildCropSelector();
  buildFarmGrid();
  buildMarketCards();
  updateUI();
  refreshDashboard();
  buildChallenges();
  loadLeaderboard();
  /* Day/Night cycle — starts a 3-minute (180s) countdown after init */
  startDayNightCycle();
}

/* ================================================================
   CREATE PLOT OBJECT — Template for a blank plot
================================================================ */
function createEmptyPlot(locked) {
  return {
    locked:       locked || false,
    cropId:       null,
    stage:        'empty',   /* empty/planted/growing/ready/dead/rotten */
    daysGrown:    0,
    daysReady:    0,         /* days sitting at 'ready' — for rot timer */
    waterLevel:   1,         /* 0=dry 1=ok 2=well 3=excess */
    fertLevel:    0,         /* 0=none 1=once 2=over */
    quality:      'normal',  /* low/normal/high */
    harvestsLeft: 1,         /* multi-harvest counter */
  };
}

/* ================================================================
   BUILD CROP SELECTOR
================================================================ */
function buildCropSelector() {
  const container = document.getElementById('crops-grid');
  container.innerHTML = '';
  CROPS.forEach(crop => {
    const isBest = crop.bestSeason === state.season;
    const card = document.createElement('div');
    card.className = 'crop-card' + (isBest ? ' best-season' : '');
    card.id = 'crop-card-' + crop.id;
    card.innerHTML = `
      <span class="crop-emoji">${crop.emoji}</span>
      <span class="crop-name">${crop.name}</span>
      <span class="crop-stats">⏳${crop.growDays}d · 💰${crop.basePrice}g${crop.multiHarvest > 1 ? ' · 🔄×' + crop.multiHarvest : ''}</span>
      <span class="crop-cost">🌱 ${crop.cost}g</span>
      ${isBest ? '<span class="season-badge">★ Best season!</span>' : ''}
    `;
    card.onclick = () => selectCrop(crop.id);
    container.appendChild(card);
  });
}

/* ================================================================
   BUILD FARM GRID — Creates plot cells with path separators
================================================================ */
function buildFarmGrid() {
  const grid = document.getElementById('farm-grid');
  grid.innerHTML = '';

  const cols = 5;        /* 5 plots per visual row */
  const total = 30;      /* always render 30 slots */
  const rows  = total / cols; /* = 6 rows */

  let plotIdx = 0;

  for (let r = 0; r < rows; r++) {
    /* Path row between row groups */
    if (r > 0) {
      const pathRow = document.createElement('div');
      pathRow.className = 'path-row';
      grid.appendChild(pathRow);
    }

    for (let c = 0; c < cols; c++) {
      /* Path column between plot columns */
      if (c > 0) {
        const pathCol = document.createElement('div');
        pathCol.className = 'path-col';
        grid.appendChild(pathCol);
      }

      const cell = document.createElement('div');
      cell.id = 'plot-' + plotIdx;
      /* Use IIFE to capture plotIdx correctly in the closure */
      cell.onclick = (function(idx) { return function() { handlePlotClick(idx); }; })(plotIdx);
      grid.appendChild(cell);
      plotIdx++;
    }
  }

  refreshGrid();
}

/* ================================================================
   REFRESH GRID — Sync DOM visuals with game state
================================================================ */
function refreshGrid() {
  state.plots.forEach((plot, index) => {
    const cell = document.getElementById('plot-' + index);
    if (!cell) return;

    if (plot.locked) {
      cell.className = 'plot locked';
      cell.innerHTML = '🔒';
      return;
    }

    /* Build class list based on stage */
    let cls = 'plot ' + plot.stage;

    /* Add water level border hint for active crops */
    if (plot.stage !== 'empty' && plot.stage !== 'dead' && plot.stage !== 'rotten') {
      if (plot.waterLevel === 0)     cls += ' water-low';
      else if (plot.waterLevel <= 2) cls += ' water-ok';
      else                           cls += ' water-excess';
    }
    cell.className = cls;

    /* Choose the main emoji */
    let emoji = '';
    if (plot.stage === 'empty')   emoji = '🟫';
    else if (plot.stage === 'dead')   emoji = '💀';
    else if (plot.stage === 'rotten') emoji = '🤢';
    else {
      const crop = getCropById(plot.cropId);
      if (plot.stage === 'planted')  emoji = '🌱';
      else if (plot.stage === 'growing') emoji = crop.emoji;
      else if (plot.stage === 'ready')   emoji = '✨' + crop.emoji;
    }

    /* Progress bar (only while growing) */
    let progressHTML = '';
    if (plot.stage === 'planted' || plot.stage === 'growing') {
      const crop = getCropById(plot.cropId);
      const pct  = Math.min(100, Math.round((plot.daysGrown / crop.growDays) * 100));
      progressHTML = `<div class="plot-progress"><div class="plot-progress-fill" style="width:${pct}%"></div></div>`;
    }

    /* Quality badge on ready crops */
    let qualHTML = '';
    if (plot.stage === 'ready') {
      const qMap   = { low:'⬇Low', normal:'➡OK', high:'⬆High' };
      const qClass = { low:'q-low', normal:'q-normal', high:'q-high' };
      qualHTML = `<span class="plot-quality ${qClass[plot.quality]}">${qMap[plot.quality]}</span>`;
    }

    /* Fertilizer indicator */
    let fertHTML = '';
    if (plot.fertLevel > 0 && plot.stage !== 'empty') fertHTML = `<span class="plot-fert">🌿</span>`;

    cell.innerHTML = qualHTML + fertHTML + emoji + progressHTML;
  });
}

/* ================================================================
   HANDLE PLOT CLICK
================================================================ */
function handlePlotClick(index) {
  const plot = state.plots[index];
  if (plot.locked) { showToast('🔒 Expand the farm to unlock this plot!'); return; }

  /* --- WATER TOOL --- */
  if (state.activeTool === 'water') {
    if (plot.stage === 'empty' || plot.stage === 'dead' || plot.stage === 'rotten') {
      showToast('🌱 Nothing to water here!'); return;
    }
    if (state.money < 3) { showToast('💸 Need 3g to water a plot!'); return; }
    state.money -= 3;
    plot.waterLevel = Math.min(3, plot.waterLevel + 1);
    const waterLabels = ['', '💧 OK', '💧💧 Well Watered', '⚠️ Excess — rot risk!'];
    updateUI(); refreshGrid();
    showToast('💧 Watered! Level: ' + (waterLabels[plot.waterLevel] || plot.waterLevel));
    return;
  }

  /* --- FERTILIZE TOOL --- */
  if (state.activeTool === 'fert') {
    if (plot.stage === 'empty' || plot.stage === 'dead' || plot.stage === 'rotten') {
      showToast('🌱 Nothing to fertilize here!'); return;
    }
    if (state.money < 5) { showToast('💸 Need 5g to fertilize!'); return; }
    state.money -= 5;
    plot.fertLevel = Math.min(2, plot.fertLevel + 1);
    /* Instantly advance growth by 1 day */
    if (plot.cropId) {
      const crop = getCropById(plot.cropId);
      plot.daysGrown = Math.min(plot.daysGrown + 1, crop.growDays);
    }
    updateUI(); refreshGrid();
    if (plot.fertLevel === 2) showToast('⚠️ Over-fertilized! Quality may suffer.');
    else showToast('🌿 Fertilized! Growth speed boosted!');
    return;
  }

  /* --- CLEAR TOOL --- */
  if (state.activeTool === 'clear') {
    if (plot.stage === 'empty') { showToast('Nothing to clear here!'); return; }
    resetPlot(plot);
    refreshGrid();
    showToast('🗑️ Plot cleared!');
    return;
  }

  /* --- PLANT MODE (default) --- */
  if (plot.stage === 'ready') { harvestPlot(index); return; }

  if (plot.stage === 'dead' || plot.stage === 'rotten') {
    showToast('🗑️ Switch to Clear Mode to remove this first!'); return;
  }

  if (plot.stage !== 'empty') { showToast('⏳ Crop is still growing!'); return; }

  if (!state.selectedCrop) { showToast('🌿 Select a crop first!'); return; }

  const crop = getCropById(state.selectedCrop);
  if (state.money < crop.cost) { showToast('💸 Need ' + crop.cost + 'g to plant ' + crop.name + '!'); return; }

  /* Plant the crop */
  state.money        -= crop.cost;
  plot.cropId         = crop.id;
  plot.stage          = 'planted';
  plot.daysGrown      = 0;
  plot.daysReady      = 0;
  plot.waterLevel     = 1;
  plot.fertLevel      = 0;
  plot.quality        = 'normal';
  plot.harvestsLeft   = crop.multiHarvest;

  updateUI(); refreshGrid();
  showToast('🌱 Planted ' + crop.emoji + ' ' + crop.name + '!');
}

/* ================================================================
   SELECT CROP
================================================================ */
function selectCrop(cropId) {
  state.selectedCrop = cropId;
  state.activeTool   = 'plant';
  CROPS.forEach(c => {
    const el = document.getElementById('crop-card-' + c.id);
    if (el) el.classList.toggle('selected', c.id === cropId);
  });
  ['water','fert','clear'].forEach(t => {
    const b = document.getElementById('tool-btn-' + t);
    if (b) b.classList.remove('tool-active');
  });
  const crop = getCropById(cropId);
  setToolIndicator('🌱 Plant Mode — ' + crop.emoji + ' ' + crop.name);
}

/* ================================================================
   ACTIVATE TOOL
================================================================ */
function activateTool(tool) {
  state.activeTool   = tool;
  state.selectedCrop = null;
  CROPS.forEach(c => {
    const el = document.getElementById('crop-card-' + c.id);
    if (el) el.classList.remove('selected');
  });
  ['water','fert','clear'].forEach(t => {
    const b = document.getElementById('tool-btn-' + t);
    if (b) b.classList.toggle('tool-active', t === tool);
  });
  const labels = {
    water: '💧 Water Mode — Click a crop plot (costs 3g each)',
    fert:  '🌿 Fertilize Mode — Click a crop plot (costs 5g each)',
    clear: '🗑️ Clear Mode — Click any plot to remove the crop',
  };
  setToolIndicator(labels[tool] || '');
}

function setToolIndicator(text) {
  document.getElementById('tool-indicator').textContent = text;
}

/* ================================================================
   NEXT DAY — The main game loop
================================================================ */
function nextDay() {
  /* Record today's profit for the chart */
  const todayProfit = state.money - state.moneyAtStart;
  state.dailyProfit.push({ day: state.day, profit: todayProfit });
  if (todayProfit > state.bestDayProfit) state.bestDayProfit = todayProfit;
  state.moneyAtStart = state.money;

  state.day++;

  /* Change season every 10 days */
  if (state.day % 10 === 1 && state.day > 1) {
    state.season = (state.season + 1) % SEASONS.length;
    const s = SEASONS[state.season];
    showToast(s.icon + ' New Season: ' + s.name + '!');
    buildCropSelector(); /* refresh season badges */
    fluctuateMarketPrices();
  }

  /* Pick today's weather and apply its effects */
  pickWeather();
  applyWeather();

  /* Tick the active market event countdown */
  tickMarketEvent();

  /* 10% chance of a random market event firing */
  if (!state.marketEvent && Math.random() < 0.10) triggerMarketEvent();

  /* Small daily price fluctuation */
  fluctuateMarketPrices();

  /* --- Grow / tick all plots --- */
  state.plots.forEach(plot => {
    if (plot.locked) return;
    if (plot.stage === 'empty' || plot.stage === 'dead' || plot.stage === 'rotten') return;

    /* Rot timer for crops sitting at 'ready' too long */
    if (plot.stage === 'ready') {
      plot.daysReady++;
      if (plot.daysReady >= 3) {
        plot.stage = 'rotten';
        showToast('🤢 A crop rotted! Harvest faster!');
      }
      return;
    }

    const crop = getCropById(plot.cropId);

    /* --- Calculate growth speed modifier --- */
    let speed = 1.0; /* base: 1 day of progress */

    /* Water effect */
    if (plot.waterLevel === 0)     speed = 0.5;  /* dry: slow */
    else if (plot.waterLevel === 2) speed = 1.2; /* well watered: slightly faster */
    /* Note: excess (3) still grows at 1.0 but with rot risk */

    /* Fertilizer effect */
    if (plot.fertLevel === 1) speed += 0.4;
    if (plot.fertLevel === 2) speed += 0.2; /* over-fert less beneficial */

    /* Season bonus */
    if (crop.bestSeason === state.season) speed += 0.3;

    plot.daysGrown += speed;

    /* Natural water decrease each day */
    plot.waterLevel = Math.max(0, plot.waterLevel - 1);

    /* Drought drains water faster */
    if (state.weather === 'drought') plot.waterLevel = Math.max(0, plot.waterLevel - 1);

    /* Excess water rot risk */
    if (plot.waterLevel >= 3 && Math.random() < 0.35) {
      plot.stage = 'dead';
      showToast('😵 Crop drowned from overwatering!');
      return;
    }

    /* Drought death risk when completely dry */
    if (plot.waterLevel === 0 && Math.random() < 0.25) {
      plot.stage = 'dead';
      showToast('☠️ Crop died from drought!');
      return;
    }

    /* Random disease (5% chance) */
    if (Math.random() < 0.05) {
      plot.stage = 'dead';
      showToast('🦠 A crop died from disease!');
      return;
    }

    /* Check if fully grown */
    if (plot.daysGrown >= crop.growDays) {
      plot.stage     = 'ready';
      plot.daysReady = 0;
      plot.quality   = calcQuality(plot, crop);
    } else {
      plot.stage = plot.daysGrown >= 1 ? 'growing' : 'planted';
    }
  });

  updateUI();
  refreshGrid();
  updateMarketUI();
  buildChallenges();

  const w = getWeatherObj();
  showToast('🌅 Day ' + state.day + '! ' + w.icon + ' ' + w.name);
}

/* ================================================================
   QUALITY CALCULATION
================================================================ */
function calcQuality(plot, crop) {
  let score = 0;
  /* Good water balance */
  if (plot.waterLevel >= 1 && plot.waterLevel <= 2) score += 2;
  else score -= 1;
  /* Fertilizer effect */
  if (plot.fertLevel === 1) score += 2;
  if (plot.fertLevel === 2) score -= 2;
  /* Best season bonus */
  if (crop.bestSeason === state.season) score += 2;
  /* Rain helps quality */
  if (state.weather === 'rainy') score += 1;

  if (score >= 4) return 'high';
  if (score <= 0) return 'low';
  return 'normal';
}

/* ================================================================
   WEATHER
================================================================ */
function pickWeather() {
  /* Weighted random: 40% sunny, 30% rainy, 15% storm, 15% drought */
  const roll = Math.random();
  if      (roll < 0.40) state.weather = 'sunny';
  else if (roll < 0.70) state.weather = 'rainy';
  else if (roll < 0.85) state.weather = 'storm';
  else                  state.weather = 'drought';

  const w = getWeatherObj();
  document.getElementById('weather-display').textContent = w.icon + ' ' + w.name;
}

function getWeatherObj() {
  return WEATHERS.find(w => w.key === state.weather) || WEATHERS[0];
}

function applyWeather() {
  if (state.weather === 'storm' || state.weather === 'drought') {
    state.badWeatherDays++;
  }

  if (state.weather === 'rainy') {
    /* Auto-water every growing crop */
    state.plots.forEach(plot => {
      if (plot.locked || plot.stage === 'empty' || plot.stage === 'dead' || plot.stage === 'rotten') return;
      plot.waterLevel = Math.min(2, plot.waterLevel + 1);
    });
    showToast('🌧️ Rain auto-watered all your crops — for free!');
  }

  if (state.weather === 'storm') {
    let damaged = 0;
    state.plots.forEach(plot => {
      if (plot.locked || plot.stage === 'empty' || plot.stage === 'dead' || plot.stage === 'rotten') return;
      if (Math.random() < 0.30) { plot.stage = 'dead'; damaged++; }
    });
    showToast(damaged > 0 ? '⛈️ Storm destroyed ' + damaged + ' crop(s)!' : '⛈️ Storm passed — no damage this time!');
  }
}

/* ================================================================
   MARKET EVENTS
================================================================ */
function triggerMarketEvent() {
  const ev = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
  state.marketEvent = { cropId: ev.cropId, name: ev.name, multiplier: ev.multiplier, daysLeft: ev.duration };
  const base = getCropById(ev.cropId).basePrice;
  state.marketPrices[ev.cropId] = Math.round(base * ev.multiplier);

  const banner = document.getElementById('event-banner');
  banner.textContent = ev.name + ' — ' + ev.duration + ' days!';
  banner.style.display = 'block';
  showToast('🎉 ' + ev.name);
}

function tickMarketEvent() {
  if (!state.marketEvent) return;
  state.marketEvent.daysLeft--;
  if (state.marketEvent.daysLeft <= 0) {
    const crop = getCropById(state.marketEvent.cropId);
    state.marketPrices[state.marketEvent.cropId] = crop.basePrice;
    state.marketEvent = null;
    document.getElementById('event-banner').style.display = 'none';
    showToast('📉 Market event ended. Prices back to normal.');
  }
}

function fluctuateMarketPrices() {
  CROPS.forEach(crop => {
    /* Don't override prices controlled by an active event */
    if (state.marketEvent && state.marketEvent.cropId === crop.id) return;
    const change = (Math.random() * 0.4) - 0.2; /* ±20% */
    const raw    = Math.round(crop.basePrice * (1 + change));
    state.marketPrices[crop.id] = Math.max(Math.round(crop.basePrice * 0.5), raw);
  });
}

/* ================================================================
   HARVEST
================================================================ */
function harvestPlot(index) {
  const plot = state.plots[index];
  if (plot.stage !== 'ready') return;
  const crop = getCropById(plot.cropId);

  /* Add to inventory */
  if (!state.harvest[plot.cropId]) state.harvest[plot.cropId] = [];
  state.harvest[plot.cropId].push({ quality: plot.quality });

  /* Score and history — record season too for dashboard */
  const price = getFinalPrice(crop.id, plot.quality);
  state.score += price;
  state.totalHarvested++;
  if (plot.quality === 'high') state.highQualCount++;
  state.harvestHistory.unshift({ id: crop.id, name: crop.name, emoji: crop.emoji, quality: plot.quality, earned: price, day: state.day, season: state.season });
  if (state.harvestHistory.length > 10) state.harvestHistory.pop();

  showToast('🧺 Harvested ' + crop.emoji + ' ' + crop.name + ' (' + plot.quality + ')!');

  /* Multi-harvest: reset to growing, otherwise clear plot */
  plot.harvestsLeft--;
  if (plot.harvestsLeft > 0) {
    plot.stage     = 'growing';
    plot.daysGrown = 0;
    plot.daysReady = 0;
    plot.quality   = 'normal';
    showToast('🔄 ' + crop.name + ' will grow again! (' + plot.harvestsLeft + ' harvest(s) left)');
  } else {
    resetPlot(plot);
  }

  updateUI(); refreshGrid(); refreshDashboard(); buildChallenges();
}

function harvestAll() {
  let count = 0;
  state.plots.forEach((plot, i) => { if (plot.stage === 'ready') { harvestPlot(i); count++; } });
  if (count === 0) showToast('🌾 No crops ready to harvest yet!');
  else showToast('🧺 Harvested ' + count + ' crop(s) at once!');
}

/* Final sell price = market price × quality multiplier */
function getFinalPrice(cropId, quality) {
  const price = state.marketPrices[cropId] || getCropById(cropId).basePrice;
  const mult  = quality === 'high' ? 1.5 : quality === 'low' ? 0.5 : 1.0;
  return Math.round(price * mult);
}

/* ================================================================
   SELL CROPS
================================================================ */
function sellCrop(cropId, mode) {
  const items = state.harvest[cropId] || [];
  if (items.length === 0) { showToast('🧺 No ' + getCropById(cropId).name + ' to sell!'); return; }

  const toSell = mode === 'all' ? items.slice() : [items[0]];
  let earned = 0;
  toSell.forEach(item => { earned += getFinalPrice(cropId, item.quality); });

  state.money += earned;
  state.harvest[cropId] = mode === 'all' ? [] : items.slice(1);
  state.totalSellEarned += earned;

  updateUI(); updateMarketUI(); buildChallenges();
  showToast('💰 Sold ' + toSell.length + 'x ' + getCropById(cropId).emoji + ' for ' + earned + 'g!');
}

/* ================================================================
   EXPAND FARM
================================================================ */
function expandFarm() {
  if (state.totalPlots >= 30) { showToast('🏠 Farm is already fully expanded!'); return; }
  if (state.money < state.expandCost) { showToast('💸 Need ' + state.expandCost + 'g to expand!'); return; }

  state.money -= state.expandCost;
  const prev = state.totalPlots;
  state.totalPlots = Math.min(30, state.totalPlots + 5);
  state.expandCost = Math.round(state.expandCost * 1.6); /* gets more expensive each time */

  /* Unlock the newly added plots */
  for (let i = prev; i < state.totalPlots; i++) {
    state.plots[i].locked = false;
  }

  document.getElementById('expand-cost').textContent = state.expandCost;
  updateUI(); refreshGrid();
  showToast('🏗️ Farm expanded! Now ' + state.totalPlots + ' plots.');
}

/* ================================================================
   BUILD MARKET CARDS
================================================================ */
function buildMarketCards() {
  const grid = document.getElementById('market-grid');
  grid.innerHTML = '';
  CROPS.forEach(crop => {
    const card = document.createElement('div');
    card.className = 'market-card';
    card.id = 'market-card-' + crop.id;
    grid.appendChild(card);
  });
  updateMarketUI();
}

function updateMarketUI() {
  CROPS.forEach(crop => {
    const card = document.getElementById('market-card-' + crop.id);
    if (!card) return;
    const items   = state.harvest[crop.id] || [];
    const total   = items.length;
    const price   = state.marketPrices[crop.id] || crop.basePrice;
    const isEvent = state.marketEvent && state.marketEvent.cropId === crop.id;
    const trendUp = price >= crop.basePrice;
    const trend   = trendUp
      ? '<span class="market-trend price-up">▲ High demand</span>'
      : '<span class="market-trend price-down">▼ Low demand</span>';

    card.innerHTML = `
      ${isEvent ? '<span class="event-tag">🔥 EVENT</span>' : ''}
      <span class="market-emoji">${crop.emoji}</span>
      <div class="market-name">${crop.name}</div>
      <div class="market-price">💰 ${price}g each</div>
      ${trend}
      <div class="market-stock">In basket: ${total}</div>
      <div class="sell-btns">
        <button class="sell-btn sell-one" onclick="sellCrop('${crop.id}',1)"      ${total===0?'disabled':''}>Sell 1</button>
        <button class="sell-btn"          onclick="sellCrop('${crop.id}','all')"   ${total===0?'disabled':''}>Sell All</button>
      </div>
    `;
  });

  const infoBox = document.getElementById('market-event-info');
  if (state.marketEvent) {
    infoBox.style.display = 'block';
    infoBox.textContent   = state.marketEvent.name + ' — ' + state.marketEvent.daysLeft + ' day(s) remaining!';
  } else {
    infoBox.style.display = 'none';
  }
}

/* ================================================================
   DAY / NIGHT CYCLE
   - Day lasts 3 minutes, then night begins automatically
   - Night shows a full-screen overlay with a countdown timer
   - Night also lasts 3 minutes, then morning returns automatically
   - Player can press "Skip to Morning" to end night early
================================================================ */

const CYCLE_DURATION = 3 * 60; /* 3 minutes in seconds */
let cycleSecondsLeft  = CYCLE_DURATION; /* countdown for current phase */
let cycleTimerHandle  = null;           /* holds the setInterval reference */

function startDayNightCycle() {
  /* Always start fresh as day */
  state.isNight      = false;
  cycleSecondsLeft   = CYCLE_DURATION;
  applyDayNightTheme();

  /* Tick every second */
  cycleTimerHandle = setInterval(tickCycle, 1000);
}

/* Called every second by the interval */
function tickCycle() {
  cycleSecondsLeft--;

  /* Update the night overlay countdown (only meaningful during night) */
  if (state.isNight) {
    const mins = Math.floor(cycleSecondsLeft / 60);
    const secs = cycleSecondsLeft % 60;
    const pad  = secs < 10 ? '0' : '';
    document.getElementById('night-timer-text').textContent =
      'Morning arrives in ' + mins + ':' + pad + secs;
  }

  /* When countdown hits zero, flip the phase */
  if (cycleSecondsLeft <= 0) {
    toggleDayNight();
  }
}

/* Flip between day and night, reset the 3-minute countdown */
function toggleDayNight() {
  state.isNight    = !state.isNight;
  cycleSecondsLeft = CYCLE_DURATION; /* restart the 3-minute timer */
  applyDayNightTheme();

  if (state.isNight) {
    showToast('🌙 Night has fallen! Press "Skip to Morning" to fast-forward.');
  } else {
    showToast('☀️ Good morning, farmer! A new day begins.');
  }
}

/* Apply the correct CSS theme and show/hide the night overlay */
function applyDayNightTheme() {
  document.body.classList.toggle('day-theme',   !state.isNight);
  document.body.classList.toggle('night-theme',  state.isNight);
  document.getElementById('time-chip').textContent = state.isNight ? '🌙 Night' : '☀️ Day';

  /* Swap SVG blob layers */
  const dayB   = document.getElementById('day-blobs');
  const dayS   = document.getElementById('day-splashes');
  const nightB = document.getElementById('night-blobs');
  const nightA = document.getElementById('night-accents');
  if (dayB)   dayB.style.opacity   = state.isNight ? '0'    : '0.72';
  if (dayS)   dayS.style.opacity   = state.isNight ? '0'    : '0.18';
  if (nightB) nightB.style.opacity = state.isNight ? '0.88' : '0';
  if (nightA) nightA.style.opacity = state.isNight ? '1'    : '0';

  const overlay = document.getElementById('night-overlay');
  if (state.isNight) {
    overlay.classList.add('visible');
    const mins = Math.floor(CYCLE_DURATION / 60);
    document.getElementById('night-timer-text').textContent = 'Morning arrives in ' + mins + ':00';
  } else {
    overlay.classList.remove('visible');
  }
}

/* "Skip to Morning" button — ends night early and restarts 3-min day countdown */
function escapToMorning() {
  if (!state.isNight) return;          /* safety check — should never happen */
  state.isNight    = false;
  cycleSecondsLeft = CYCLE_DURATION;   /* full 3 minutes of day ahead */
  applyDayNightTheme();
  showToast('☀️ Morning! You have 3 minutes before night falls again.');
}

/* ================================================================
   UPDATE UI — Sync header + home page numbers
================================================================ */
function updateUI() {
  const totalHarvest = Object.values(state.harvest).reduce((sum, arr) => sum + arr.length, 0);

  document.getElementById('money-display').textContent   = state.money;
  document.getElementById('harvest-display').textContent = totalHarvest;
  document.getElementById('score-display').textContent   = state.score;

  document.getElementById('home-money').textContent   = state.money;
  document.getElementById('home-harvest').textContent = totalHarvest;
  document.getElementById('home-score').textContent   = state.score;
  document.getElementById('home-day').textContent     = state.day;

  const s = SEASONS[state.season];
  document.getElementById('season-name').textContent = s.name;
  document.getElementById('season-icon').textContent = s.icon;
  document.getElementById('day-num').textContent     = state.day;
  document.getElementById('market-money').textContent = state.money;
}

/* ================================================================
   CHALLENGES — defined once, tracked in state
================================================================ */
const CHALLENGE_DEFS = [
  { id:'harvest5',   icon:'🧺', title:'First Haul',       desc:'Harvest 5 crops total',              target:5,  reward:30,  hard:false, getVal: () => state.totalHarvested },
  { id:'earn100',    icon:'💰', title:'Gold Rush',         desc:'Earn 100g in a single day',          target:100,reward:50,  hard:false, getVal: () => state.bestDayProfit  },
  { id:'highqual3',  icon:'⭐', title:'Quality Farmer',    desc:'Harvest 3 High-quality crops',       target:3,  reward:40,  hard:false, getVal: () => state.highQualCount  },
  { id:'plant8',     icon:'🌱', title:'Full Farm',         desc:'Have 8 crops growing at once',       target:8,  reward:60,  hard:true,  getVal: () => state.plots.filter(p=>!p.locked && p.stage !== 'empty' && p.stage !== 'dead' && p.stage !== 'rotten').length },
  { id:'survive5',   icon:'🌦️', title:'Weather Warrior',   desc:'Survive 5 storm or drought days',   target:5,  reward:80,  hard:true,  getVal: () => state.badWeatherDays },
  { id:'sell200',    icon:'🏪', title:'Market Master',     desc:'Earn 200g total from selling',       target:200,reward:100, hard:true,  getVal: () => state.totalSellEarned},
];

/* ================================================================
   BUILD / REFRESH CHALLENGES UI
================================================================ */
function buildChallenges() {
  const grid = document.getElementById('challenges-grid');
  if (!grid) return;
  grid.innerHTML = '';

  CHALLENGE_DEFS.forEach(ch => {
    const val      = ch.getVal();
    const progress = Math.min(val, ch.target);
    const pct      = Math.round((progress / ch.target) * 100);
    const done     = pct >= 100;

    const card = document.createElement('div');
    card.className = 'challenge-card' + (done ? ' done' : '') + (ch.hard ? ' hard' : '');
    card.innerHTML = `
      <div class="ch-header">
        <span class="ch-icon">${ch.icon}</span>
        <span class="ch-title">${ch.title} ${done ? '✅' : ''}</span>
      </div>
      <div class="ch-desc">${ch.desc}</div>
      <div class="ch-progress-wrap">
        <div class="ch-progress-bar" style="width:${pct}%"></div>
      </div>
      <div class="ch-footer">
        <span class="ch-reward">🎁 Reward: +${ch.reward}g</span>
        <span class="ch-status ${done ? 'done' : ''}">${done ? '🏅 Completed!' : progress + ' / ' + ch.target}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

/* ================================================================
   DASHBOARD REFRESH — detailed with 7-day chart & per-crop stats
================================================================ */
function refreshDashboard() {
  const totalHarvest = Object.values(state.harvest).reduce((sum, arr) => sum + arr.length, 0);

  /* Main 4 stats */
  document.getElementById('dash-money').textContent   = state.money;
  document.getElementById('dash-score').textContent   = state.score;
  document.getElementById('dash-harvest').textContent = totalHarvest;
  document.getElementById('dash-day').textContent     = state.day;

  /* Per-crop harvested totals (count all items ever harvested, tracked in harvestHistory) */
  const harvestedByCrop = {};
  state.harvestHistory.forEach(h => {
    harvestedByCrop[h.id] = (harvestedByCrop[h.id] || 0) + 1;
  });
  /* Also include what's still in basket */
  CROPS.forEach(crop => {
    const basketCount    = (state.harvest[crop.id] || []).length;
    const historyCount   = harvestedByCrop[crop.id] || 0;
    const el = document.getElementById('dash-' + crop.id);
    if (el) el.textContent = basketCount + historyCount;
  });

  /* --- Last 7 days profit chart --- */
  const wrap = document.getElementById('chart-7-wrap');
  if (wrap) {
    wrap.innerHTML = '';
    /* Build 7 slots: fill from dailyProfit, use 0 for missing days */
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const idx = state.dailyProfit.length - 1 - i;
      if (idx >= 0) last7.push(state.dailyProfit[idx]);
      else          last7.push({ day: state.day - i, profit: 0 });
    }

    const maxAbs = Math.max(1, ...last7.map(d => Math.abs(d.profit)));

    last7.forEach(d => {
      const col = document.createElement('div');
      col.className = 'c7-col';

      const bar = document.createElement('div');
      const heightPx = Math.round((Math.abs(d.profit) / maxAbs) * 110);
      bar.className = 'c7-bar' + (d.profit < 0 ? ' neg' : '');
      bar.style.height = Math.max(6, heightPx) + 'px';
      bar.title = 'Day ' + d.day + ': ' + (d.profit >= 0 ? '+' : '') + d.profit + 'g';

      const val = document.createElement('div');
      val.className = 'c7-val';
      val.textContent = (d.profit >= 0 ? '+' : '') + d.profit + 'g';

      const day = document.createElement('div');
      day.className = 'c7-day';
      day.textContent = 'D' + d.day;

      col.appendChild(bar);
      col.appendChild(val);
      col.appendChild(day);
      wrap.appendChild(col);
    });
  }

  /* --- Detailed Harvest History (5 columns) --- */
  const table = document.getElementById('history-table');
  if (table) {
    table.innerHTML = `
      <div class="history-row header">
        <span>Crop</span>
        <span>Quality</span>
        <span>Sell Price</span>
        <span>Season</span>
        <span>Day</span>
      </div>
    `;

    if (state.harvestHistory.length === 0) {
      table.innerHTML += '<div class="history-row" style="color:#ccc;font-size:0.78rem;padding:14px 16px;grid-column:1/-1;">No harvests recorded yet</div>';
    } else {
      const qColors   = { high:'#27ae60', normal:'#f39c12', low:'#e74c3c' };
      const qLabels   = { high:'⬆ High', normal:'➡ Normal', low:'⬇ Low' };
      const seasonStr = ['🌸 Spring','☀️ Summer','🍂 Autumn','❄️ Winter'];

      state.harvestHistory.forEach(h => {
        const row = document.createElement('div');
        row.className = 'history-row';
        row.innerHTML = `
          <span style="font-weight:800;">${h.emoji} ${h.name}</span>
          <span><span class="q-badge" style="background:${qColors[h.quality]};color:#fff;">${qLabels[h.quality]}</span></span>
          <span style="color:#27ae60;font-weight:900;">+${h.earned}g</span>
          <span style="font-size:0.75rem;color:#888;">${seasonStr[h.season] || '—'}</span>
          <span style="color:#3498DB;font-weight:800;">D${h.day}</span>
        `;
        table.appendChild(row);
      });
    }
  }
}

/* ================================================================
   LEADERBOARD
================================================================ */
function submitScore() {
  const name = document.getElementById('player-name').value.trim();
  if (!name) { showToast('✏️ Enter your name first!'); return; }
  const entries = JSON.parse(localStorage.getItem('harvestHavenLB') || '[]');
  entries.push({ name, score: state.score, day: state.day });
  entries.sort((a, b) => b.score - a.score);
  localStorage.setItem('harvestHavenLB', JSON.stringify(entries.slice(0, 10)));
  document.getElementById('player-name').value = '';
  loadLeaderboard();
  showToast('🏅 Score submitted to the Hall of Fame!');
}

function loadLeaderboard() {
  const entries = JSON.parse(localStorage.getItem('harvestHavenLB') || '[]');
  const list    = document.getElementById('leaderboard-list');
  if (entries.length === 0) { list.innerHTML = '<div class="empty-lb">🌱 No scores yet — be the first farmer!</div>'; return; }
  const medals      = ['gold','silver','bronze'];
  const medalEmoji  = ['🥇','🥈','🥉'];
  list.innerHTML = entries.map((e, i) => `
    <div class="lb-row">
      <span class="lb-rank ${i < 3 ? medals[i] : 'other'}">${i < 3 ? medalEmoji[i] : '#' + (i + 1)}</span>
      <span class="lb-name">👨‍🌾 ${e.name}</span>
      <span class="lb-score">⭐ ${e.score}</span>
      <span class="lb-day">Day ${e.day}</span>
    </div>
  `).join('');
}

/* ================================================================
   PAGE NAVIGATION
================================================================ */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  const names = ['home','farm','market','dashboard','leaderboard','manual'];
  const idx   = names.indexOf(name);
  const tabs  = document.querySelectorAll('.tab-btn');
  if (tabs[idx]) tabs[idx].classList.add('active');
  if (name === 'market')     { updateUI(); updateMarketUI(); }
  if (name === 'dashboard')  { refreshDashboard(); }
  if (name === 'leaderboard') loadLeaderboard();
}

/* ================================================================
   TOAST NOTIFICATION
================================================================ */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ================================================================
   HELPERS
================================================================ */
function getCropById(id) { return CROPS.find(c => c.id === id); }

function resetPlot(plot) {
  plot.cropId       = null;
  plot.stage        = 'empty';
  plot.daysGrown    = 0;
  plot.daysReady    = 0;
  plot.waterLevel   = 1;
  plot.fertLevel    = 0;
  plot.quality      = 'normal';
  plot.harvestsLeft = 1;
}

/* ================================================================
   BOOT
================================================================ */
init();