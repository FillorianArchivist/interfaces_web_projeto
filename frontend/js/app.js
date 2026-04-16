const STORAGE_KEY = "manuscript_data";
const VERSION_KEY = "manuscript_version";

// ==========================================
// 1. CARREGAMENTO DE DADOS (JAMSTACK CACHE)
// ==========================================
async function loadData() {
    try {
        const resVersion = await fetch('./data/version.json');
        const { version: liveVersion } = await resVersion.json();

        if (localStorage.getItem(VERSION_KEY) === liveVersion) {
            console.log("A carregar rapidamente da cache local...");
            return JSON.parse(localStorage.getItem(STORAGE_KEY));
        }

        console.log("A transferir a versão mais recente dos assentos...");
        const resData = await fetch('./data/manuscript.json');
        const data = await resData.json();

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            localStorage.setItem(VERSION_KEY, liveVersion);
        } catch (e) {
            console.warn("Não foi possível guardar na cache.");
        }

        return data;
    } catch (error) {
        console.error("Falha ao carregar os assentos:", error);
    }
}

// ==========================================
// 2. FUNÇÕES AUXILIARES PARA O DTD TEI
// ==========================================

// O xmltodict pode devolver um Objeto (se houver 1 elemento) ou uma Array (se houver vários).
// Esta função garante que trabalhamos sempre com Arrays para podermos usar .forEach() ou .find()
function ensureArray(element) {
    if (!element) return [];
    return Array.isArray(element) ? element : [element];
}

// Procura de forma recursiva por uma tag específica dentro de nós complexos (como o <p>)
function findTagInData(data, tagName) {
    if (typeof data !== 'object' || data === null) return null;
    if (data[tagName]) return data[tagName];
    
    for (let key in data) {
        const result = findTagInData(data[key], tagName);
        if (result) return result;
    }
    return null;
}

// Junta todo o texto (#text) que o xmltodict separa devido às tags embebidas no <p>
function extractRawText(data) {
    if (typeof data === 'string') return data;
    if (typeof data !== 'object' || data === null) return '';
    
    let text = '';
    if (data['#text']) text += data['#text'] + ' ';
    
    for (let key in data) {
        if (!key.startsWith('@_') && key !== '#text') {
            text += extractRawText(data[key]) + ' ';
        }
    }
    return text.trim();
}

// ==========================================
// 3. RENDERIZAÇÃO E CONSTRUÇÃO DO VISUAL
// ==========================================
function renderWebsite(data) {
    // 1. Navegar pela estrutura DTD: <div> -> <list> -> <entry>
    const divRoot = data.div;
    if (!divRoot || !divRoot.list || !divRoot.list.entry) {
        console.error("O JSON não corresponde ao DTD esperado (div > list > entry).");
        return;
    }

    // Assumindo que queremos mostrar o primeiro <entry> neste visualizador,
    // ou podes iterar sobre entries para preencher a tabela!
    const entries = ensureArray(divRoot.list.entry);
    const entry = entries[0]; // Para o propósito de uma "ficha" única

    // --- EXTRAÇÃO DE DADOS BASEADA NO DTD ---
    
    // 1. Número do Assento (Atributo 'n' do entry)
    const idAssento = entry['@_n'] || 'N/A';

    // 2. Nome (persName -> forename + surname)
    // Procuramos o primeiro persName (geralmente o defunto no contexto de óbitos)
    let nomeCompleto = "Desconhecido";
    const persNames = ensureArray(entry.persName);
    if (persNames.length > 0) {
        const principal = persNames[0];
        const forenames = ensureArray(principal.forename).map(f => typeof f === 'object' ? f['#text'] : f).join(' ');
        const surnames = ensureArray(principal.surname).map(s => typeof s === 'object' ? s['#text'] : s).join(' ');
        nomeCompleto = `${forenames} ${surnames}`.trim();
    }

    // 3. Procurar as tags embebidas no(s) parágrafo(s) <p>
    const paragrafos = ensureArray(entry.p);
    let dataObito = 'Não registada';
    let idade = 'N/A';
    let localidade = 'Desconhecida';

    paragrafos.forEach(p => {
        // Procurar <death when="...">
        const deathTag = findTagInData(p, 'death');
        if (deathTag && deathTag['@_when']) dataObito = deathTag['@_when'];

        // Procurar <age value="..." unit="...">
        const ageTag = findTagInData(p, 'age');
        if (ageTag && ageTag['@_value']) {
            idade = `${ageTag['@_value']} ${ageTag['@_unit'] || 'anos'}`;
        }

        // Procurar <placeName> (Pode estar dentro do <p> ou dentro do <death>)
        const placeTag = findTagInData(p, 'placeName');
        if (placeTag) {
            localidade = typeof placeTag === 'object' ? (placeTag['#text'] || 'Sem nome') : placeTag;
        }
    });

    // --- CONSTRUIR A FICHA DE IDENTIFICAÇÃO ---
    const infoFicha = document.getElementById('ficha-identificacao');
    if (infoFicha) {
        infoFicha.innerHTML = `
            <div class="bg-[#F2EEE9] border-[3px] border-[#DCD6CD] rounded-lg p-6 shadow-sm mb-8">
                <h3 class="font-gloock text-3xl mb-4 border-b-2 border-[#DCD6CD] pb-2 text-[#661515] flex items-center justify-between">
                    <span>Ficha de Identificação</span>
                    <span class="text-sm font-esteban bg-white px-3 py-1 rounded border border-[#DCD6CD] text-[#7D736D]">Assento Nº ${idAssento}</span>
                </h3>
                <ul class="font-esteban text-xl text-[#383838] space-y-2">
                    <li><strong>Nome:</strong> <span class="text-[#661515] font-bold">${nomeCompleto}</span></li>
                    <li><strong>Data do Óbito:</strong> ${dataObito}</li>
                    <li><strong>Idade Registada:</strong> ${idade}</li>
                    <li><strong>Localidade:</strong> ${localidade}</li>
                </ul>
            </div>
        `;
    }

    // --- CONSTRUIR O TEXTO CORRIDO ---
    const containerTexto = document.getElementById('manuscript-container');
    let htmlContent = ""; 

    paragrafos.forEach(p => {
        // Usamos a nossa função auxiliar para limpar o JSON complexo e extrair apenas o texto legível
        const textoLimpo = extractRawText(p);

        htmlContent += `
            <div class="paragraph-block relative mb-6 p-6 bg-white border border-[#DCD6CD] rounded-lg shadow-sm">
                <p class="font-esteban text-2xl leading-relaxed text-[#383838]">
                    ${textoLimpo}
                </p>
            </div>
        `;
    });

    // Assinaturas (Se houver a tag <signed>)
    const assinaturas = ensureArray(entry.signed);
    assinaturas.forEach(sig => {
        const textoAssinatura = extractRawText(sig);
        htmlContent += `
            <div class="text-right mt-4 text-xl font-playfair italic text-[#7D736D]">
                Assinado: ${textoAssinatura}
            </div>
        `;
    });

    if (containerTexto) containerTexto.innerHTML = htmlContent;
}

// Inicialização
loadData().then(data => {
    if (data) {
        renderWebsite(data);
    }
});
