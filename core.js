var core_history_of_embodyings = ['', '', ''];

document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
        .then(() => {
            console.log('Service Worker Registered');
        });
    }
    location.hash = 'main';
    window.addEventListener('hashchange', embody);
});


function embody(){
    var hash = location.hash.slice(1) || 'main';
    console.log('embodied', hash);
    document.querySelectorAll('main, section, [data-name]').forEach(node => {
        let context = hash;
        while (context) {
            if (node.tagName.toLowerCase() == context || node.dataset.name == context) {
                node.hidden = false;
                break;
            }
            context = context.split('/').slice(0, -1).join('/');
        }
        if (!context) {
            node.hidden = true;
        }
    });
    scroll(0, 0);
    core_history_of_embodyings.unshift(hash);
    core_history_of_embodyings = core_history_of_embodyings.slice(0, 5);
    Object.entries(window.embodying_triggers || {}).forEach(i => {
        if (hash.match(new RegExp(i[0]))) i[1]();
    });
    fixLayout();
}


function fixLayout() {
    if (window.vk_user_id) {
        vkBridge.send("VKWebAppScroll", {top: 0});
        vkBridge.send('VKWebAppResizeWindow', {
            width: 640,
            height: Math.max(document.body.offsetHeight + 144, 640),
        });
    }
}



function coreGetSuiteParam() {
    var param = coreGetSuiteParamsAll().slice(-1)[0];
    if (parseFloat(param) == param) {
        return parseFloat(param);
    } else {
        return param;
    }
}


function coreGetSuiteParamsAll() {
    return location.hash.slice(1).split('-');
}


// ok
function acronym(name) {
    var name = name && `${name}`.split(' ') || [''];
    var abbr = '';
    if (name.length > 1) name.forEach(i => {abbr += i[0] && [...i][0].toUpperCase() || ''});
    return abbr.slice(0, 3) || ([...name[0] || '']).slice(0, 3).join('');
}

function embedded(scheme) {
    var tag = scheme.shift();
    if (!scheme.length) return `<${tag}></${tag}>`;
    else return `<${tag}>${embedded(scheme)}</${tag}>`;
}

function coreBadge(image, label, onclick, featured, modifiers) {
    onclick = onclick && onclick.replaceAll('"', "'");
    featured = featured && typeof(featured) != 'string' && 'buai' || featured || 'ai';
    modifiers = typeof(modifiers) == 'string' && modifiers.trim().split(/\s+/) || modifiers;
    var html = `<b class="badge${modifiers && ' ' + modifiers.join(' ') || ''}">${embedded(featured.split(''))}</b>`;
    html = html.replace('<i></i>', `<i>${coreAcronym(label) || '?'}</i>`);
    html = html.replace('</a>', `</a><a style="background-image:url('${image || ''}')" onclick="${onclick || ''}"><b></b></a>`);
    return html;
}

// OK
function htmlBadge(image, label, onclick, class_a, class_b) {
    image = image && image.replaceAll('"', "'") || '';
    label = label && label.replaceAll('"', "'") || '';
    onclick = onclick && `onclick="${onclick.replaceAll('"', "'")}"` || '';
    class_a = class_a && `badge ${class_a}` || 'badge';
    class_a = `class="${class_a}"`;
    class_b = class_b && `class="${class_b}"` || '';
    return `<a ${class_a} ${onclick}>
        <abbr title="${label}">${acronym(label)}</abbr>
        <i style="background-image:url('${image}')"></i>
        <b ${class_b}></b></a>`;
}

// OK
function initVk() {
    vkBridge
    .send('VKWebAppInit')
    .then(data => {
        console.log('vkBridge.VKWebAppInit returns', data)
        if (!data.result) throw new Error();
        console.log('vkBridge initialized');
//~ localStorage.clear();
//~ appSaveProps();
        _loadPropsVk();
        document.body.classList.add('-vk');
        window.vk_is_recommended = 
            location.search.includes('vk_is_recommended=1');
        window.vk_are_notifications_enabled = 
            location.search.includes('vk_are_notifications_enabled=1');
        window.vk_is_favorite = 
            location.search.includes('vk_is_favorite=1');
    })
    .catch(error => {
        console.error(error);
    });
}


function initBastyon() {
    window.sdk = new BastyonSdk();
    sdk.init().then((obj) => {
        console.log('bastyon sdk initialized');
        sdk.emit('loaded');
    });
    _loadPropsDb();
}

function openExternalLink(url) {
    if (window.vk_user_id || !window.sdk || !window.sdk.applicationInfo) {
        openLinkInNewWindow(url);
    } else {
        window.sdk.openExternalLink(url)
        .catch(() => {
            window.sdk.permissions.request(['externallink'])
            .then(() => {
                window.sdk.openExternalLink(url);
            })
            .catch(() => {
                window.sdk.helpers.opensettings();
            });
        });
    }
}


function openLinkInNewWindow(href) {
    var a = document.createElement('a');
    a.href = href;
    a.setAttribute('target', '_blank');
    a.click();
}


















function updateProps(props) {
    // Если загружаемая версия выше, то присваиваем аттрибуты prop_stored объекту window,
    // при условии, что тип их содержимого не противоречит заявленному в prop_stored,
    // prop_cached обрабатываем не обращая внимания на версию
    for (let name in props) {
        if (name in window.prop_cached && typeof(window.prop_cached[name]) == typeof(props[name])) {
            window[name] = props[name];
        }
    }
    const actual_version = window.prop_version;
    if (!props.prop_version || props.prop_version <= actual_version) {
        if (!window.prop_version) {
            window.prop_version = 1;
            console.log(`embodied with initial props`);
            embody();
        } else {
            console.log(`actual version of props - ${actual_version}, loaded version - ${props.prop_version}`);
            fixLayout();
        }
    } else {
        window.prop_version = props.prop_version;
        for (let name in props) {
            if (name in window.prop_stored && typeof(window.prop_stored[name]) == typeof(props[name])) {
                window[name] = props[name];
            }
        }
        console.log(`props version updated from '${actual_version}' to ${window.prop_version}`);
        embody();
    }
}


function appLoadProps() {
    _loadPropsLocal();
}


function _loadPropsLocal() {
    const props = {};
    for (name in {prop_version: 0, ...(window.prop_stored  || {}), ...(window.prop_cached  || {})}) {
        if (localStorage[name]) {
            try {
                props[name] = JSON.parse(localStorage[name]);
            } catch {
                console.error(`Infalid value in localStorage (${name} = ${localStorage[name].slice(0, 50)})`);
            }
        }
    }
    updateProps(props);
}


function _loadPropsVk() {
    const props = {};
    vkBridge
    .send("VKWebAppStorageGet", {"keys": ['prop_version', ...Object.keys(window.prop_stored)]})
    .then(data => {
        data.keys.forEach(obj => {
            if (obj.value) {
                try {
                    props[obj.key] = JSON.parse(obj.value);
                } catch {
                    console.error(`Infalid value in vkStorage (${obj.key} = ${obj.value.slice(0, 50)})`);
                }
            }
        });
        updateProps(props);
    });
}


function _loadPropsDb() {
}


function appKeepProps(list) {
    list = typeof(list) == 'object' && list.length && list
        || typeof(list) == 'string' && [list]
        || Object.keys(window.prop_cached  || {});
    _savePropsLocal(list);
}


function appSaveProps(list) {
    window.prop_version += 1;
    list = typeof(list) == 'object' && list.length && list
        || typeof(list) == 'string' && [list]
        || Object.keys(window.prop_stored  || {});
    list = ['prop_version', 'prop_stored', ...list];
    _savePropsLocal(list);
    _savePropsVk(list.filter(name => name.slice(0, 5) == 'prop_'));
}


function _savePropsLocal(list) {
    list.forEach(name => {
        localStorage[name] = JSON.stringify(window[name]);
        console.log(`${name} kept locally`);
    });
}


function _savePropsVk(list) {
    if (!window.vk_user_id) return;
    const vk_limit = 4096;
    const props = {};
    var ok = true;
    list.forEach(name => {
        let value = JSON.stringify(window[name]);
        if (new Blob([value]).size <= vk_limit) {
            props[name] = value;
        } else {
            ok = false;
        }
    });
    if (ok) {
        for (let k in props) {
            vkBridge
            .send("VKWebAppStorageSet", {key: k, value: props[k]});
            console.log(`${name} sent to vk storage`);
        }
    }
}


