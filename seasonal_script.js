// seasonal_script.js

// Shared Constants
const CONFIG_KEY = 'tuition_config';
const PRICING_KEY = 'tuition_pricing';

const DEFAULT_CONFIG = {
    company: 'ECCベストワン・ジュニア藍住',
    zip: '771-1252',
    address: '徳島県板野郡藍住町矢上字北分82-1\nテナント新居No.4',
    phone: '088-692-5483',
    invoice: '',
    logo: '',
    bank: 'ゆうちょ銀行\n16210-153351\n名義）犬伏由美'
};

const DEFAULT_PRICING = {
    "1:2": {
        "elem45": [9080, 17180, 24440, 30980, 36660, 41870, 2420],
        "elem80": [16090, 30490, 43440, 55060, 65220, 74420, 4235],
        "middle12": [17550, 33400, 47550, 60260, 71510, 81430, 4598],
        "middle3high12": [18510, 35090, 50090, 63280, 75140, 85670, 4840],
        "high3": [19360, 36910, 52510, 66550, 79010, 89900, 5082]
    },
    "1:1": {
        "elem45": [15850, 30130, 42830, 54210, 64370, 73450, 4235],
        "elem80": [28190, 53600, 76110, 96320, 114470, 130560, 7502],
        "middle12": [30730, 58320, 83130, 105270, 124990, 142420, 8107],
        "middle3high12": [32310, 61350, 87480, 110840, 131530, 149920, 8530],
        "high3": [33880, 64490, 91960, 116280, 138060, 157300, 8954]
    }
};

const SEASONAL_PRICING_BASE = {
    "1:2": {
        "elem45": [2420, 2360, 2300, 2240, 2180],
        "elem80": [4235, 4170, 4110, 4050, 3990],
        "middle12": [4598, 4540, 4480, 4420, 4360],
        "middle3high12": [4840, 4780, 4720, 4660, 4600],
        "high3": [5082, 5020, 4960, 4900, 4840]
    },
    "1:1": {
        "elem45": [4235, 4170, 4110, 4050, 3990],
        "elem80": [7502, 7440, 7380, 7320, 7260],
        "middle12": [8107, 8050, 7990, 7930, 7870],
        "middle3high12": [8530, 8470, 8410, 8350, 8290],
        "high3": [8954, 8890, 8830, 8770, 8710]
    }
};

const SEASON_TITLES = {
    'spring': '春期講習',
    'summer': '夏期講習',
    'winter': '冬期講習'
};

const DEFAULT_SUBJECTS = ['数学', '英語', '国語', '理科', '社会'];

// State
let userConfig = { ...DEFAULT_CONFIG };
let PRICING = JSON.parse(JSON.stringify(DEFAULT_PRICING));
let state = {
    season: 'spring',
    docType: 'estimate',
    grade: 'middle12',
    subjectsList: [],
    otherCosts: [], // { id, name, price }
    materialTbd: false
};

// Elements
const els = {};

document.addEventListener('DOMContentLoaded', init);

function init() {
    loadConfig();
    loadPricing();

    // Default Subjects
    state.subjectsList = DEFAULT_SUBJECTS.map((s, idx) => ({
        id: 'subj_' + idx,
        name: s,
        detail: '',
        count_1_2: 0,
        count_1_1: 0
    }));

    // Map Elements
    els.docTypeBtns = document.querySelectorAll('#doc-type-selector .toggle-btn');
    els.gradeSelect = document.getElementById('grade-selector');
    els.seasonRadios = document.querySelectorAll('input[name="season"]');

    els.otherCostsContainer = document.getElementById('other-costs-container');
    els.addCostBtn = document.getElementById('add-cost-btn');
    els.materialTbdCheck = document.getElementById('material-tbd-check');

    els.generateBtn = document.getElementById('generate-btn');
    els.studentNameInput = document.getElementById('student-name');
    els.deadlineInput = document.getElementById('transfer-deadline');

    // Config Related
    els.openConfigBtn = document.getElementById('open-config-btn');
    els.configModal = document.getElementById('config-modal');
    els.closeConfigBtn = document.getElementById('close-config-btn');
    els.saveConfigBtn = document.getElementById('save-config-btn');
    els.logoInput = document.getElementById('logo-input');
    els.clearLogoBtn = document.getElementById('logo-clear-btn');

    // Default Deadline (+2 weeks)
    if (els.deadlineInput) {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        els.deadlineInput.valueAsDate = d;
    }

    renderSeasonalTable();
    renderOtherCosts(); // Init state empty
    setupListeners();
    updateCalculations();
}

function loadConfig() {
    try {
        const saved = localStorage.getItem(CONFIG_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            userConfig = { ...DEFAULT_CONFIG, ...parsed };
        }
    } catch (e) { console.error(e); }
    fillConfigModal();
}

function fillConfigModal() {
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setVal('cfg-company', userConfig.company);
    setVal('cfg-zip', userConfig.zip);
    setVal('cfg-address', userConfig.address);
    setVal('cfg-phone', userConfig.phone);
    setVal('cfg-invoice', userConfig.invoice);
    setVal('cfg-bank', userConfig.bank);
    if (userConfig.logo && document.getElementById('logo-preview')) {
        document.getElementById('logo-preview').src = userConfig.logo;
        document.getElementById('logo-preview').classList.remove('hidden');
        document.getElementById('logo-clear-btn').classList.remove('hidden');
    }
}

function loadPricing() {
    try {
        const saved = localStorage.getItem(PRICING_KEY);
        if (saved) PRICING = JSON.parse(saved);
    } catch (e) { console.error(e); }
}

function setupListeners() {
    // Season
    els.seasonRadios.forEach(radio => radio.addEventListener('change', (e) => {
        state.season = e.target.value;
        updateCalculations();
    }));

    // Doc Type
    els.docTypeBtns.forEach(btn => btn.addEventListener('click', () => {
        els.docTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.docType = btn.dataset.value;
        updateCalculations();
    }));

    // Other Inputs
    els.gradeSelect.addEventListener('change', (e) => { state.grade = e.target.value; updateCalculations(); });
    els.materialTbdCheck.addEventListener('change', (e) => { state.materialTbd = e.target.checked; updateCalculations(); });
    els.generateBtn.addEventListener('click', generateDocument);

    // Add Subject
    document.getElementById('add-subject-btn').addEventListener('click', () => {
        state.subjectsList.push({
            id: 'subj_custom_' + Date.now(),
            name: '', detail: '', count_1_2: 0, count_1_1: 0
        });
        renderSeasonalTable();
        updateCalculations();
    });

    // Add Other Cost
    els.addCostBtn.addEventListener('click', () => {
        state.otherCosts.push({
            id: 'cost_' + Date.now(),
            name: '',
            price: 0
        });
        renderOtherCosts();
        updateCalculations();
    });

    // Config
    els.openConfigBtn.addEventListener('click', () => els.configModal.classList.add('open'));
    els.closeConfigBtn.addEventListener('click', () => els.configModal.classList.remove('open'));
    els.saveConfigBtn.addEventListener('click', () => {
        userConfig.company = document.getElementById('cfg-company').value;
        userConfig.zip = document.getElementById('cfg-zip').value;
        userConfig.address = document.getElementById('cfg-address').value;
        userConfig.phone = document.getElementById('cfg-phone').value;
        userConfig.invoice = document.getElementById('cfg-invoice').value;
        userConfig.bank = document.getElementById('cfg-bank').value;
        localStorage.setItem(CONFIG_KEY, JSON.stringify(userConfig));
        els.configModal.classList.remove('open');
        generateDocument();
    });
    els.logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                userConfig.logo = evt.target.result;
                document.getElementById('logo-preview').src = userConfig.logo;
                document.getElementById('logo-preview').classList.remove('hidden');
                document.getElementById('logo-clear-btn').classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });
}

function renderSeasonalTable() {
    const tbody = document.getElementById('seasonal-tbody');
    tbody.innerHTML = '';

    state.subjectsList.forEach((subj) => {
        const tr = document.createElement('tr');
        // Placeholder logic
        let detailPlaceholder = '詳細・補足';
        if (subj.name === '英語') detailPlaceholder = '例: 英検2級';
        if (subj.name === '理科') detailPlaceholder = '例: 物理';

        tr.innerHTML = `
            <td>
                <input type="text" class="seasonal-table-input subj-name" data-id="${subj.id}" value="${subj.name}" placeholder="科目名">
            </td>
            <td>
                <input type="text" class="seasonal-table-input subj-detail" data-id="${subj.id}" value="${subj.detail}" placeholder="${detailPlaceholder}">
            </td>
            <td style="text-align:center;">
                <div class="stepper-compact">
                    <button type="button" class="stepper-btn minus" data-id="${subj.id}" data-type="count_1_2">-</button>
                    <input type="number" class="stepper-val count-input" data-id="${subj.id}" data-type="count_1_2" value="${subj.count_1_2}" min="0">
                    <button type="button" class="stepper-btn plus" data-id="${subj.id}" data-type="count_1_2">+</button>
                </div>
            </td>
            <td style="text-align:center;">
                <div class="stepper-compact">
                    <button type="button" class="stepper-btn minus" data-id="${subj.id}" data-type="count_1_1">-</button>
                    <input type="number" class="stepper-val count-input" data-id="${subj.id}" data-type="count_1_1" value="${subj.count_1_1}" min="0">
                    <button type="button" class="stepper-btn plus" data-id="${subj.id}" data-type="count_1_1">+</button>
                </div>
            </td>
            <td style="text-align:center;">
                <button type="button" class="del-row-btn" data-id="${subj.id}">×</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Attach Table Listeners (Delegate or direct)
    // Using direct for simplicity
    tbody.querySelectorAll('.subj-name').forEach(i => i.addEventListener('input', e => {
        state.subjectsList.find(x => x.id === e.target.dataset.id).name = e.target.value;
    }));
    tbody.querySelectorAll('.subj-detail').forEach(i => i.addEventListener('input', e => {
        state.subjectsList.find(x => x.id === e.target.dataset.id).detail = e.target.value;
    }));
    tbody.querySelectorAll('.count-input').forEach(i => i.addEventListener('input', e => {
        const item = state.subjectsList.find(x => x.id === e.target.dataset.id);
        const val = parseInt(e.target.value) || 0;
        item[e.target.dataset.type] = Math.max(0, val);
        updateCalculations();
    }));
    tbody.querySelectorAll('.stepper-btn').forEach(btn => btn.addEventListener('click', e => {
        const item = state.subjectsList.find(x => x.id === btn.dataset.id);
        const type = btn.dataset.type;
        if (btn.classList.contains('plus')) item[type]++;
        else item[type] = Math.max(0, item[type] - 1);

        let input = tbody.querySelector(`.count-input[data-id="${btn.dataset.id}"][data-type="${type}"]`);
        if (input) input.value = item[type];
        updateCalculations();
    }));
    tbody.querySelectorAll('.del-row-btn').forEach(btn => btn.addEventListener('click', e => {
        state.subjectsList = state.subjectsList.filter(x => x.id !== btn.dataset.id);
        renderSeasonalTable();
        updateCalculations();
    }));
}

function renderOtherCosts() {
    const container = document.getElementById('other-costs-container');
    container.innerHTML = '';

    state.otherCosts.forEach(cost => {
        const div = document.createElement('div');
        div.className = 'other-cost-row';
        div.innerHTML = `
            <input type="text" class="seasonal-table-input cost-name" data-id="${cost.id}" value="${cost.name}" placeholder="項目名 (例: 模擬試験、テキスト代)">
            <input type="number" class="seasonal-table-input cost-price" data-id="${cost.id}" value="${cost.price}" placeholder="金額">
            <span>円</span>
            <button type="button" class="del-row-btn cost-del" data-id="${cost.id}">×</button>
        `;
        container.appendChild(div);
    });

    // Listeners
    container.querySelectorAll('.cost-name').forEach(i => i.addEventListener('input', e => {
        state.otherCosts.find(x => x.id === e.target.dataset.id).name = e.target.value;
    }));
    container.querySelectorAll('.cost-price').forEach(i => i.addEventListener('input', e => {
        const val = parseInt(e.target.value) || 0;
        state.otherCosts.find(x => x.id === e.target.dataset.id).price = val;
        updateCalculations();
    }));
    container.querySelectorAll('.cost-del').forEach(btn => btn.addEventListener('click', e => {
        state.otherCosts = state.otherCosts.filter(x => x.id !== e.target.dataset.id);
        renderOtherCosts();
        updateCalculations();
    }));
}

function getSeasonalUnitPrice(ratio, grade, totalSlots, baseUnitPrice) {
    const defaultTiers = SEASONAL_PRICING_BASE[ratio][grade];
    if (!defaultTiers) return baseUnitPrice;

    const defaultBase = defaultTiers[0];
    const offset = baseUnitPrice - defaultBase;

    let tierIndex = 0;
    if (totalSlots > 50) tierIndex = 4;
    else if (totalSlots > 40) tierIndex = 3;
    else if (totalSlots > 30) tierIndex = 2;
    else if (totalSlots > 20) tierIndex = 1;

    return defaultTiers[tierIndex] + offset;
}

function getSubTotal(ratioType) {
    const propName = (ratioType === "1:2") ? "count_1_2" : "count_1_1";
    let slots = 0;
    state.subjectsList.forEach(item => { slots += (item[propName] || 0); });

    // Safety get pricing
    let ratioObj = PRICING[ratioType] || DEFAULT_PRICING[ratioType];
    if (!ratioObj) ratioObj = DEFAULT_PRICING[ratioType]; // Fallback

    let pricingArr = ratioObj[state.grade];
    if (!pricingArr) pricingArr = DEFAULT_PRICING[ratioType][state.grade];

    let basePrice = 0;
    if (pricingArr && pricingArr.length > 6) {
        basePrice = pricingArr[6];
    } else {
        // Fallback
        const defArr = DEFAULT_PRICING[ratioType][state.grade];
        basePrice = (defArr && defArr.length > 6) ? defArr[6] : 0;
    }

    const unitPrice = getSeasonalUnitPrice(ratioType, state.grade, slots, basePrice);
    const cost = slots * unitPrice;

    return { slots, unitPrice, cost };
}

function updateCalculations() {
    const c12 = getSubTotal("1:2");
    const c11 = getSubTotal("1:1");

    document.getElementById('seasonal-total-slots-1-2').textContent = c12.slots;
    document.getElementById('seasonal-unit-price-1-2').textContent = c12.unitPrice.toLocaleString();
    document.getElementById('seasonal-total-slots-1-1').textContent = c11.slots;
    document.getElementById('seasonal-unit-price-1-1').textContent = c11.unitPrice.toLocaleString();

    // Aggregates
    const seasonalTotalCost = c12.cost + c11.cost;

    let otherTotalCost = 0;
    state.otherCosts.forEach(c => otherTotalCost += (c.price || 0));

    const grandTotal = seasonalTotalCost + otherTotalCost;

    // Display
    document.getElementById('seasonal-tuition-display').textContent = `${seasonalTotalCost.toLocaleString()}円`;
    document.getElementById('other-fees-display').textContent = `${otherTotalCost.toLocaleString()}円`;
    document.getElementById('total-amount-display').textContent = `${grandTotal.toLocaleString()}円`;

    // Line Items for Panel
    const lineItems = document.getElementById('line-items');
    lineItems.innerHTML = '';

    if (c12.slots > 0) {
        const d = document.createElement('div');
        d.className = 'line-item';
        d.innerHTML = `<span>講習(1:2) ${c12.slots}コマ</span> <span>${c12.cost.toLocaleString()}円</span>`;
        lineItems.appendChild(d);
    }
    if (c11.slots > 0) {
        const d = document.createElement('div');
        d.className = 'line-item';
        d.innerHTML = `<span>講習(1:1) ${c11.slots}コマ</span> <span>${c11.cost.toLocaleString()}円</span>`;
        lineItems.appendChild(d);
    }

    // Only show summary of others if > 0
    if (otherTotalCost > 0) {
        const d = document.createElement('div');
        d.className = 'line-item';
        d.innerHTML = `<span>その他経費 合計</span> <span>${otherTotalCost.toLocaleString()}円</span>`;
        lineItems.appendChild(d);
    }

    // Button label
    const seasonLabel = SEASON_TITLES[state.season] || '季節講習';
    const isInvoice = (state.docType === 'invoice');
    els.generateBtn.textContent = isInvoice ? `${seasonLabel} 請求書を作成` : `${seasonLabel} 見積書を作成`;
}

function generateDocument() {
    updateCalculations();

    // 1. Basic Info
    const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('print-date').textContent = today;
    document.getElementById('estimate-id').textContent = Math.floor(100000 + Math.random() * 900000);
    const sName = els.studentNameInput.value.trim() || '______';
    document.getElementById('print-student-name').textContent = sName + ' 様';

    // 2. Headings & Messages
    const seasonLabel = SEASON_TITLES[state.season] || '季節講習';
    const isInvoice = (state.docType === 'invoice');
    document.getElementById('print-title').textContent = `${seasonLabel} ${isInvoice ? '御請求書' : '御見積書'}`;

    const greetingP = document.getElementById('print-greeting');
    greetingP.innerHTML = isInvoice
        ? `いつもご利用ありがとうございます。<br>以下の通り、${seasonLabel}の費用をご請求申し上げます。<br>内容をご確認の上、期日までにお手続きをお願いいたします。`
        : `いつもご利用ありがとうございます。<br>以下の通り、${seasonLabel}の費用をお見積もり申し上げます。<br>ご検討のほどよろしくお願いいたします。`;

    const msgBox = document.getElementById('print-message-box');
    msgBox.innerHTML = '';
    if (isInvoice && els.deadlineInput.value) {
        const d = new Date(els.deadlineInput.value);
        const dStr = d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
        msgBox.innerHTML = `<div style="border:1px solid #e5e7eb; padding:10px; border-radius:4px; text-align:center; font-weight:bold; color:#be123c;">お振込期限：${dStr}</div>`;
    }

    // 3. Company Info
    const companyContainer = document.getElementById('print-company-info-container');
    companyContainer.innerHTML = '';
    const infoDiv = document.createElement('div');
    infoDiv.className = 'header-company-info';
    let logoHtml = userConfig.logo ? `<img src="${userConfig.logo}" alt="Company Logo">` : '';
    infoDiv.innerHTML = `
        ${logoHtml}
        <div class="header-company-text">
            <h3>${userConfig.company || 'ECCベストワン'}</h3>
            <div>〒${userConfig.zip || ''}</div>
            <div>${userConfig.address ? userConfig.address.replace(/\n/g, '<br>') : ''}</div>
            <div>TEL: ${userConfig.phone || ''}</div>
            ${userConfig.invoice ? `<div>登録番号: ${userConfig.invoice}</div>` : ''}
        </div>
    `;
    companyContainer.appendChild(infoDiv);

    // 4. Build Table Rows with Vertical Expansion
    const tbody = document.getElementById('print-table-body');
    tbody.innerHTML = '';

    const addRow = (item, detail, unitPrice, countStr, price) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${item}</td><td>${detail}</td><td>${unitPrice}</td><td>${countStr}</td><td>${price.toLocaleString()}円</td>`;
        tbody.appendChild(tr);
    };

    // Helper to format subject name + detail
    const formatSubj = (item) => item.detail ? `${item.name} (${item.detail})` : item.name;

    // Iterate over subjects manually to list vertically
    const c12 = getSubTotal("1:2");
    const c11 = getSubTotal("1:1");

    state.subjectsList.forEach(item => {
        // Check for 1:2
        if (item.count_1_2 > 0) {
            const subCost = item.count_1_2 * c12.unitPrice;
            addRow(
                `${seasonLabel} (1:2)`,
                `${formatSubj(item)}`,
                `@${c12.unitPrice.toLocaleString()}`,
                `${item.count_1_2}回`,
                subCost
            );
        }
        // Check for 1:1
        if (item.count_1_1 > 0) {
            const subCost = item.count_1_1 * c11.unitPrice;
            addRow(
                `${seasonLabel} (1:1)`,
                `${formatSubj(item)}`,
                `@${c11.unitPrice.toLocaleString()}`,
                `${item.count_1_1}回`,
                subCost
            );
        }
    });

    // Other Costs
    state.otherCosts.forEach(cost => {
        if (cost.name && cost.price) {
            addRow('諸経費', cost.name, '-', '-', cost.price);
        }
    });

    // Display transfer deadline and bank info in remarks
    const deadlineVal = els.deadlineInput.value;
    let deadlineStr = '';
    if (deadlineVal) {
        const d = new Date(deadlineVal);
        deadlineStr = d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    const remarksUl = document.getElementById('print-remarks');
    let remarksHtml = '';

    // Add Transfer Info explicitly
    remarksHtml += `<li style="list-style:none; font-weight:bold; margin-bottom:5px; border-bottom:1px dashed #ccc; padding-bottom:5px;">
        【お振込期限】 ${deadlineStr || '別途ご案内'}
    </li>`;

    if (userConfig.bank) {
        remarksHtml += `<li style="list-style:none; margin-bottom:10px; white-space: pre-wrap; border:1px solid #ddd; padding:8px; border-radius:4px;"><strong>【お振込先】</strong><br>${userConfig.bank}</li>`;
    }

    remarksHtml += `
        <li>本請求は通常の月謝とは別途のご請求となります。</li>
        <li>日程変更やキャンセルの規定については、別途配布のご案内をご確認ください。</li>
    `;
    if (state.materialTbd) {
        remarksHtml += `<li style="font-weight:bold; color:#b45309;">※ 教材費は未定のため、詳細決定後に別途精算させていただきます。</li>`;
    }
    remarksHtml += `<li>ご不明な点がございましたら、お気軽に教室までお問い合わせください。</li>`;
    remarksUl.innerHTML = remarksHtml;

    // Total
    let otherTotalCost = 0;
    state.otherCosts.forEach(c => otherTotalCost += (c.price || 0));
    const grandTotal = c12.cost + c11.cost + otherTotalCost;
    document.getElementById('print-total-amount').textContent = `${grandTotal.toLocaleString()}円`;

    // Total Count
    const totalSlots = c12.slots + c11.slots;
    const totalCountEl = document.getElementById('print-total-count');
    if (totalCountEl) totalCountEl.textContent = `${totalSlots}回`;

    // Footer
    const footerInfo = document.querySelector('.company-info');
    if (footerInfo) footerInfo.innerHTML = `<h3>${userConfig.company}</h3><p>${userConfig.address}</p>`;

    window.print();
}
