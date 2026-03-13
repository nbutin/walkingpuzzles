const database_url = 'https://shorewards.ru/walkingpuzzles';
const admins = ['92610625'];

function _defaults() {
    const obj = {};
    obj.prop_mode = -1;
    obj.prop_distance = 5000;
    obj.prop_activity = 28;
    obj.prop_age = [18, 81];
    return obj;
}

function _reset() {
    const defaults = _defaults();
    window.prop_version = undefined;
    window.prop_mode = defaults.prop_mode;
    window.prop_distance = defaults.prop_distance;
    window.prop_activity = defaults.prop_activity;
    window.prop_age = defaults.prop_age;
    window.prop_cached = {
        prop_mode: 0,
        prop_distance: 0,
        prop_activity: 0,
        prop_age: [],
    };
    window.prop_sex = 0;
    window.prop_profile = [];
    window.prop_deleted = [];
    window.prop_picked = [];
    window.prop_paid = 0;
    window.prop_verified = 0;
    window.prop_stored = {
        prop_sex: 0, // 1, 2
        prop_profile: [],
        prop_deleted: [],
        prop_picked: [],
        prop_paid: 0,
        prop_verified: 0,
    };
    window.prop_profiles = [...characters];
}


_reset();


document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('mode-web');
    window.vk_user_id = new URLSearchParams(location.search).get('vk_user_id');
    if (window.vk_user_id) {
        initVk();
    } else {
        window.sdk = new BastyonSdk();
        sdk.init().then((obj) => {
            console.log('sdk initialized');
            sdk.emit('loaded');
        });
        let target = document.querySelector('main label [value="3"]');
        target.closest('label').querySelector('span').innerHTML = 'Из других соцсетей';
        target.dataset.short = 'Из других соцсетей';
    }
    //~ else if (window.self !== window.top) initBastyon();
    location.hash = 'main';
    window.addEventListener('hashchange', embody);
    window.prop_mode = _defaults().prop_mode;
    appKeepProps('prop_mode');
    appLoadProps();
    prepareSelectors();
    prepareControls();
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
        .then(() => {
            console.log('Service Worker Registered');
        });
    }
});


window.embodying_triggers = {
    '^start$': embodyStart,
    '^main(/.*)?$': embodyMain,
    '^matching/.+$': embodyMatching,
    '^spec-p/.+$': embodySpec,
    '^profile(/.*)?$': embodyProfile,
    '^verify$': embodyVerify,
    '^test-s/.+$': embodyTestS,
    '^test-p/.+$': embodyTestP,
    '^palette$': embodyPalette,
};


function calcSocRating(type_id, selected) {
    const profile = appGetProfileByHash(appGetSelected());
    const tested = soc_types[type_id];
    selected = selected || soc_types[profile[1]];
    if (!tested || !selected) return [-1, -1, []];
    var n1 = 0;
    var r = 0;
    var comment = {};
    var txt_comment = [];
    tested[2].split('').slice(0, 2).forEach(i => {
        n1 += 1;
        let n2 = selected[2].indexOf(i) + 1;
        let k = [n1, n2].sort().join('');
        if (k in soc_scale) {
            r += soc_scale[k][0];
            if (!(soc_scale[k][1] in comment)) {
                comment[soc_scale[k][1]] = [];
            }
            comment[soc_scale[k][1]].push(soc_areas[i].replace(' ', '&nbsp;'));
        }
    });
    var n1 = 0;
    selected[2].split('').slice(0, 2).forEach(i => {
        n1 += 1;
        let n2 = tested[2].indexOf(i) + 1;
        let k = [n1, n2].sort().join('');
        if (k in soc_scale) {
            r += soc_scale[k][0];
            if (!(soc_scale[k][1] in comment)) {
                comment[soc_scale[k][1]] = [];
            }
            if (!comment[soc_scale[k][1]].includes(soc_areas[i].replace(' ', '&nbsp;'))) {
                comment[soc_scale[k][1]].push(soc_areas[i].replace(' ', '&nbsp;'));
            }
        }
    });
    var order = [];
    Object.values(soc_scale).sort((a, b) => b[2] - a[2]).forEach(i => {order.push(i[1])});
    Object.keys(comment).sort((a, b) => order.findIndex(x => x == a) - order.findIndex(x => x == b)).forEach(k => {
        txt_comment.push(`${k} по&nbsp;${comment[k].join(" и ")}`);
    });
    var result = parseInt(((r + 26) / 52) * 100);
    return [result, result, txt_comment];
}


function calcPsyRating(type_id, selected) {
    const profile = appGetProfileByHash(appGetSelected());
    const tested = psy_types[type_id];
    selected = selected || psy_types[profile[2]];
    if (!tested || !selected) return [-1, -1, []];
    var n1 = 0;
    var r = 0;
    var comment = {};
    var txt_comment = [];
    tested[0].split('').forEach(i => {
        n1 += 1;
        let n2 = selected[0].indexOf(i) + 1;
        let k = [n1, n2].sort().join('');
        if (k in psy_scale) {
            r += psy_scale[k][0];
            if (!(psy_scale[k][1] in comment)) {
                comment[psy_scale[k][1]] = [];
            }
            comment[psy_scale[k][1]].push(psy_areas[i]);
        }
    });
    var order = [];
    Object.values(psy_scale).sort((a, b) => b[2] - a[2]).forEach(i => {order.push(i[1])});
    Object.keys(comment).sort((a, b) => order.findIndex(x => x == a) - order.findIndex(x => x == b)).forEach(k => {
        txt_comment.push(`${k} по&nbsp;${comment[k].join("&nbsp;и&nbsp;")}`);
    });
    var result = parseInt(((r + 12) / 24) * 100);
    return [result, result, txt_comment];
}


// 
function calcRating(profile) {
    const soc_rating = calcSocRating(profile[1]);
    const psy_rating = calcPsyRating(profile[2]);
    const min_rating = parseInt((
        parseInt(soc_rating[0] >= 0 && `${soc_rating[0]}` || 0) +
        parseInt(psy_rating[0] >= 0 && `${psy_rating[0]}` || 0)
    ) / 2);
    const max_rating = parseInt((
        parseInt(soc_rating[1] >= 0 && `${soc_rating[1]}` || 100) +
        parseInt(psy_rating[1] >= 0 && `${psy_rating[1]}` || 100)
    ) / 2);
    return [min_rating, max_rating, soc_rating[0], psy_rating[0], soc_rating, psy_rating, profile[9]];
}


function sumRating(numbers) {
    var sum = 0;
    numbers.slice(0, 4).forEach(i => {
        if (i > -1) sum += i;
        else sum += 50;
    });
    return sum;
}


// 
function calcAllRatings() {
    var map = [];
    const selected = appGetSelected();
    const sex = window.prop_profile[3] || window.prop_sex;
    window.prop_profiles.forEach(p => {
        if ('45678'.includes(window.prop_mode) || p && soc_types[p[1]] && psy_types[p[2]] && selected != p[9] && p[3] != sex && !window.prop_deleted.includes(p[9])) {
            map.push(calcRating(p));
        }
    });
    return map.sort((a, b) => (sumRating(b) + b[2] / 1000000) - (sumRating(a) + a[2] / 1000000));
}


function appGetSelected() {
    if (window.prop_profile[9] || window.prop_profile[9] === 0) {
        return window.prop_profile[9];
    } else {
        let profile_id;
        characters.some(v => {
            if (v && v[3] == window.prop_sex) {
                profile_id = v[9];
                return true;
            }
        });
        return profile_id;
    }
}

function applyFilter() {
    let button = document.querySelector('main button');
    button.classList.add('progressed');
    button.disabled = true;
    if (window.prop_mode == -1) {
        appKeepProps();
        embodyMain();
    } else if ('01'.includes(window.prop_mode) && window.sdk && window.sdk.applicationInfo) {
        find(1);
    } else if ('01'.includes(window.prop_mode)) {
        find();
    } else if (window.prop_mode == 2) {
        fetchPicked();
    } else if (window.prop_mode == 3 && !window.vk_user_id) {
        find();
    } else if (window.prop_mode == 3) {
        fetchFriends();
    } else if (window.prop_mode == 4) {
        fetchNews();
    } else if (window.prop_mode == 5) {
        fetchPaid();
    } else if (window.prop_mode == 6) {
        fetchAutoverified();
    } else if (window.prop_mode == 7) {
        fetchEdited();
    } else if (window.prop_mode == 8) {
        fetchNoticed();
    }
}


function selectMode() {
    const main = document.querySelector('main');
    const node = event.target;
    window.prop_mode = parseInt(node.value);
    main.querySelector('div').setAttribute('class', node.dataset.color);
    main.querySelectorAll('input[type="text"]').forEach(i => {
        if ('01'.includes(node.value) || node.value == '-1--') {
            i.disabled = false;
        } else {
            i.disabled = true;
        }
    });
}


// ok
function formatNumbers() {
    const node = event.target;
    const age = (new Date().getFullYear() - window.prop_profile[6]) || 99;
    const min_age = Math.min(age, 18);
    if (age < 18) max_age = 17
    else max_age = 81
    var numbers = node.value.match(/\d+/g);
    if (node.name == 'prop_age') {
        numbers = (numbers || []).map(i => (parseInt(i) >= min_age && parseInt(i)) || min_age);
        numbers = (numbers || []).map(i => (parseInt(i) <= max_age && parseInt(i)) || max_age);
        if (numbers.length) {
            if (numbers.length > 1) {
                window[node.name] = numbers.slice(0, 2).sort((a, b) => a - b);
            } else {
                window[node.name] = [numbers[0], numbers[0]];
            }
        }
    } else if (node.name == 'prop_activity') {
        if (numbers) {
            if (numbers[0] < 1) window[node.name] = 1;
            else if (numbers[0] > 5432) window[node.name] = 5432;
            else window[node.name] = parseInt(numbers[0]);
        }
    } else if (node.name == 'prop_distance') {
        if (numbers) {
            if (numbers[0] < 100) window[node.name] = 100;
            else if (numbers[0] > 20000) window[node.name] = 20000;
            else window[node.name] = parseInt(numbers[0]);
        }
    }
    node.value = eval(node.dataset.format);
}

// 
function embodyStart() {
    if (window.prop_profile[9] !== undefined && window.prop_sex) goHome();
}

function srbg2rgb(str) {
    //~ color(srgb 0.882353 0.141176 0.105882 / 0.25)
    var replaced = [];
    (str.match(/\d\.?\d*/g) || []).slice(0, 3).forEach((v, i) => {
        replaced[i] = Math.round(v * 255);
    });
    if (str.includes('/')) str = str.replace(/color\(srgb [\d\.\s]+/, `rgba(${replaced.join(', ')}`).replace('/', ',');
    else str = str.replace(/color\(srgb [\d\.\s]+/, `rgb(${replaced.join(', ')}`);
    console.log(str, replaced);
    return str;
}


function embodyPalette() {
    document.querySelectorAll('[data-name="palette"]>div>div').forEach(node => {
        node.innerText = `--${node.innerText}: ${srbg2rgb(window.getComputedStyle(node).background)};`;
    });
}


// 
function embodyMain() {
    appLoadProps();
    if (!window.prop_sex) {
        location.hash = 'start';
        return;
    }
    var radio_buttons = document.querySelectorAll('main input[type="radio"]');
    radio_buttons.forEach(node => {
        node.checked = false;
        node.setAttribute('onchange', 'selectMode(event)');
        //~ if (!node.onchange) {
            //~ node.onchange = selectMode;
        //~ }
    });
    let button = document.querySelector('main button');
    button.classList.remove('progressed');
    button.disabled = false;
    document.querySelector(`main input[value="${window.prop_mode}"]`).click();
    document.querySelectorAll('main input[type="text"]').forEach((node, i) => {
        node.setAttribute('onchange', 'formatNumbers(event)');
        //~ if (!node.onchange) {
            //~ node.onchange = formatNumbers;
        //~ }
        if (i == 0) node.value = window.prop_distance;
        else if (i == 1) node.value = window.prop_activity;
        else node.value = window.prop_age;
        node.dispatchEvent(new Event('change'));
    });
    if (appGetSelected() >= 0 && window.prop_mode == -1) {
        window.prop_profiles = [window.prop_profile, ...characters.slice(1)];
        var first = calcRating(window.prop_profile);
    } else if (appGetSelected() >= 0) {
        var first = calcRating(window.prop_profile);
    } else {
        window.prop_profiles = [...characters];
        var first = calcRating(window.prop_profiles[Math.abs(appGetSelected())]);
    }
    let hint = document.querySelector('main>div.hint.care');
    hint.hidden = window.prop_profiles.length > 48 && true || false;
    var items = [first, ...calcAllRatings()];
    items = items;
    var html = '';
    const alt_blocks = document.querySelectorAll('main .alt');
    alt_blocks.forEach(node => {
        node.hidden = true;
    });
    if (window.prop_profile[9] === undefined) {
        alt_blocks[0].hidden = false;
    } else if (window.prop_mode == -1) {
        alt_blocks[1].hidden = false;
    } else if ('01'.includes(window.prop_mode)){
        alt_blocks[2].hidden = false;
        let fields = alt_blocks[2].querySelectorAll('em, i');
        let short = alt_blocks[4].querySelector(`[value="${window.prop_mode}"]`).dataset.short;
        fields[0].innerText = `${short}`;
        fields[1].innerText = `${window.prop_age[0]}-${window.prop_age[1]}`;
        fields[2].innerText = `${window.prop_distance}`;
        fields[3].innerText = `${window.prop_activity}`;
    } else /*if (window.prop_mode >= 2)*/{
        alt_blocks[3].hidden = false;
        let fields = alt_blocks[3].querySelectorAll('em');
        let short = alt_blocks[4].querySelector(`[value="${window.prop_mode}"]`).dataset.short;
        fields[0].innerText = `${short}`;
        //~ alt_blocks[window.prop_mode + 1].hidden = false;
    }
    const translate = {
        anon: 'none',
        best: 'grow',
        good: 'keep',
        cold: 'know',
        weak: 'pick',
        sick: 'deny',
    };
    items.forEach((v, i) => {
        const profile_id = v[6];
        const profile = appGetProfileByHash(profile_id);
        let sr = translate[percentToText(v[4][0], v[4][1])];
        let pr = percentToText(v[5][0], v[5][1]);
        if (profile && profile[2] in psy_types) {
            var f1 = psy_types[profile[2]][0].slice(0, 1);
            var f2 = psy_types[profile[2]][0].slice(1, 2);
        } else {
            var f1 = 'В';
            var f2 = 'Э';
        }
        f1 = {'Ф': 'P1', 'В': 'V1', 'Э': 'E1', 'Л': 'L1'}[f1];
        f2 = {'Ф': 'P2', 'В': 'V2', 'Э': 'E2', 'Л': 'L2'}[f2];
        if (profile && profile[1] in soc_types) {
            let x = soc_types[profile[1]][2].slice(0, 1);
            if (x == x.toLowerCase()) var ie = 'sI';
            else var ie = 'sE';
            x = soc_types[profile[1]][0].slice(0, 1);
            if ('ис'.includes(x.toLowerCase())) var jp = 'sP';
            else var jp = 'sJ';
        } else {
            var ie = 'sE';
            var jp = 'sJ';
        }
        var href = `matching/${profile_id}`;
        if (profile_id == appGetSelected()) href = `profile/${profile_id}`;
        const onclick = `location.hash = '${href}'`;
        const image = profile[10];
        const class_a = [sr, pr, f1, f2, ie, jp].join(' ');
        if (!i) var class_b = 'sepia';
        else if (!profile[4] && profile[9] > 0) var class_b = 'shady';
        else var class_b = '';
        const label = profile[0];
        html += htmlBadge(image, label, onclick, class_a, class_b);
    });
    document.getElementById('map').innerHTML = html;
    const ctl = document.getElementById('admin_controls');
    ctl.hidden = true;
    if (window.prop_mode > 3) {
        document.querySelectorAll('#map .badge').forEach(node => {
            node.addEventListener('mouseover', (event) => {
                let profile = appGetProfileByHash(parseInt(event.target.parentNode.outerHTML.split('/')[1]));
                ctl.hidden = false;
                ctl.style.left = `calc(${event.pageX}px - ((100vw - 360px) / 2) - 8px)`;
                ctl.style.top = `calc(${event.pageY}px - 72px - 8px)`;
                ctl.dataset.target = profile[9];
                ctl.dataset.link = profile[5];
                let controls = ctl.querySelectorAll('*');
                controls[1].src = profile[10];
                controls[2].innerText = profile[0];
                controls[3].innerText = `${profile[3] == 1 && 'Мужчина' || 'Женщина'}, ${fromYearToAge(profile[6])}`;
            });
        });
    }
    fixLayout();
}


// 
//~ function appStoredImage(profile_id) {
    //~ if (!window.non_saving_mode) {
        //~ return coreStoredImage(profile_id)
            //~ || (parseInt(profile_id) > 0 && parseInt(profile_id) < 51
            //~ && `images/${profile_id}.jpg`) || '';
    //~ } else {
        //~ return parseInt(profile_id) > 0 && `https://shorewards.ru/psion/static/images/${profile_id}.jpg` || '';
    //~ }
//~ }



// 
//~ function appBadge(profile_id, modifiers) {
    //~ const image = window.prop_profiles[profile_id][6] || appStoredImage(profile_id);
    //~ var label = '';
    //~ if (window.prop_profiles[profile_id]) {
        //~ label = coreAcronym(window.prop_profiles[profile_id][0]);
    //~ }
    //~ const featured = modifiers && true || false;
    //~ return coreBadge(image, label, null, featured, modifiers);
//~ }


// 
function percentToText(n1, n2) {
    if (n1 < 0 || n2 - n1 > 50) return 'anon';
    else if (n1 >= 80) return 'best';
    else if (n1 >= 60) return 'good';
    else if (n1 >= 45) return 'cold';
    else if (n1 >= 30) return 'weak';
    else return 'sick';
}


// 
function percentToClass(n1, n2) {
    if (n1 < 0 || n2 - n1 > 50) return 'rest';
    else if (n1 >= 80) return 'grow';
    else if (n1 >= 60) return 'keep';
    else if (n1 >= 45) return 'know';
    else if (n1 >= 30) return 'pick';
    else return 'deny';
}


// 
function getColorMark(text) {
    var result = '';
    Object.entries(marks).some(i => {
        if (i[1].includes(text.split(' по&')[0] + ',')) {
            result = i[0];
            return true;
        }
    });
    return result;
}


// 
function formatRatingDetails(items) {
    var html = '';
    items.forEach(i => {
        //~ html += `<li class="${getColorMark(i)}">✔ ${i.replace(' и ', ' и&nbsp;')},</li>`;
        html += `<li class="${getColorMark(i)}">${i.replace(' и ', ' и&nbsp;')},</li>`;
    });
    return html && html.slice(0, -6) + '.</li>' || '';
}


function correctVerifyHeader(header, status) {
    if (status === undefined || status == -1) {
        header.innerText = 'Персонаж';
        header.className = 'care';
    } else if (status == 1) {
        header.innerHTML = `<a onclick="location.hash = 'verify'" style="background:inherit; color:inherit">Профиль прошёл проверку</a>`;
        header.className = 'grow';
    } else if (status == 2) {
        header.innerHTML = `<a onclick="location.hash = 'verify'" style="background:inherit; color:inherit">Профиль автоверифицирован</a>`;
        header.className = 'keep';
    } else {
        header.innerHTML = `<a onclick="location.hash = 'verify'" style="background:inherit; color:inherit">Профиль не верифицирован</a>`;
        header.className = 'deny';
    }
}


// 
function embodyMatching() {
    const id1 = appGetSelected();
    const selected = appGetProfileByHash(id1);
    if (id1 == window.prop_profile[9]) {
        var left_button = 'Исправить';
    } else {
        var left_button = 'В профиль';
    }
    const matched = appGetProfileByHash();
    const id2 = matched[9];
    const header = document.querySelector('[data-name="matching"] h2');
    correctVerifyHeader(header, matched[4]);
    link1e = `profile/${id1}`;
    link2e = `profile/${id2}`;
    var profile_button = `<button class="deny" onclick="saveProfile()">Удалить</button>`;
    if (matched[4] === undefined) {
        profile_button = `<button onclick="location.hash = '${link2e}'">Профиль</button>`;
    }
    var link1s = `spec-s/${selected[1]}`;
    var link2s = `spec-s/${matched[1]}`;
    var link1p = `spec-p/${selected[2]}`;
    var link2p = `spec-p/${matched[2]}`;
    var url1 = selected[10];
    var url2 = matched[10];
    var badge1 = htmlBadge(url1, selected[0], `location.hash = '${link1e}'`);
    var badge2 = htmlBadge(url2, matched[0], `location.hash = '${link2e}'`);
    const rating = calcRating(matched);
    if (rating[0] == rating[1]) var sum_percent = rating[0];
    else var sum_percent = `от ${rating[0]} до ${rating[1]}`;
    if (rating[4][0] > -1) var soc_percent = rating[4][0] + '%';
    else var soc_percent = 'неизвестно';
    if (rating[5][0] > -1) var psy_percent = rating[5][0] + '%';
    else var psy_percent = 'неизвестно';
    var sum_rating = percentToClass(rating[0], rating[1]);
    var soc_rating = percentToClass(rating[4][0], rating[4][1]);
    var psy_rating = percentToClass(rating[5][0], rating[5][1]);
    var soc_details = formatRatingDetails(rating[4][2]);
    var psy_details = formatRatingDetails(rating[5][2]);
    var html = `
        <h3 class="colspan-2">Совместимость — ${sum_percent}%</h3>
        ${badge1.replace('"badge"', '"badge ' + sum_rating + '"')}
        ${badge2.replace('"badge"', '"badge ' + sum_rating + '"')}
        <h3 class="colspan-2">По социотипу — ${soc_percent}</h3>
        <div class="${soc_rating} left"><button onclick="location.hash = '${selected[1] >= 0 && link1s || link1e}'">${selected[1] >= 0 && soc_types[selected[1]][1] || '&nbsp; ? &nbsp;'}</button></div>
        <div class="${soc_rating}"><button onclick="location.hash = '${matched[1] >= 0 && link2s || link2e}'">${matched[1] >= 0 && soc_types[matched[1]][1] || '&nbsp; ? &nbsp;'}</button></div>
        <ul id="soc-details" class="colspan-2">
                    ${soc_details}
                </ul>
        <h3 class="colspan-2">По психотипу — ${psy_percent}</h3>
        <div class="${psy_rating} left"><button onclick="location.hash = '${selected[2] >= 0 && link1p || link1e}'">${selected[2] >= 0 && psy_types[selected[2]][1] || '&nbsp; ? &nbsp;'}</button></div>
        <div class="${psy_rating}"><button onclick="location.hash = '${matched[2] >= 0 && link2p || link2e}'">${matched[2] >= 0 && psy_types[matched[2]][1] || '&nbsp; ? &nbsp;'}</button></div>
        <ul id="psy-details" class="colspan-2">
                    ${psy_details}
                </ul>
        <button onclick="location.hash = '${link1e}'">${left_button}</button>
        <button onclick="location.hash = '${link2e}'">В профиль</button>
    `;
    document.querySelector('#matching .grid').innerHTML = html;
    fixLayout();
}


// 
function embodySpec(type_id) {
    var type = psy_types[type_id || location.hash.split('/').slice(-1)[0]];
    document.querySelector('[data-name="spec-p"] h3').innerText = `${type[1]} (${type[0]})`;
    document.querySelectorAll('[data-name="spec-p"] strong').forEach((node, i) => {
        node.innerText = functions[type[0][i]];
    });
    fixLayout();
}


// 
function appGetProfileByHash(profile_id) {
    if (profile_id === undefined) {
        profile_id = parseInt(location.hash.split('/').slice(-1)[0] || window.prop_profile[9] || 0);
    }
    if (profile_id < 0) {
        return [...characters[Math.abs(profile_id)]];
    } else if (!profile_id || profile_id == window.prop_profile[9]) {
        if (window.prop_profile.length) {
            return window.prop_profile;
        } else {
            return ['', -1, -1, window.prop_sex];
        }
    } else {
        let profile;
        window.prop_profiles.some(p => {
            if (p[9] == profile_id) {
                profile = [...p];
                return true;
            }
        });
        return profile;
    }
}


// 
function fromCacheOrProfile(index) {
    const profile = appGetProfileByHash();
    const cached = appCachedProfileValue(index);
    if (index == 10 && profile[9] < 0) {
        return `images/${Math.abs(profile[9])}.jpg`;
    } else {
        if (cached != undefined) {
            return cached;
        } else {
            return profile[index];
        }
    }
}


// 
function appCachedProfileValue(i, value) {
    if (!window._cached_ || [undefined].includes(i)) {
        window._cached_ = [];
    }
    if (value !== undefined) {
        if (parseInt(value) == value) value = parseInt(value);
        else if (parseFloat(value) == value) value = parseFloat(value);
        window._cached_[i] = value;
    } else if (i !== undefined) {
        return window._cached_[i];
    }
}

// ok
function loadProfileInfo(profile) {
    const section = document.querySelector('[data-name="profile"]');
    if (window.vk_user_id) {
        vkBridge.send('VKWebAppGetUserInfo', { 
            user_ids: `${window.vk_user_id}`, 
        })
        .then(data => {
            console.log(data);
            if (data.id && location.hash.slice(1, 8) == 'profile' && appGetProfileByHash()[9] == profile[9]) {
                let name = `${data.first_name} ${data.last_name}`;
                let url = `https://vk.ru/id${data.id}`;
                appCachedProfileValue(10, data.photo_200);
                appCachedProfileValue(0, appCachedProfileValue(0) || name);
                appCachedProfileValue(5, url);
                section.querySelector('[name="name"]').value = appCachedProfileValue(0) || name;
                section.querySelector('.badge i').style.backgroundImage = `url("${data.photo_200}")`;
                let link_control = section.querySelector('[name="link"]');
                link_control.setAttribute('onclick', `openExternalLink('${url}')`);
                link_control.value = 'Страница в социальной сети';
            }
        });
    } else if (sdk.applicationInfo) {
        sdk.permissions.request(['account'])
        .then(granted => {
            if (granted) {
                sdk.get.account()
                .then(account => {
                    console.log('>>> account: ', account);
                    if ('address' in account) {
                        let url = `https://bastyon.com/${account.address}`;
                        appCachedProfileValue(12, account.signature);
                        sdk.rpc('getuserprofile', [[account.address]], {})
                        .then(profile => {
                            console.log('>>> profile: ', profile);
                            //~ profile = profile[0];
                            let name = profile[0].name;
                            appCachedProfileValue(10, profile[0].i);
                            appCachedProfileValue(0, appCachedProfileValue(0) || name);
                            appCachedProfileValue(5, url);
                            section.querySelector('[name="name"]').value = appCachedProfileValue(0) || name;
                            section.querySelector('.badge i').style.backgroundImage = `url("${profile[0].i}")`;
                            let link_control = section.querySelector('[name="link"]');
                            link_control.setAttribute('onclick', `openExternalLink('${url}')`);
                            link_control.value = 'Страница в социальной сети';
                        })
                    }
                });
            }
        });
    }
}


function fromYearToAge(year) {
    const num = `${new Date().getFullYear() - year}`;
    var txt = 'лет';
    if (num.slice(-2, -1) != '1') {
        if (num.slice(-1) == '1') txt = 'год';
        else if ('234'.includes(num.slice(-1))) txt = 'года';
    }
    return `${num} ${txt}`;
}

// ok
function embodyProfile() {
    if (core_history_of_embodyings[1].slice(0, 5) != 'test-') {
        appCachedProfileValue();
    }
    const profile = appGetProfileByHash();
    const section = document.querySelector('[data-name="profile"]');
    const header = section.querySelector('h2');
    correctVerifyHeader(header, profile[4]);
    if (profile[9] == window.prop_profile[9]) checkStatus();
    if (profile[9] == window.prop_profile[9] && window.prop_paid && !window.prop_verified) {
        document.getElementById('paid').hidden = false;
    } else {
        document.getElementById('paid').hidden = true;
    }
    section.querySelectorAll('.hint>div').forEach((h, i) => {
        if (i < 2) h.innerHTML = '';
        h.parentNode.hidden = true;
    });
    const inputs = section.querySelectorAll('input, select');
    const image = document.getElementById('badge-place');
    image.innerHTML = htmlBadge();
    if (profile[9] == window.prop_profile[9]) {
        loadProfileInfo(profile);
        section.querySelector('[data-part="additional"]').hidden = false;
        section.querySelector('[data-part="additional"] p').hidden = false;
        if (!profile[9]) {
            header.innerText = 'Мой профиль';
            header.className = '';
        }
        inputs.forEach(i => {
            if (['location', 'year'].includes(i.name)) {
                i.classList.remove('link');
                i.removeAttribute('onfocus');
                i.removeAttribute('onclick');
            } else if (i.name == 'link'){
                if (profile[5]) {
                    i.setAttribute('onclick', `openExternalLink('${fromCacheOrProfile(5)}')`);
                    i.value = 'Страница в социальной сети';
                } else {
                    i.removeAttribute('onclick');
                    i.value = '';
                }
            } else {
                i.disabled = false;
            }
        });
    } else {
        if (profile[9] < 0) {
            section.querySelector('[data-part="additional"]').hidden = true;
        } else {
            section.querySelector('[data-part="additional"]').hidden = false;
            section.querySelector('[data-part="additional"] p').hidden = true;
        }
        inputs.forEach(i => {
            if (profile[9] > 0 && ['link', 'location', 'year'].includes(i.name)) {
                i.setAttribute('onfocus', 'this.blur()');
                if (i.name == 'location') {
                    i.classList.add('link');
                    i.setAttribute('onclick', `openExternalLink('https://yandex.ru/maps/?ll=${profile[8]}%2C${profile[7]}&z=7')`);
                    i.value = `Меньше ${maxDistanceFromMe(profile[7], profile[8])} км`;
                } else if (i.name == 'link') {
                    i.classList.add('link');
                    i.setAttribute('onclick', `openExternalLink('${fromCacheOrProfile(5)}')`);
                    i.value = 'Страница в социальной сети';
                } else if (i.name == 'year') {
                    i.value = fromYearToAge(fromCacheOrProfile(6));
                }
            } else if (!['link', 'location', 'year'].includes(i.name)) {
                i.disabled = true;
            }
        });
    }
    const [
        input_name,
        soc_selector,
        psy_selector,
        sex_selector,
        input_link,
        input_location,
        input_year,
        ] = inputs;
    input_name.value = fromCacheOrProfile(0);
    changedProfile(0, input_name);
    if (profile[9] > 0) {
        image.innerHTML = htmlBadge(fromCacheOrProfile(10), input_name.value, "openExternalLink(fromCacheOrProfile(5))");
    } else {
        image.innerHTML = htmlBadge(fromCacheOrProfile(10), input_name.value);
    }
    if (!profile[9] || profile[9] >= 0) {
        const lat = fromCacheOrProfile(7);
        const lon = fromCacheOrProfile(8);
        if (profile[9] == window.prop_profile[9]) {
            input_link.value = fromCacheOrProfile(5) || '';
            input_location.value = lat && lon && `${lat.toFixed(3)}, ${lon.toFixed(3)}` || '';
            input_year.value = fromCacheOrProfile(6) || '';
        }
        appCachedProfileValue(profile_map.indexOf('link'), fromCacheOrProfile(5) || '');
        appCachedProfileValue(profile_map.indexOf('lat'), lat);
        appCachedProfileValue(profile_map.indexOf('lon'), lon);
        appCachedProfileValue(profile_map.indexOf('year'), fromCacheOrProfile(6) || '');
    }
    soc_selector.value = `${fromCacheOrProfile(1)}` || -1;
    changedProfile(0, soc_selector);
    psy_selector.value = `${fromCacheOrProfile(2)}` || -1;
    setTimeout(() => {changedProfile(0, psy_selector)}, 9);
    appCachedProfileValue(3, fromCacheOrProfile(3) || window.prop_sex);
    sex_selector.value = appCachedProfileValue(3);
    fixLayout();
}


// ok
function embodyVerify() {
    var buttons = document.querySelectorAll('[data-name="verify"] button');
    if (window.prop_paid || window.prop_verified) {
        buttons[0].hidden = true;
        buttons[1].hidden = true;
    } else {
        buttons[0].hidden = false;
        buttons[1].hidden = false;
    }
    fixLayout();
}


// 
function prepareSelectors() {
    const [soc_selector, psy_selector] = document.querySelectorAll('[data-name="profile"] select');
    var items = [
        '<option value="-1">Социотип ( ? )</option>', 
        '<option value="test">Определить с помощью теста...</option>',
    ];
    soc_types.forEach((v, i) => {
        items.push(`<option value="${i}">${v[0]}, ${v[1]}</option>`);
    });
    soc_selector.innerHTML = items.join('\n');
    items = [
        '<option value="-1">Психотип ( ? )</option>',
        '<option value="test">Определить с помощью теста...</option>',
    ];
    psy_types.forEach((v, i) => {
        items.push(`<option value="${i}">${v[0]}, ${v[1]}</option>`);
    });
    psy_selector.innerHTML = items.join('\n');
}


// ok
function isChanged() {
    const profile = appGetProfileByHash();
    if (window._cached_) {
        return window._cached_.some((v, i) => {
            if (v != profile[i]) {
                return true;
            }
        });
    } else {
        return false;
    }
}


// ok
function isComplete() {
    const profile = appGetProfileByHash();
    if (!window._cached_[0] || !window._cached_[3] || !window._cached_[7] || !window._cached_[8]) return false;
    else if (parseInt(window._cached_[1]) < 0) return false;
    else if (parseInt(window._cached_[2]) < 0) return false;
    else if (`${window._cached_[6]}`.length != 4) return false;
    else return true;
    //~ var result = true;
    //~ for (let i = 0; i < 9; i++) {
        //~ if (![4, 5].includes(i)) {
            //~ if ([1, 2].includes(i) && (!window._cached_ || parseInt(window._cached_[i]) < 0)) {
                //~ result = false;
            //~ } else if (i == 6 && (!window._cached_ || !window._cached_[i] || `${window._cached_[i]}`.length != 4)) {
                //~ result = false;
            //~ } else if (![1, 2].includes(i) && (!window._cached_ || !window._cached_[i])) {
                //~ result = false;
            //~ }
        //~ }
    //~ }
    //~ return result;
}

function prepareControls() {
    document.querySelectorAll('[data-name="profile"] select').forEach(c => {
        c.addEventListener('change', changedProfile);
        
    });
    document.querySelectorAll('[data-name="profile"] input').forEach(c => {
        c.addEventListener('keyup', changedProfile);
        c.addEventListener('change', changedProfile);
        //~ c.addEventListener('blur', changedProfile);
    });
}


// ok
function changedProfile(event, target) {
    name = event && event.target.name || target.name;
    value = event && event.target.value || !event && target.value || '';
    const profile = appGetProfileByHash();
    const section = document.querySelector('[data-name="profile"]');
    const [pick_button, button] = section.querySelectorAll('button');
    if (['test-s', 'test-p'].includes(name) && value == 'test') {
        location.hash = `${name}/${profile[9]}`;
        return;
    } else {
        appCachedProfileValue(profile_map.indexOf(name), value);
    }
    pick_button.hidden = true;
    setTimeout(() => {
        const hints = section.querySelectorAll('.hint>div');
        if (name == 'name') {
            let input_name = section.querySelector('input[name="name"]');
            input_name.value = value.replaceAll(/[<>]|^\s+$/g, '');
            let image = section.querySelector('#badge-place');
            if (profile[9] > 0) {
                image.innerHTML = htmlBadge(fromCacheOrProfile(10), input_name.value, "openExternalLink(fromCacheOrProfile(5))");
            } else {
                image.innerHTML = htmlBadge(fromCacheOrProfile(10), input_name.value);
            }
        } else if (name == 'year') {
            let input_year = section.querySelector('input[name="year"]');
            let raw = `${Math.abs(parseInt(input_year.value))}`;
            let val = '';
            let this_year = new Date().getFullYear();
            while (raw && !val) {
                for (let i=this_year-99; i<this_year-13; i++) {
                    if (raw == `${i}`.slice(0, raw.length)) {
                        val = raw;
                        break;
                    }
                }
                raw = raw.slice(0, -1);
            }
            if (document.activeElement.name != name && val.length < 4) {
                val = '';
            }
            input_year.value = val;
            appCachedProfileValue(6, parseInt(val));
        } else if (name == 'location') {
            let input_location = section.querySelector('input[name="location"]');
            let [raw_lat, raw_lon] = (input_location.value.match(/-?\d+\.?\d*/g) || []);
            let lat = raw_lat && parseFloat(raw_lat);
            let lon = raw_lon && parseFloat(raw_lon);
            if (lat != undefined && lat >= -90 && lat <= 90
                && lon != undefined && lon >= -180 && lon <= 180) {
                appCachedProfileValue(profile_map.indexOf('lat'), lat.toFixed(3));
                appCachedProfileValue(profile_map.indexOf('lon'), lon.toFixed(3));
                //~ if (lat == raw_lat) lat = raw_lat;
                //~ if (lon == raw_lon) lon = raw_lon;
                if (document.activeElement.name != name) {
                    input_location.value = `${parseFloat(raw_lat).toFixed(3)}, ${parseFloat(raw_lon).toFixed(3)}`;
                } else {
                    input_location.value = `${raw_lat}, ${raw_lon}`;
                }
            } else if (document.activeElement.name != name) {
                input_location.value = '';
                appCachedProfileValue(7, null);
                appCachedProfileValue(8, null);
            } else {
                appCachedProfileValue(7, null);
                appCachedProfileValue(8, null);
            }
        } else if (name.split('-').slice(-1)[0] == 's') {
            if (parseInt(value) >= 0) {
                hints[0].innerHTML = document.querySelector(`[data-name="spec-s/${value}"]`).innerHTML;
                hints[0].parentNode.hidden = false;
                if (profile[9] == window.prop_profile[9]) hints[2].parentNode.hidden = false;
            } else {
                hints[0].innerHTML = '';
                hints[0].parentNode.hidden = true;
                if (!(parseInt(section.querySelector('[name="test-p"]').value) >= 0)) hints[2].parentNode.hidden = true;
            }
        } else if (name.split('-').slice(-1)[0] == 'p') {
            if (parseInt(value) >= 0) {
                embodySpec(value);
                hints[1].innerHTML = document.querySelector('[data-name="spec-p"] div').innerHTML;
                hints[1].parentNode.hidden = false;
                if (profile[9] == window.prop_profile[9]) hints[2].parentNode.hidden = false;
            } else {
                hints[1].innerHTML = '';
                hints[1].parentNode.hidden = true;
                if (!(parseInt(section.querySelector('[name="test-s"]').value) >= 0)) hints[2].parentNode.hidden = true;
            }
        }
        if (profile[9] < 0) {
            button.innerText = 'Удалить';
            button.className = 'deny';
            button.disabled = true;
        } else if (profile[0] && !isChanged()) {
            button.innerText = 'Удалить';
            button.className = 'deny';
            button.disabled = false;
            if (profile[9] != window.prop_profile[9]) {
                pick_button.hidden = false;
                switchPickOrReleaseButton(pick_button, window.prop_picked.includes(profile[9]));
            }
        } else if (profile[0] && !appCachedProfileValue(0)) {
            button.innerText = 'Удалить';
            button.className = 'deny';
            button.disabled = false;
        } else if (isChanged() && isComplete()) {
            button.innerText = 'Сохранить';
            button.className = 'grow';
            button.disabled = false;
        } else {
            button.innerText = 'Сохранить';
            button.className = 'grow';
            button.disabled = true;
        }
        if (['test-s', 'test-p'].includes(name)) {
            fixLayout();
        }
    }, 1);
}


//~ function toStorage(key, val) {
    //~ localStorage[key] = JSON.stringify(val);
//~ }


// 
//~ function applyImage() {
    //~ const file = document.getElementById('uploaded').files[0];
    //~ if (!['image/jpeg', 'image/gif', 'image/svg+xml', 'image/png'].includes(file.type)) {
        //~ alert('Неверный тип файла.\nПодойдут: png, jpeg, svg и gif');
        //~ return;
    //~ }
    //~ const url = URL.createObjectURL(file);
    //~ compressImage(url, data => {
        //~ appCachedProfileValue(9, appGetProfileByHash()[9]);
        //~ appCachedProfileValue(8, data);
        //~ const image = document.querySelector('.-edit .badge a[style]');
        //~ image.style.backgroundImage = `url('${data}')`;
        //~ const input_name = document.querySelector('.-edit input[name="name"]');
        //~ if (input_name.value) {
            //~ const button = document.querySelector('.-edit button');
            //~ button.disabled = false;
        //~ }
    //~ });
//~ }


//~ // 
//~ function compressImage(url, callback) {
    //~ const canvas = document.createElement('canvas');
    //~ canvas.width = 240;
    //~ canvas.height = 240;
    //~ const ctx = canvas.getContext('2d');
    //~ const img = new Image;
    //~ img.onload = function() {
        //~ ctx.drawImage(img, 0, 0, 240, 240);
        //~ [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1].some(x => {
            //~ let result = canvas.toDataURL('image/jpeg', x);
            //~ if (result.length <= 50 * 1024) {
                //~ callback(result);
                //~ return true;
            //~ }
        //~ });
    //~ }
    //~ img.src = url;
//~ }



//~ function coreStoredImage(id, data) {
    //~ const name = `image-${id}`;
    //~ if (data === undefined) {
        //~ return window[name];
    //~ } else if (data === null) {
        //~ delete window[name];
        //~ delete window.prop_stored[name];
        //~ appSaveProps([name, 'prop_stored']);
    //~ } else {
        //~ window[name] = data;
        //~ window.prop_stored[name] = '';
        //~ appSaveProps([name, 'prop_stored']);
    //~ }
//~ }



function goHome() {
    if (!window.prop_sex) {
        location.hash = 'start';
    } else {
        location.hash = 'main';
    }
}


// 
function embodyTestS() {
    document.querySelector('[data-name="test-s"] button:first-of-type').disabled = true;
    document.querySelectorAll('[data-name="test-s"] input[type="radio"]').forEach(node => {
        node.checked = false;
        node.removeEventListener('change', checkTestS);
        node.addEventListener('change', checkTestS);
    });
}


function checkTestS() {
    var checked = 0;
    document.querySelectorAll('[data-name="test-s"] input').forEach(node => {
        if (node.checked) checked += 1;
    });
    if (checked == 4) {
        document.querySelector('[data-name="test-s"] button:first-of-type').disabled = false;
    }
}


// 
function acceptTestS() {
    const form = document.querySelector('[data-name="test-s"] form');
    const type_code = `${form.EI.value}${form.NS.value}${form.TF.value}${form.JP.value}`;
    appCachedProfileValue(9, appGetProfileByHash()[9]);
    soc_types.forEach((v, i) => {
        if (v[3] == type_code) appCachedProfileValue(1, i);
    });
    history.back();
}


function embodyTestP() {
    const section = document.querySelector('[data-name="test-p"]');
    section.querySelector('button').disabled = true;
    section.querySelectorAll('input[type="radio"]').forEach(node => {
        node.checked = false;
        node.removeAttribute('data-checked');
        node.removeEventListener('change', checkTestP);
        node.addEventListener('change', checkTestP);
    });
    section.querySelectorAll('.step2').forEach(node => {
        node.hidden = true;
    });
    fixLayout();
}



function checkTestP(step) {
    const section = document.querySelector('[data-name="test-p"]');
    const [form1, form2, form3] = section.querySelectorAll('form p');
    const checked1 = form1.querySelectorAll('input[data-checked]');
    const checked2 = form2.querySelectorAll('input[data-checked]');
    const checked3 = form3.querySelectorAll('input[data-checked]');
    if (event.target.parentNode.parentNode.childElementCount == 4 && checked1.length > 1) {
        embodyTestP();
    }
    event.target.checked = true;
    event.target.dataset.checked = true;
    if (checked1.length == 1) {
        section.querySelectorAll('.step2').forEach(node => {
            node.hidden = false;
            form2.innerText = '';
            form3.innerText = '';
            form1.querySelectorAll('input').forEach(node => {
                let clone = node.parentNode.cloneNode(true);
                if (node.checked) {
                    form3.appendChild(clone);
                } else {
                    form2.appendChild(clone);
                }
                form2.querySelectorAll('input').forEach(node => {
                    node.checked = false;
                    node.removeAttribute('data-checked');
                    node.name = '13';
                    node.setAttribute('onchange', 'checkTestP(event)');
                });
                form3.querySelectorAll('input').forEach(node => {
                    node.checked = false;
                    node.removeAttribute('data-checked');
                    node.name = '24';
                    node.setAttribute('onchange', 'checkTestP(event)');
                });
            });
        });
        fixLayout();
    } else if (event.target.name == '13' && checked2.length) {
        form2.querySelectorAll('input').forEach(node => {
            if (node.value != event.target.value) {
                node.checked = false;
                node.removeAttribute('data-checked');
            } 
        });
    } else if (event.target.name == '24' && checked3.length) {
        form3.querySelectorAll('input').forEach(node => {
            if (node.value != event.target.value) {
                node.checked = false;
                node.removeAttribute('data-checked');
            } 
        });
    }
    if (section.querySelectorAll('input[data-checked]').length == 4) {
        section.querySelector('button').disabled = false;
    }
}


// 
function acceptTestP() {
    const [f13, f24] = document.querySelectorAll('[data-name="test-p"] form:not(:first-of-type)');
    const f1 = f13.querySelector('[data-checked]');
    const f3 = f13.querySelector('input:not([data-checked])');
    const f2 = f24.querySelector('[data-checked]');
    const f4 = f24.querySelector('input:not([data-checked])');
    const type_code = `${f1.value}${f2.value}${f3.value}${f4.value}`;
    appCachedProfileValue(9, appGetProfileByHash()[9]);
    psy_types.forEach((v, i) => {
        if (v[0] == type_code) {
            appCachedProfileValue(2, i);
        }
    });
    history.back();
}


function visit(name) {
    var map = {
        'default': 'https://bastyon.com/psihosocionika',
        'hobbystu': 'https://vk.com/hobbystu',
        'featured': 'https://bastyon.com/index?video=1&v=49856f48491e9befd89252d3edda8a420d5eccab75731ed75dd6a782e33a3cd7',
        'lexigo': 'https://bastyon.com/index?video=1&v=fce8ddc8700a00693ee602e41cd768e7549aad59dacd7dad213e23a9af362c84',
        'pogodavdometer': 'https://bastyon.com/index?v=888d76fcbe1e28cc25b412d46344fd49e6c69c013743f14f1a52ef066d60bbf2&video=1&ref=PHN3UprgHjMPQsiXkqEju9bAqCmD73H6B9',
        'lifetuner': 'https://bastyon.com/post?s=af2e4950af5286ef411949b350ea7d40aa62f3036dca6559f19f1136f5fce659&ref=PHN3UprgHjMPQsiXkqEju9bAqCmD73H6B9',
        'verify': 'https://vk.com/market/product/psikhosotsiotipirovanie-235782738-13989406',
    }
    var vk_map = {
        'default': 'https://vk.com/psihosocionika',
        'hobbystu': 'https://vk.com/hobbystu',
        'featured': 'https://vk.com/psihosocionika?w=wall-235782738_13',
        'lexigo': 'https://vk.com/app54185696',
        'pogodavdometer': 'https://vk.com/pogodavdometer',
        'lifetuner': 'https://vk.com/progressinator',
        'verify': 'https://vk.com/market/product/psikhosotsiotipirovanie-235782738-13989406',
    }
    openExternalLink((window.vk_user_id && vk_map || map)[name || 'default'] || name);
}


//~ function setup() {
    //~ if (window.vk_user_id) {
        //~ vkBridge
        //~ .send("VKWebAppRecommend")
        //~ .finally(() => {
            //~ vkBridge
            //~ .send("VKWebAppAddToFavorites")
            //~ .finally(() => {
                //~ vkBridge
                //~ .send("VKWebAppAllowNotifications")
                //~ .finally(() => {
                //~ });
            //~ });
        //~ });
    //~ } else {
        //~ location.hash = '-settings';
    //~ }
//~ }









//~ var _install_prompt;


//~ window.addEventListener('beforeinstallprompt', (e) => {
    //~ e.preventDefault();
    //~ _install_prompt = e;
//~ });


//~ function install(){
    //~ if (_install_prompt){
        //~ _install_prompt.prompt();
        //~ _install_prompt.userChoice.then(r => {
            //~ if (r.outcome === 'accepted') {
                //~ log('Installation accepted');
                //~ alert('Приложение установлено :)');
            //~ } else {
                //~ log('Installation refused');
            //~ }
        //~ });
    //~ } else {
        //~ alert('Что-то пошло не так :(');
    //~ }
//~ }


function start(sex) {
    window.prop_sex = sex;
    appSaveProps('prop_sex');
    location.hash = 'main';
}


function find(exclude_vk) {
    const [stype, ptype, sex, x, y, year, lat, lon, id] = window.prop_profile.slice(1);
    const from_year = new Date().getFullYear() - window.prop_age[1];
    const to_year = new Date().getFullYear() - window.prop_age[0];
    const is_verified = window.prop_mode == 1 && 1 || 0;
    const deleted = window.prop_deleted.length && window.prop_deleted || [0];
    const delta = window.prop_distance / 100;
    fetch(`${database_url}/find/${stype}/${ptype}/${sex}/${window.prop_activity}/${from_year}/${to_year}/${parseFloat(lat - delta).toFixed(3)}/${parseFloat(lat + delta).toFixed(3)}/${parseFloat(lon - delta).toFixed(3)}/${parseFloat(lon + delta).toFixed(3)}/${is_verified}/${deleted}/${id}/${exclude_vk && 1 || 0}`)
    .then(resp => {
        if (!resp.ok) {
            throw new Error('Finding operation failed');
        }
        return resp.json();
    })
    .then(data => {
        console.log('Found:', data);
        window.prop_profiles = [window.prop_profile, ...data];
        appKeepProps();
        embodyMain();
    })
    .catch(error => {
        console.error('Error:', error);
        let button = document.querySelector('main button');
        button.classList.remove('progressed');
        button.disabled = false;
    });
    //~ .finally(() => {
        //~ let button = document.querySelector('main button');
        //~ button.classList.remove('progressed');
        //~ button.disabled = false;
    //~ });
}

function checkStatus() {
    fetchPicked([window.prop_profile[9]], (data) => {
        if (data[0][4] && data[0][4] != window.prop_profile[4]) {
            window.prop_profile[4] = data[0][4];
            window.prop_verified = 1;
            window.prop_paid = 0;
            appSaveProps();
            embody();
        }
    });
}


function fetchPicked(list, callback) {
    const picked = list || window.prop_picked.length && window.prop_picked || [0];
    fetch(`${database_url}/pick/${picked}`)
    .then(resp => {
        if (!resp.ok) {
            throw new Error('Fetching operation failed');
        }
        return resp.json();
    })
    .then(data => {
        console.log('Fetched:', data);
        if (!list) {
            window.prop_profiles = [window.prop_profile, ...data];
            appKeepProps();
            embodyMain();
        } else if (callback) {
            callback(data);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        let button = document.querySelector('main button');
        button.classList.remove('progressed');
        button.disabled = false;
    });
    //~ .finally(() => {
        //~ let button = document.querySelector('main button');
        //~ button.classList.remove('progressed');
        //~ button.disabled = false;
    //~ });
}


// ok
function saveProfile() {
    const profile_id = appGetProfileByHash()[9];
    if (profile_id != window.prop_profile[9] && event.target.className == 'deny') {
        if (!confirm('Удаляя этот профиль вы исключаете его из всех своих будущих выборок. Удалить?')) return;
        window.prop_deleted.push(profile_id);
        window.prop_deleted = window.prop_deleted.slice(-99);
        appSaveProps('prop_deleted');
        goHome();
    } else if (event.target.className == 'deny') {
        if (confirm('Данные вашего профиля будут полностью стёрты. Списки удалённых вами и добавленных в Интересное будут очищены. Продолжить?')) {
            if (profile_id) {
                const p = window.prop_profile;
                const data = {link: p[5], params: location.search, secret: p[12]};
                fetch(`${database_url}/deny/${profile_id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                })
                .then(resp => {
                    if (!resp.ok) {
                        throw new Error('Profile has not been edited in DB');
                    }
                    return resp.json();
                })
                .then(data => {
                    console.log('Profile has been deleted from DB:', data);
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            }
            reset();
        }
    } else {
        for (let i=0; i<11; i++) {
            if (window._cached_[i] !== undefined) {
                var unverified = false;
                var confirmed = undefined;
                if ('678'.includes(i) && window._cached_[i] != parseFloat(window._cached_[i])) {
                    event.target.disabled = true;
                    return;
                }
                if ('1236'.includes(i) && window.prop_profile[i] != window._cached_[i]) {
                    if (window.prop_verified && confirmed == undefined) confirmed = confirm('Вы изменили один из ключевых параметров (социотип, психотип, пол или возраст). Отметка о верификации, если она у вас была, аннулируется. Продолжить?');
                    if (window.prop_verified && !confirmed) {
                        return;
                    } else {
                        window.prop_profile[4] = 0;
                        window.prop_verified = 0;
                        unverified = true;
                    }
                }
                if ((i == 6 && window.prop_profile[6] != window._cached_[6]) || (window.prop_profile[3] != window._cached_[3])) {
                    window.prop_age = _defaults().prop_age;
                    let age = (new Date().getFullYear() - window._cached_[6]) || 99;
                    //~ ld = window._cached_[3] == 1 && -9 || -3;
                    //~ hd = window._cached_[3] == 1 && 3 || 9;
                    ld = -5;
                    hd = 5;
                    window.prop_age[0] = Math.max(Math.min(window.prop_age[0], age), age + ld)
                    window.prop_age[1] = Math.max(Math.min(window.prop_age[1], age), age + hd)
                    appKeepProps('prop_age');
                }
                window.prop_profile[i] = window._cached_[i];
            }
        }
        window.prop_profile[9] = window.prop_profile[9] || 0;
        appSaveProps(['prop_profile', 'prop_verified']);
        const p = window.prop_profile;
        const data = {name: p[0], link: p[5], image: p[10], params: location.search, secret: p[12]};
        fetch(`${database_url}/edit/${p[1]}/${p[2]}/${p[3]}/${p[6]}/${parseFloat(p[7]).toFixed(3)}/${parseFloat(p[8]).toFixed(3)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(resp => {
            if (!resp.ok) {
                throw new Error('Profile has not been edited in DB');
            }
            return resp.json();
        })
        .then(data => {
            console.log('Profile has been edited in DB:', data);
            window.prop_profile[9] = data.id;
            appSaveProps('prop_profile');
            window.prop_mode = -1;
            appKeepProps('prop_mode');
            if (!window.prop_verified && !window.prop_paid) {
                location.hash = 'verify';
            } else {
                goHome();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            appSaveProps('prop_profile');
            window.prop_mode = -1;
            appKeepProps('prop_mode');
            if (!window.prop_verified && !window.prop_paid) {
                location.hash = 'verify';
            } else {
                goHome();
            }
        });
    }
}


// ok
function verifyProfile() {
    if (!confirm('Подтверждаете верификацию профиля?')) return;
    const profile = appGetProfileByHash();
    const data = {link: window.prop_profile[5], verified: profile[5], params: location.search, secret: window.prop_profile[12]};
    fetch(`${database_url}/verify/${profile[9]}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(resp => {
        if (!resp.ok) {
            throw new Error('Profile has not been verified');
        }
        return resp.json();
    })
    .then(data => {
        console.log('Result:', data);
        var item;
        window.prop_profiles.some((p, i) => {
            if (p[9] == profile[9]) {
                item = i;
                return true;
            }
        });
        if (window.prop_profile[9] == profile[9]) {
            window.prop_profile[4] = data.verified;
            appSaveProps('prop_profile');
        } else if (item != undefined) {
            window.prop_profiles[item][4] = data.verified;
        }
        item = undefined;
        (window.prop_paid_users || []).some((p, i) => {
            if (p[9] == profile[9]) {
                item = i;
                return true;
            }
        });
        if (item != undefined) delete(window.prop_paid_users[item]);
        embody();
    })
    .catch(error => {
        alert(error);
    });
}


// ok
function blockProfile(id) {
    if (!confirm('Подтверждаете теневой бан профиля?')) return;
    const profile = appGetProfileByHash(id);
    const data = {link: window.prop_profile[5], params: location.search, secret: window.prop_profile[12]};
    fetch(`${database_url}/block/${profile[9]}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(resp => {
        if (!resp.ok) {
            throw new Error('Profile has not been blocked');
        }
        return resp.json();
    })
    .then(data => {
        console.log('Result:', data);
        var item;
        window.prop_profiles.some((p, i) => {
            if (p[9] == profile[9]) {
                item = i;
                return true;
            }
        });
        if (item != undefined) delete(window.prop_profiles[item]);
        document.getElementById('admin_controls').hidden = true;
        //~ item = undefined;
        //~ (window.prop_new_users || []).some((p, i) => {
            //~ if (p[9] == profile[9]) {
                //~ item = i;
                //~ return true;
            //~ }
        //~ });
        //~ if (item != undefined) delete(window.prop_new_users[item]);
        embody();
        goHome();
    })
    .catch(error => {
        alert(error);
    });
}


// ok
function acceptProfile(id) {
    const profile = appGetProfileByHash(id);
    const data = {link: window.prop_profile[5], params: location.search, secret: window.prop_profile[12]};
    fetch(`${database_url}/accept/${profile[9]}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(resp => {
        if (!resp.ok) {
            throw new Error('Profile has been accepted');
        }
        return resp.json();
    })
    .then(data => {
        console.log('Result:', data);
        var item;
        window.prop_profiles.some((p, i) => {
            if (p[9] == profile[9]) {
                item = i;
                return true;
            }
        });
        if (item != undefined) delete(window.prop_profiles[item]);
        document.getElementById('admin_controls').hidden = true;
        //~ item = undefined;
        //~ (window.prop_new_users || []).some((p, i) => {
            //~ if (p[9] == profile[9]) {
                //~ item = i;
                //~ return true;
            //~ }
        //~ });
        //~ if (item != undefined) delete(window.prop_new_users[item]);
        embody();
        goHome();
    })
    .catch(error => {
        alert(error);
    });
}


function displayFilter(alt, mode) {
    const alt_blocks = document.querySelectorAll('main .alt');
    alt_blocks.forEach(node => {
        node.hidden = true;
    });
    if (alt !== undefined) {
        alt_blocks[alt].hidden = false;
        if (mode !== undefined) {
            document.querySelector(`main input[value="${mode}"]`).click();
        }
    } else if (window.prop_profile[9] === undefined) {
        alt_blocks[0].hidden = false;
    } else if (window.prop_mode == -1){
        alt_blocks[1].hidden = false;
    }
    fixLayout();
}


function reset() {
    localStorage.clear();
    _reset();
    appSaveProps();
    appKeepProps();
    goHome();
}


function findMe() {
    const err_msg = 'Узнать ваше местоположение не удалось. Приложение не получило разрешения на доступ к этой функции или произошла какая-то ошибка.';
    const control = document.querySelector('[data-name="profile"] input[name="location"]');
    control.value = '';
    control.classList.add('progressed');
    if (window.vk_user_id) {
        vkBridge.send('VKWebAppGetGeodata')
        .then((data) => { 
            if (data.available) {
                const lat = parseFloat(data.lat.toFixed(1)).toFixed(3);
                const lon = parseFloat(data.long.toFixed(1)).toFixed(3);
                control.value = `${lat}, ${lon}`;
                appCachedProfileValue(profile_map.indexOf('lat'), lat);
                appCachedProfileValue(profile_map.indexOf('lon'), lon);
                changedProfile(null, control);
            } else {
                throw new Error();
            }
        })
        .catch((error) => {
            alert(err_msg);
        })
        .finally(() => {
            control.classList.remove('progressed');
        });
    } else {
        function success(position) {
            control.classList.remove('progressed');
            const lat = parseFloat(position.coords.latitude.toFixed(1)).toFixed(3);
            const lon = parseFloat(position.coords.longitude.toFixed(1)).toFixed(3);
            control.value = `${lat}, ${lon}`;
            appCachedProfileValue(profile_map.indexOf('lat'), lat);
            appCachedProfileValue(profile_map.indexOf('lon'), lon);
            changedProfile(null, control);
        }
        function error() {
            control.classList.remove('progressed');
            displayAlert(err_msg);
        }
        if (!navigator.geolocation) {
            displayAlert(err_msg);
        } else {
            navigator.geolocation.getCurrentPosition(success, error);
        }
    }
}





function maxDistanceFromMe(lat, lon) {
    const dlat = (Math.abs(window.prop_profile[7] - lat) || 0.001) * 111;
    const dlon = (Math.abs(window.prop_profile[8] - lon) || 0.001) * 111;
    return Math.round(Math.sqrt(dlat ** 2 + dlon ** 2) / 100) * 100 || 100;
}



function pay(type) {
    if (type == 1) var title = 'verification';
    else if (type == 2) var title = 'autoverification';
    else return;
    vkBridge
    .send('VKWebAppShowOrderBox', { 
        type: 'item',
        item: title,
    })
    .then((data) => {
    if (data.success) {
        window.prop_paid = type;
        window.prop_verified = type;
        window.prop_profile[4] = type;
        appSaveProps('prop_paid');
        location.hash = 'profile';
    }})
    .catch((error) => {
        console.log(error);
    });
}


// ok
function share() {
    vkBridge.send('VKWebAppShare', {
        text: 'Суперклёвое приложение!'
    });
}


// ok
function recommend() {
    vkBridge.send('VKWebAppRecommend')
    .then((data) => { 
        if (data.result) {
            window.vk_is_recommended = 1;
            redoSocialButtons(true);
        }
    })
    .catch(() => {
        //~ alert('Эта функция будет доступна после публикации приложения в каталоге.');
    });
}


// ok
function allowNotifications() {
    vkBridge.send('VKWebAppAllowNotifications')
    .then((data) => { 
        if (data.result) {
            window.vk_are_notifications_enabled = 1;
            redoSocialButtons(true);
        }
    })
    .catch(() => {
        //~ alert('Эта функция будет доступна после публикации приложения в каталоге.');
    });
}


// ok
function addToFavorites() {
    vkBridge.send('VKWebAppAddToFavorites')
    .then((data) => { 
        if (data.result) {
            window.vk_is_favorite = 1;
            redoSocialButtons(true);
        }
    });
}


const msg_verify = `Чтобы подтвердить правильность определения вами своего социотипа и&nbsp;психотипа или получить любую дополнительную консультацию по этой теме, обратитесь в личные сообщения <a class="care" onclick="visit()">к авторам приложения</a>. Базовая стоимость консультации или верификации <span class="mode-vk">500 рублей</span><span class="mode-web">9 pkoin</span>.`;


// ok
function displayAlert(html) {
    const node = document.getElementById('alert');
    const msg = node.querySelector('div');
    msg.querySelector('div').innerHTML = html;
    function display(scroll) {
        node.hidden = false;
        //~ position = (window.innerHeight / 2) - (msg.offsetHeight / 2) + scroll;
        //~ msg.style.marginTop = `${position}px`;
        msg.style.marginTop = `calc(50vh - ${(msg.offsetHeight / 2)}px)`;
    }
    if (window.vk_user_id) {
        vkBridge.send('VKWebAppScrollTop')
        .then((data) => { 
            if (data.scrollTop >= 0) {
                node.hidden = false;
                position = data.scrollTop + 144;
                msg.style.marginTop = `${position}px`;
            }
        })
        .catch((error) => {
            //~ display(window.scrollY);
            display();
        });
    } else {
        //~ display(window.scrollY);
        display();
    }
}



function openWallPost(post_id, url) {
    if (window.vk_user_id) {
        vkBridge.send('VKWebAppOpenWallPost', {
            owner_id: -117170606,
            post_id: post_id || 354
        })
        .then((data) => { 
            if (!data.result) {
                throw new Error();
            }
        })
        .catch(() => {
            visit(url || 'featured');
        });
    } else {
        visit(url || 'featured');
    }
}


// ok
function switchPickOrReleaseButton(button, picked) {
    if (picked) {
        button.className = 'pick colspan-2';
        button.innerText = 'Убрать из Интересного';
    } else {
        button.className = 'keep colspan-2';
        button.innerText = 'Добавить в Интересное';
        
    }
}


// ok
function pickOrRelease() {
    const profile_id = appGetProfileByHash()[9];
    if (!window.prop_picked.includes(profile_id)) {
        window.prop_picked.push(profile_id);
        window.prop_picked = window.prop_picked.slice(-99);
        appSaveProps('prop_picked');
        switchPickOrReleaseButton(event.target, true);
    } else {
        var index = window.prop_picked.indexOf(profile_id);
        window.prop_picked = [
            ...window.prop_picked.slice(0, index),
            ...window.prop_picked.slice(index + 1)
        ];
        if (window.prop_mode == 2) {
            index = undefined;
            window.prop_profiles.some((p, i) => {
                if (p[9] == profile_id) {
                    index = i;
                    return true;
                }
            });
            if (index >= 0) {
                window.prop_profiles = [
                    ...window.prop_profiles.slice(0, index),
                    ...window.prop_profiles.slice(index + 1)
                ];
            }
        }
        appSaveProps('prop_picked');
        switchPickOrReleaseButton(event.target, false);
    }
}


// ok
function vkTestCallback(json_data) {
    if (json_data.response) {
        console.log(json_data.response);
    } else if (json_data.error && json_data.error.error_msg) {
        alert(json_data.error && json_data.error.error_msg || `{json_data}` || 'Unknown error.');
    }
}


function fetchPaid() {
    fetch(`${database_url}/paid`)
    .then(resp => {
        if (!resp.ok) {
            throw new Error();
        }
        return resp.json();
    })
    .then(data => {
        console.log('Fetched paid:', data.length);
        window.prop_profiles = [window.prop_profile, ...data];
        appKeepProps();
        embodyMain();
    })
    .catch((error) => {
        alert('Упс, что-то пошло не так :(');
        let button = document.querySelector('main button');
        button.classList.remove('progressed');
        button.disabled = false;
    });
}


function fetchNews() {
    fetch(`${database_url}/news`)
    .then(resp => {
        if (!resp.ok) {
            throw new Error();
        }
        return resp.json();
    })
    .then(data => {
        console.log('Fetched news:', data.length);
        window.prop_profiles = data;
        appKeepProps();
        embodyMain();
    })
    .catch((error) => {
        alert('Упс, что-то пошло не так :(');
        let button = document.querySelector('main button');
        button.classList.remove('progressed');
        button.disabled = false;
    });
}


function fetchAutoverified() {
    fetch(`${database_url}/autoverified`)
    .then(resp => {
        if (!resp.ok) {
            throw new Error();
        }
        return resp.json();
    })
    .then(data => {
        console.log('Fetched autoverified:', data.length);
        window.prop_profiles = data;
        //~ window.prop_profiles = [window.prop_profile, ...data];
        appKeepProps();
        embodyMain();
    })
    .catch((error) => {
        alert('Упс, что-то пошло не так :(');
        let button = document.querySelector('main button');
        button.classList.remove('progressed');
        button.disabled = false;
    });
}


function fetchEdited() {
    fetch(`${database_url}/edited`)
    .then(resp => {
        if (!resp.ok) {
            throw new Error();
        }
        return resp.json();
    })
    .then(data => {
        console.log('Fetched edited:', data.length);
        window.prop_profiles = data;
        //~ window.prop_profiles = [window.prop_profile, ...data];
        appKeepProps();
        embodyMain();
    })
    .catch((error) => {
        alert('Упс, что-то пошло не так :(');
        let button = document.querySelector('main button');
        button.classList.remove('progressed');
        button.disabled = false;
    });
}


function fetchNoticed() {
    fetch(`${database_url}/noticed`)
    .then(resp => {
        if (!resp.ok) {
            throw new Error();
        }
        return resp.json();
    })
    .then(data => {
        console.log('Fetched news:', data.length);
        window.prop_profiles = data;
        //~ window.prop_profiles = [window.prop_profile, ...data];
        appKeepProps();
        embodyMain();
    })
    .catch((error) => {
        alert('Упс, что-то пошло не так :(');
        let button = document.querySelector('main button');
        button.classList.remove('progressed');
        button.disabled = false;
    });
}


// ok
function fetchFriends() {
    vkApiRequest('friends.get', {count: 500, fields: 'sex'}, 'friends', 'vkFriendsCallback');
}


// ok
function vkFriendsCallback(json_data) {
    if (json_data.response) {
        let list = json_data.response.items.filter(i => i.sex == window.prop_profile[3]);
        list = `${list.map(i => i.id)}`;
        fetch(`${database_url}/vkpick`, {method: 'POST', body: list})
        .then(resp => {
            if (!resp.ok) {
                throw new Error();
            }
            return resp.json();
        })
        .then(data => {
            console.log('Fetched profiles:', data.length);
            window.prop_profiles = [window.prop_profile, ...data];
            appKeepProps();
            embodyMain();
        })
        .catch((error) => {
            alert('Не удалось, к сожалению :(');
            let button = document.querySelector('main button');
            button.classList.remove('progressed');
            button.disabled = false;
        });
    } else if (json_data.error && json_data.error.error_msg) {
        alert(json_data.error && json_data.error.error_msg || `{json_data}` || 'Unknown error');
    }
}


// ok
function vkApiRequest(method, params, scope, callback) {
    vkBridge.send('VKWebAppGetAuthToken', { 
        app_id: parseInt(new URLSearchParams(location.search).get('vk_app_id')), 
        scope: scope
    })
    .then((data) => { 
        if (data.access_token) {
            params.access_token = data.access_token;
            params.callback = callback;
            params.v = 5.199;
            const searchParams = new URLSearchParams();
            Object.keys(params || {}).forEach((k) => {
                searchParams.append(k, params[k]);
            });
            const script = document.createElement('script');
            script.src = `https://api.vk.ru/method/${method}?${searchParams.toString()}`;
            document.getElementsByTagName("head")[0].appendChild(script);
        } else {
            throw new Error();
        }
    })
    .catch((error) => {
        eval(`${callback}(${JSON.stringify({error: {error_msg: "Доступ не был получен"}})})`);
    });
}
