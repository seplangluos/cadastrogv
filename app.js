// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDIMziMEygrNUc3VeYxLOyj98JSMyeEkI8",
    authDomain: "cadastro-39a2b.firebaseapp.com",
    databaseURL: "https://cadastro-39a2b-default-rtdb.firebaseio.com",
    projectId: "cadastro-39a2b",
    storageBucket: "cadastro-39a2b.firebasestorage.app",
    messagingSenderId: "457985275329",
    appId: "1:457985275329:web:3f830cce90394d93e76b40",
    measurementId: "G-M9EJJJZL5V"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Global variables
let currentUser = null;
let currentUserRole = null;
let allProcesses = {};
let assuntos = [];
let cadastradores = [];
let currentPage = 1;
const itemsPerPage = 500;
let filteredProcesses = [];

// User roles configuration
const userRoles = {
    'seplan.cadastro@valadares.mg.gov.br': {
        role: 'gestor',
        name: 'Gestor',
        access: ['dashboard', 'configuracoes', 'cadastro', 'editar', 'consulta', 'basedados', 'relatorios']
    },
    'wendel_hai@hotmail.com': {
        role: 'admin', 
        name: 'Admin',
        access: ['dashboard', 'configuracoes', 'cadastro', 'editar', 'consulta', 'basedados', 'relatorios']
    },
    'consulta@hotmail.com': {
        role: 'consulta',
        name: 'Consulta',
        access: ['dashboard', 'consulta', 'basedados']
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Auth state observer
    auth.onAuthStateChanged((user) => {
        if (user) {
            handleUserLogin(user);
        } else {
            showLoginScreen();
        }
    });

    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Menu buttons
    document.querySelectorAll('.menu-btn:not(.logout)').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.getAttribute('data-tab');
            showTab(tab);
        });
    });

    // Form submissions
    const cadastroForm = document.getElementById('cadastro-form');
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', handleCadastroSubmit);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        showLoading(true);
        await auth.signInWithEmailAndPassword(email, password);
        errorDiv.style.display = 'none';
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Erro ao fazer login. Verifique suas credenciais.';
        errorDiv.style.display = 'block';
    } finally {
        showLoading(false);
    }
}

function handleUserLogin(user) {
    currentUser = user;
    const userConfig = userRoles[user.email];
    
    if (!userConfig) {
        console.error('User not authorized:', user.email);
        logout();
        return;
    }

    currentUserRole = userConfig;
    setupUserInterface();
    loadInitialData();
    showMainApp();
}

function setupUserInterface() {
    // Set user name
    document.getElementById('user-name').textContent = currentUserRole.name;
    
    // Show/hide menu items based on access
    const menuItems = {
        'menu-configuracoes': 'configuracoes',
        'menu-cadastro': 'cadastro', 
        'menu-editar': 'editar',
        'menu-relatorios': 'relatorios'
    };

    Object.entries(menuItems).forEach(([menuId, access]) => {
        const menuItem = document.getElementById(menuId);
        if (menuItem) {
            if (currentUserRole.access.includes(access)) {
                menuItem.style.display = 'block';
            } else {
                menuItem.style.display = 'none';
            }
        }
    });
}

async function loadInitialData() {
    try {
        showLoading(true);
        
        // Load assuntos and cadastradores
        const assuntosSnapshot = await database.ref('Assuntos').once('value');
        const cadastradoresSnapshot = await database.ref('Cadastradores').once('value');
        const processosSnapshot = await database.ref('processos').once('value');

        assuntos = assuntosSnapshot.val() || [];
        cadastradores = cadastradoresSnapshot.val() || [];
        allProcesses = processosSnapshot.val() || {};

        // Populate dropdowns
        populateDropdowns();
        
        // Update dashboard stats
        updateDashboardStats();
        
        // Load configurations if user has access
        if (currentUserRole.access.includes('configuracoes')) {
            loadConfigurations();
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
    } finally {
        showLoading(false);
    }
}

function populateDropdowns() {
    // Populate assunto dropdowns
    const assuntoSelects = document.querySelectorAll('#assunto, #filter-assunto');
    assuntoSelects.forEach(select => {
        // Keep the first option (placeholder)
        const placeholder = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (placeholder) {
            select.appendChild(placeholder);
        }
        
        assuntos.forEach(assunto => {
            const option = document.createElement('option');
            option.value = assunto;
            option.textContent = assunto;
            select.appendChild(option);
        });
    });

    // Populate cadastrador dropdowns
    const cadastradorSelects = document.querySelectorAll('#cadastrador, #filter-cadastrador');
    cadastradorSelects.forEach(select => {
        // Keep the first option (placeholder)
        const placeholder = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (placeholder) {
            select.appendChild(placeholder);
        }
        
        cadastradores.forEach(cadastrador => {
            const option = document.createElement('option');
            option.value = cadastrador;
            option.textContent = cadastrador;
            select.appendChild(option);
        });
    });
}

function updateDashboardStats() {
    const processArray = Object.values(allProcesses);
    const currentYear = new Date().getFullYear();
    
    const totalProcessos = processArray.length;
    const processosConcluidos = processArray.filter(p => p.saida && p.saida.trim() !== '').length;
    const processosAndamento = totalProcessos - processosConcluidos;
    const processosAno = processArray.filter(p => {
        if (!p.entrada) return false;
        const entradaYear = new Date(p.entrada).getFullYear();
        return entradaYear === currentYear;
    }).length;

    document.getElementById('total-processos').textContent = totalProcessos;
    document.getElementById('processos-concluidos').textContent = processosConcluidos;
    document.getElementById('processos-andamento').textContent = processosAndamento;
    document.getElementById('processos-ano').textContent = processosAno;
}

function loadConfigurations() {
    loadCadastradores();
    loadAssuntos();
}

function loadCadastradores() {
    const container = document.getElementById('cadastradores-list');
    container.innerHTML = '';
    
    cadastradores.forEach((cadastrador, index) => {
        const div = document.createElement('div');
        div.className = 'config-item';
        div.innerHTML = `
            <span>${cadastrador}</span>
            <div class="config-item-actions">
                <button class="btn btn--sm btn--outline" onclick="editCadastrador(${index}, '${cadastrador}')">Editar</button>
                <button class="btn btn--sm btn--outline" onclick="deleteCadastrador(${index})">Excluir</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function loadAssuntos() {
    const container = document.getElementById('assuntos-list');
    container.innerHTML = '';
    
    assuntos.forEach((assunto, index) => {
        const div = document.createElement('div');
        div.className = 'config-item';
        div.innerHTML = `
            <span>${assunto}</span>
            <div class="config-item-actions">
                <button class="btn btn--sm btn--outline" onclick="editAssunto(${index}, '${assunto}')">Editar</button>
                <button class="btn btn--sm btn--outline" onclick="deleteAssunto(${index})">Excluir</button>
            </div>
        `;
        container.appendChild(div);
    });
}

async function handleCadastroSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const processNumber = formData.get('nprocesso').replace('/', '-');
    
    if (!formData.get('nprocesso') || !formData.get('assunto')) {
        alert('Número do processo e assunto são obrigatórios!');
        return;
    }

    const processData = {
        nProcesso: processNumber,
        ctm: formData.get('ctm') || '',
        assunto: formData.get('assunto'),
        entrada: formData.get('entrada') || '',
        vistoria: formData.get('vistoria') || '',
        cadastrador: formData.get('cadastrador') || '',
        primeiraVisita: formData.get('primeiraVisita') || '',
        segundaVisita: formData.get('segundaVisita') || '',
        terceiraVisita: formData.get('terceiraVisita') || '',
        saida: formData.get('saida') || '',
        destino: formData.get('destino') || '',
        status: formData.get('status') || '',
        obs: formData.get('obs') || '',
        prioridade: 'nan'
    };

    try {
        showLoading(true);
        await database.ref(`processos/${processNumber}`).set(processData);
        alert('Processo cadastrado com sucesso!');
        e.target.reset();
        
        // Reload data
        await loadInitialData();
    } catch (error) {
        console.error('Error saving process:', error);
        alert('Erro ao salvar processo.');
    } finally {
        showLoading(false);
    }
}

async function searchProcess() {
    const searchValue = document.getElementById('search-processo').value.replace('/', '-');
    if (!searchValue) {
        alert('Digite o número do processo para buscar.');
        return;
    }

    try {
        showLoading(true);
        const snapshot = await database.ref(`processos/${searchValue}`).once('value');
        const processo = snapshot.val();

        if (processo) {
            populateEditForm(processo);
            document.getElementById('edit-form-container').style.display = 'block';
        } else {
            alert('Processo não encontrado.');
            document.getElementById('edit-form-container').style.display = 'none';
        }
    } catch (error) {
        console.error('Error searching process:', error);
        alert('Erro ao buscar processo.');
    } finally {
        showLoading(false);
    }
}

function populateEditForm(processo) {
    const editContainer = document.getElementById('edit-form-container');
    editContainer.innerHTML = `
        <form id="edit-form" class="process-form">
            <input type="hidden" name="originalNumber" value="${processo.nProcesso}">
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Número do Processo</label>
                    <input type="text" class="form-control" value="${processo.nProcesso.replace('-', '/')}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">CTM</label>
                    <input type="text" name="ctm" class="form-control" value="${processo.ctm || ''}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Assunto</label>
                    <select name="assunto" class="form-control" required>
                        <option value="">Selecione um assunto</option>
                        ${assuntos.map(a => `<option value="${a}" ${a === processo.assunto ? 'selected' : ''}>${a}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Entrada</label>
                    <input type="date" name="entrada" class="form-control" value="${processo.entrada || ''}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Vistoria</label>
                    <input type="date" name="vistoria" class="form-control" value="${processo.vistoria || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Cadastrador</label>
                    <select name="cadastrador" class="form-control">
                        <option value="">Selecione um cadastrador</option>
                        ${cadastradores.map(c => `<option value="${c}" ${c === processo.cadastrador ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">1ª Visita</label>
                    <input type="date" name="primeiraVisita" class="form-control" value="${processo.primeiraVisita || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">2ª Visita</label>
                    <input type="date" name="segundaVisita" class="form-control" value="${processo.segundaVisita || ''}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">3ª Visita</label>
                    <input type="date" name="terceiraVisita" class="form-control" value="${processo.terceiraVisita || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Saída</label>
                    <input type="date" name="saida" class="form-control" value="${processo.saida || ''}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Destino</label>
                    <input type="text" name="destino" class="form-control" value="${processo.destino || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select name="status" class="form-control">
                        <option value="">Selecione o status</option>
                        <option value="Concluído" ${processo.status === 'Concluído' ? 'selected' : ''}>Concluído</option>
                        <option value="Em tramitação" ${processo.status === 'Em tramitação' ? 'selected' : ''}>Em tramitação</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Observação</label>
                <textarea name="obs" class="form-control" rows="4">${processo.obs || ''}</textarea>
            </div>
            
            <button type="submit" class="btn btn--primary">Salvar Alterações</button>
        </form>
    `;

    // Add submit handler
    document.getElementById('edit-form').addEventListener('submit', handleEditSubmit);
}

async function handleEditSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const originalNumber = formData.get('originalNumber');
    
    const processData = {
        nProcesso: originalNumber,
        ctm: formData.get('ctm') || '',
        assunto: formData.get('assunto'),
        entrada: formData.get('entrada') || '',
        vistoria: formData.get('vistoria') || '',
        cadastrador: formData.get('cadastrador') || '',
        primeiraVisita: formData.get('primeiraVisita') || '',
        segundaVisita: formData.get('segundaVisita') || '',
        terceiraVisita: formData.get('terceiraVisita') || '',
        saida: formData.get('saida') || '',
        destino: formData.get('destino') || '',
        status: formData.get('status') || '',
        obs: formData.get('obs') || '',
        prioridade: 'nan'
    };

    try {
        showLoading(true);
        await database.ref(`processos/${originalNumber}`).set(processData);
        alert('Processo atualizado com sucesso!');
        
        // Reload data
        await loadInitialData();
        document.getElementById('edit-form-container').style.display = 'none';
        document.getElementById('search-processo').value = '';
    } catch (error) {
        console.error('Error updating process:', error);
        alert('Erro ao atualizar processo.');
    } finally {
        showLoading(false);
    }
}

async function consultProcess() {
    const searchValue = document.getElementById('consulta-processo').value.replace('/', '-');
    if (!searchValue) {
        alert('Digite o número do processo para consultar.');
        return;
    }

    try {
        showLoading(true);
        const snapshot = await database.ref(`processos/${searchValue}`).once('value');
        const processo = snapshot.val();

        const resultDiv = document.getElementById('consulta-result');
        
        if (processo) {
            resultDiv.innerHTML = `
                <h3>Processo: ${processo.nProcesso.replace('-', '/')}</h3>
                <div class="process-info-grid">
                    <div class="process-info-item">
                        <div class="process-info-label">CTM</div>
                        <div class="process-info-value">${processo.ctm || 'Não informado'}</div>
                    </div>
                    <div class="process-info-item">
                        <div class="process-info-label">Assunto</div>
                        <div class="process-info-value">${processo.assunto || 'Não informado'}</div>
                    </div>
                    <div class="process-info-item">
                        <div class="process-info-label">Entrada</div>
                        <div class="process-info-value">${formatDateForDisplay(processo.entrada)}</div>
                    </div>
                    <div class="process-info-item">
                        <div class="process-info-label">Vistoria</div>
                        <div class="process-info-value">${formatDateForDisplay(processo.vistoria)}</div>
                    </div>
                    <div class="process-info-item">
                        <div class="process-info-label">Cadastrador</div>
                        <div class="process-info-value">${processo.cadastrador || 'Não informado'}</div>
                    </div>
                    <div class="process-info-item">
                        <div class="process-info-label">1ª Visita</div>
                        <div class="process-info-value">${formatDateForDisplay(processo.primeiraVisita)}</div>
                    </div>
                    <div class="process-info-item">
                        <div class="process-info-label">2ª Visita</div>
                        <div class="process-info-value">${formatDateForDisplay(processo.segundaVisita)}</div>
                    </div>
                    <div class="process-info-item">
                        <div class="process-info-label">3ª Visita</div>
                        <div class="process-info-value">${formatDateForDisplay(processo.terceiraVisita)}</div>
                    </div>
                    <div class="process-info-item">
                        <div class="process-info-label">Saída</div>
                        <div class="process-info-value">${formatDateForDisplay(processo.saida)}</div>
                    </div>
                    <div class="process-info-item">
                        <div class="process-info-label">Destino</div>
                        <div class="process-info-value">${processo.destino || 'Não informado'}</div>
                    </div>
                    <div class="process-info-item">
                        <div class="process-info-label">Status</div>
                        <div class="process-info-value">${processo.status || 'Não informado'}</div>
                    </div>
                    <div class="process-info-item" style="grid-column: 1 / -1;">
                        <div class="process-info-label">Observação</div>
                        <div class="process-info-value">${processo.obs || 'Não informado'}</div>
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = '<p>Processo não encontrado.</p>';
        }
    } catch (error) {
        console.error('Error consulting process:', error);
        document.getElementById('consulta-result').innerHTML = '<p>Erro ao consultar processo.</p>';
    } finally {
        showLoading(false);
    }
}

function applyFilters() {
    const filterCadastrador = document.getElementById('filter-cadastrador').value;
    const filterDataInicio = document.getElementById('filter-data-inicio').value;
    const filterDataFim = document.getElementById('filter-data-fim').value;
    const filterAssunto = document.getElementById('filter-assunto').value;

    let filtered = Object.values(allProcesses);

    if (filterCadastrador) {
        filtered = filtered.filter(p => p.cadastrador === filterCadastrador);
    }

    if (filterAssunto) {
        filtered = filtered.filter(p => p.assunto === filterAssunto);
    }

    if (filterDataInicio && filterDataFim) {
        const startDate = new Date(filterDataInicio);
        const endDate = new Date(filterDataFim);
        filtered = filtered.filter(p => {
            if (!p.entrada) return false;
            const entradaDate = new Date(p.entrada);
            return entradaDate >= startDate && entradaDate <= endDate;
        });
    }

    filteredProcesses = filtered;
    currentPage = 1;
    displayProcessTable();
}

function displayProcessTable() {
    const processes = filteredProcesses.length > 0 ? filteredProcesses : Object.values(allProcesses);
    const totalItems = processes.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentItems = processes.slice(startIndex, endIndex);

    // Update database info
    document.getElementById('database-info').innerHTML = 
        `Exibindo ${startIndex + 1} a ${endIndex} de ${totalItems} registros`;

    // Create table
    const tableContainer = document.getElementById('processes-table');
    tableContainer.innerHTML = `
        <table class="processes-table">
            <thead>
                <tr>
                    <th>Nº Processo</th>
                    <th>CTM</th>
                    <th>Assunto</th>
                    <th>Entrada</th>
                    <th>Cadastrador</th>
                    <th>Status</th>
                    <th>Saída</th>
                </tr>
            </thead>
            <tbody>
                ${currentItems.map(processo => `
                    <tr>
                        <td>${processo.nProcesso ? processo.nProcesso.replace('-', '/') : ''}</td>
                        <td>${processo.ctm || ''}</td>
                        <td>${processo.assunto || ''}</td>
                        <td>${formatDateForDisplay(processo.entrada)}</td>
                        <td>${processo.cadastrador || ''}</td>
                        <td>${processo.status || ''}</td>
                        <td>${formatDateForDisplay(processo.saida)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Update pagination
    updatePagination(currentPage, totalPages);
}

function updatePagination(current, total) {
    const container = document.getElementById('pagination');
    container.innerHTML = `
        <button class="pagination-btn" onclick="changePage(${current - 1})" ${current <= 1 ? 'disabled' : ''}>
            Anterior
        </button>
        <span class="pagination-info">Página ${current} de ${total}</span>
        <button class="pagination-btn" onclick="changePage(${current + 1})" ${current >= total ? 'disabled' : ''}>
            Próxima
        </button>
    `;
}

function changePage(page) {
    const processes = filteredProcesses.length > 0 ? filteredProcesses : Object.values(allProcesses);
    const totalPages = Math.ceil(processes.length / itemsPerPage);
    
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayProcessTable();
    }
}

// Configuration functions
function showAddCadastradorModal() {
    showModal('Adicionar Cadastrador', `
        <div class="form-group">
            <label class="form-label">Nome do Cadastrador</label>
            <input type="text" id="novo-cadastrador" class="form-control" placeholder="Digite o nome">
        </div>
        <button class="btn btn--primary" onclick="addCadastrador()">Adicionar</button>
    `);
}

function showAddAssuntoModal() {
    showModal('Adicionar Assunto', `
        <div class="form-group">
            <label class="form-label">Nome do Assunto</label>
            <input type="text" id="novo-assunto" class="form-control" placeholder="Digite o assunto">
        </div>
        <button class="btn btn--primary" onclick="addAssunto()">Adicionar</button>
    `);
}

async function addCadastrador() {
    const nome = document.getElementById('novo-cadastrador').value.trim();
    if (!nome) {
        alert('Digite o nome do cadastrador.');
        return;
    }

    try {
        showLoading(true);
        cadastradores.push(nome);
        await database.ref('Cadastradores').set(cadastradores);
        closeModal();
        loadCadastradores();
        populateDropdowns();
        alert('Cadastrador adicionado com sucesso!');
    } catch (error) {
        console.error('Error adding cadastrador:', error);
        alert('Erro ao adicionar cadastrador.');
    } finally {
        showLoading(false);
    }
}

async function addAssunto() {
    const nome = document.getElementById('novo-assunto').value.trim();
    if (!nome) {
        alert('Digite o nome do assunto.');
        return;
    }

    try {
        showLoading(true);
        assuntos.push(nome);
        await database.ref('Assuntos').set(assuntos);
        closeModal();
        loadAssuntos();
        populateDropdowns();
        alert('Assunto adicionado com sucesso!');
    } catch (error) {
        console.error('Error adding assunto:', error);
        alert('Erro ao adicionar assunto.');
    } finally {
        showLoading(false);
    }
}

function editCadastrador(index, current) {
    showModal('Editar Cadastrador', `
        <div class="form-group">
            <label class="form-label">Nome do Cadastrador</label>
            <input type="text" id="edit-cadastrador" class="form-control" value="${current}">
        </div>
        <button class="btn btn--primary" onclick="updateCadastrador(${index})">Salvar</button>
    `);
}

function editAssunto(index, current) {
    showModal('Editar Assunto', `
        <div class="form-group">
            <label class="form-label">Nome do Assunto</label>
            <input type="text" id="edit-assunto" class="form-control" value="${current}">
        </div>
        <button class="btn btn--primary" onclick="updateAssunto(${index})">Salvar</button>
    `);
}

async function updateCadastrador(index) {
    const nome = document.getElementById('edit-cadastrador').value.trim();
    if (!nome) {
        alert('Digite o nome do cadastrador.');
        return;
    }

    try {
        showLoading(true);
        cadastradores[index] = nome;
        await database.ref('Cadastradores').set(cadastradores);
        closeModal();
        loadCadastradores();
        populateDropdowns();
        alert('Cadastrador atualizado com sucesso!');
    } catch (error) {
        console.error('Error updating cadastrador:', error);
        alert('Erro ao atualizar cadastrador.');
    } finally {
        showLoading(false);
    }
}

async function updateAssunto(index) {
    const nome = document.getElementById('edit-assunto').value.trim();
    if (!nome) {
        alert('Digite o nome do assunto.');
        return;
    }

    try {
        showLoading(true);
        assuntos[index] = nome;
        await database.ref('Assuntos').set(assuntos);
        closeModal();
        loadAssuntos();
        populateDropdowns();
        alert('Assunto atualizado com sucesso!');
    } catch (error) {
        console.error('Error updating assunto:', error);
        alert('Erro ao atualizar assunto.');
    } finally {
        showLoading(false);
    }
}

async function deleteCadastrador(index) {
    if (confirm('Tem certeza que deseja excluir este cadastrador?')) {
        try {
            showLoading(true);
            cadastradores.splice(index, 1);
            await database.ref('Cadastradores').set(cadastradores);
            loadCadastradores();
            populateDropdowns();
            alert('Cadastrador excluído com sucesso!');
        } catch (error) {
            console.error('Error deleting cadastrador:', error);
            alert('Erro ao excluir cadastrador.');
        } finally {
            showLoading(false);
        }
    }
}

async function deleteAssunto(index) {
    if (confirm('Tem certeza que deseja excluir este assunto?')) {
        try {
            showLoading(true);
            assuntos.splice(index, 1);
            await database.ref('Assuntos').set(assuntos);
            loadAssuntos();
            populateDropdowns();
            alert('Assunto excluído com sucesso!');
        } catch (error) {
            console.error('Error deleting assunto:', error);
            alert('Erro ao excluir assunto.');
        } finally {
            showLoading(false);
        }
    }
}

// Reports functions
function showRelatorioIndividual() {
    document.getElementById('report-content').innerHTML = `
        <button class="btn btn--outline mb-16" onclick="showReportsMenu()">← Voltar</button>
        <h3>Relatório Individual</h3>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Cadastrador</label>
                <select id="rel-cadastrador" class="form-control">
                    <option value="">Selecione um cadastrador</option>
                    ${cadastradores.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Data Inicial</label>
                <input type="date" id="rel-data-inicio" class="form-control">
            </div>
            <div class="form-group">
                <label class="form-label">Data Final</label>
                <input type="date" id="rel-data-fim" class="form-control">
            </div>
            <div class="form-group">
                <button class="btn btn--primary" onclick="generateIndividualReport()">Gerar Relatório</button>
            </div>
        </div>
        <div id="individual-report-result"></div>
    `;
}

function showRelatorioCompleto() {
    document.getElementById('report-content').innerHTML = `
        <button class="btn btn--outline mb-16" onclick="showReportsMenu()">← Voltar</button>
        <h3>Relatório Completo</h3>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Data Inicial</label>
                <input type="date" id="rel-comp-data-inicio" class="form-control">
            </div>
            <div class="form-group">
                <label class="form-label">Data Final</label>
                <input type="date" id="rel-comp-data-fim" class="form-control">
            </div>
            <div class="form-group">
                <button class="btn btn--primary" onclick="generateCompleteReport()">Gerar Relatório</button>
            </div>
        </div>
        <div id="complete-report-result"></div>
    `;
}

function showGraficos() {
    document.getElementById('report-content').innerHTML = `
        <button class="btn btn--outline mb-16" onclick="showReportsMenu()">← Voltar</button>
        <h3>Gráficos</h3>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Cadastrador</label>
                <select id="chart-cadastrador" class="form-control">
                    <option value="">Selecione um cadastrador</option>
                    ${cadastradores.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Data Inicial</label>
                <input type="date" id="chart-data-inicio" class="form-control">
            </div>
            <div class="form-group">
                <label class="form-label">Data Final</label>
                <input type="date" id="chart-data-fim" class="form-control">
            </div>
            <div class="form-group">
                <button class="btn btn--primary" onclick="generateCharts()">Gerar Gráficos</button>
            </div>
        </div>
        <div id="charts-container"></div>
    `;
}

function showPorAssunto() {
    document.getElementById('report-content').innerHTML = `
        <button class="btn btn--outline mb-16" onclick="showReportsMenu()">← Voltar</button>
        <h3>Relatório Por Assunto</h3>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Data Inicial</label>
                <input type="date" id="assunto-data-inicio" class="form-control">
            </div>
            <div class="form-group">
                <label class="form-label">Data Final</label>
                <input type="date" id="assunto-data-fim" class="form-control">
            </div>
            <div class="form-group">
                <button class="btn btn--primary" onclick="generateSubjectReport()">Gerar Relatório</button>
            </div>
        </div>
        <div id="subject-report-result"></div>
    `;
}

function showReportsMenu() {
    document.getElementById('report-content').innerHTML = '';
}

function generateIndividualReport() {
    const cadastrador = document.getElementById('rel-cadastrador').value;
    const dataInicio = document.getElementById('rel-data-inicio').value;
    const dataFim = document.getElementById('rel-data-fim').value;

    if (!cadastrador || !dataInicio || !dataFim) {
        alert('Preencha todos os campos.');
        return;
    }

    const startDate = new Date(dataInicio);
    const endDate = new Date(dataFim);
    const filteredProcesses = Object.values(allProcesses).filter(p => {
        if (p.cadastrador !== cadastrador) return false;
        if (!p.entrada) return false;
        const entradaDate = new Date(p.entrada);
        return entradaDate >= startDate && entradaDate <= endDate;
    });

    const reportData = {};
    let totalConcluidos = 0;
    let totalAbertos = 0;

    assuntos.forEach(assunto => {
        const processosAssunto = filteredProcesses.filter(p => p.assunto === assunto);
        const concluidos = processosAssunto.filter(p => p.saida && p.saida.trim() !== '').length;
        const abertos = processosAssunto.length - concluidos;
        const total = processosAssunto.length;
        const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0;

        if (total > 0) {
            reportData[assunto] = { concluidos, abertos, total, percentual };
            totalConcluidos += concluidos;
            totalAbertos += abertos;
        }
    });

    const totalGeral = totalConcluidos + totalAbertos;
    const produtividade = totalGeral > 0 ? Math.round((totalConcluidos / totalGeral) * 100) : 0;

    const resultDiv = document.getElementById('individual-report-result');
    resultDiv.innerHTML = `
        <div class="mt-24">
            <div class="mb-16">
                <strong>Nome do Servidor:</strong> ${cadastrador}<br>
                <strong>Período:</strong> ${formatDateForDisplay(dataInicio)} a ${formatDateForDisplay(dataFim)}<br>
                <strong>Total de Processos:</strong> ${totalGeral}<br>
                <strong>Produtividade:</strong> ${produtividade}%
            </div>
            
            <table class="processes-table">
                <thead>
                    <tr>
                        <th>Assunto</th>
                        <th>Concluído</th>
                        <th>Aberto</th>
                        <th>Total</th>
                        <th>%</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(reportData).map(([assunto, data]) => `
                        <tr>
                            <td>${assunto}</td>
                            <td>${data.concluidos}</td>
                            <td>${data.abertos}</td>
                            <td>${data.total}</td>
                            <td>${data.percentual}%</td>
                        </tr>
                    `).join('')}
                    <tr style="font-weight: bold; background-color: var(--color-bg-2);">
                        <td>TOTAL</td>
                        <td>${totalConcluidos}</td>
                        <td>${totalAbertos}</td>
                        <td>${totalGeral}</td>
                        <td>${produtividade}%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

function generateCompleteReport() {
    const dataInicio = document.getElementById('rel-comp-data-inicio').value;
    const dataFim = document.getElementById('rel-comp-data-fim').value;

    if (!dataInicio || !dataFim) {
        alert('Preencha as datas.');
        return;
    }

    const startDate = new Date(dataInicio);
    const endDate = new Date(dataFim);
    const filteredProcesses = Object.values(allProcesses).filter(p => {
        if (!p.entrada) return false;
        const entradaDate = new Date(p.entrada);
        return entradaDate >= startDate && entradaDate <= endDate;
    });

    const reportData = {};
    let totalProcessos = 0;
    let totalConcluidos = 0;
    let totalAbertos = 0;

    // Initialize data structure
    assuntos.forEach(assunto => {
        reportData[assunto] = {};
        cadastradores.forEach(cadastrador => {
            reportData[assunto][cadastrador] = { concluidos: 0, abertos: 0 };
        });
    });

    // Fill data
    filteredProcesses.forEach(p => {
        if (p.assunto && p.cadastrador && reportData[p.assunto] && reportData[p.assunto][p.cadastrador]) {
            totalProcessos++;
            if (p.saida && p.saida.trim() !== '') {
                reportData[p.assunto][p.cadastrador].concluidos++;
                totalConcluidos++;
            } else {
                reportData[p.assunto][p.cadastrador].abertos++;
                totalAbertos++;
            }
        }
    });

    const percentualConclusao = totalProcessos > 0 ? Math.round((totalConcluidos / totalProcessos) * 100) : 0;

    const resultDiv = document.getElementById('complete-report-result');
    resultDiv.innerHTML = `
        <div class="mt-24">
            <div class="mb-16">
                <strong>Período:</strong> ${formatDateForDisplay(dataInicio)} a ${formatDateForDisplay(dataFim)}<br>
                <strong>Número de Processos Totais:</strong> ${totalProcessos}<br>
                <strong>Processos Concluídos:</strong> ${totalConcluidos}<br>
                <strong>Processos em Aberto:</strong> ${totalAbertos}<br>
                <strong>% de Conclusão:</strong> ${percentualConclusao}%
            </div>
            
            <div style="overflow-x: auto;">
                <table class="processes-table" style="min-width: 1000px;">
                    <thead>
                        <tr>
                            <th>Assunto</th>
                            ${cadastradores.map(c => `<th colspan="2">${c}</th>`).join('')}
                        </tr>
                        <tr>
                            <th></th>
                            ${cadastradores.map(c => `<th>Conc.</th><th>Aber.</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(reportData).map(([assunto, cadastradorData]) => `
                            <tr>
                                <td>${assunto}</td>
                                ${cadastradores.map(c => {
                                    const data = cadastradorData[c];
                                    return `<td>${data.concluidos}</td><td>${data.abertos}</td>`;
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateCharts() {
    const cadastrador = document.getElementById('chart-cadastrador').value;
    const dataInicio = document.getElementById('chart-data-inicio').value;
    const dataFim = document.getElementById('chart-data-fim').value;

    if (!cadastrador || !dataInicio || !dataFim) {
        alert('Preencha todos os campos.');
        return;
    }

    const startDate = new Date(dataInicio);
    const endDate = new Date(dataFim);
    
    // Individual pie chart
    const individualProcesses = Object.values(allProcesses).filter(p => {
        if (p.cadastrador !== cadastrador) return false;
        if (!p.entrada) return false;
        const entradaDate = new Date(p.entrada);
        return entradaDate >= startDate && entradaDate <= endDate;
    });

    const concluidos = individualProcesses.filter(p => p.saida && p.saida.trim() !== '').length;
    const abertos = individualProcesses.length - concluidos;

    // All cadastradores bar chart data
    const cadastradorStats = {};
    cadastradores.forEach(c => {
        cadastradorStats[c] = { concluidos: 0, abertos: 0 };
    });

    Object.values(allProcesses).forEach(p => {
        if (!p.cadastrador || !p.entrada) return;
        const entradaDate = new Date(p.entrada);
        if (entradaDate >= startDate && entradaDate <= endDate && cadastradorStats[p.cadastrador]) {
            if (p.saida && p.saida.trim() !== '') {
                cadastradorStats[p.cadastrador].concluidos++;
            } else {
                cadastradorStats[p.cadastrador].abertos++;
            }
        }
    });

    const chartsContainer = document.getElementById('charts-container');
    chartsContainer.innerHTML = `
        <div class="chart-container" style="height: 300px;">
            <h4 class="text-center">Processos de ${cadastrador}</h4>
            <canvas id="pie-chart"></canvas>
        </div>
        
        <div class="chart-container">
            <h4 class="text-center">Processos Concluídos por Cadastrador</h4>
            <canvas id="bar-chart-concluidos"></canvas>
        </div>
        
        <div class="chart-container">
            <h4 class="text-center">Processos em Aberto por Cadastrador</h4>
            <canvas id="bar-chart-abertos"></canvas>
        </div>
    `;

    // Create pie chart
    const pieCtx = document.getElementById('pie-chart').getContext('2d');
    new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: ['Concluídos', 'Em Aberto'],
            datasets: [{
                data: [concluidos, abertos],
                backgroundColor: ['#1FB8CD', '#FFC185']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Create bar chart for concluded processes
    const barCtx1 = document.getElementById('bar-chart-concluidos').getContext('2d');
    new Chart(barCtx1, {
        type: 'bar',
        data: {
            labels: cadastradores,
            datasets: [{
                label: 'Concluídos',
                data: cadastradores.map(c => cadastradorStats[c].concluidos),
                backgroundColor: '#1FB8CD'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Create bar chart for open processes
    const barCtx2 = document.getElementById('bar-chart-abertos').getContext('2d');
    new Chart(barCtx2, {
        type: 'bar',
        data: {
            labels: cadastradores,
            datasets: [{
                label: 'Em Aberto',
                data: cadastradores.map(c => cadastradorStats[c].abertos),
                backgroundColor: '#FFC185'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function generateSubjectReport() {
    const dataInicio = document.getElementById('assunto-data-inicio').value;
    const dataFim = document.getElementById('assunto-data-fim').value;

    if (!dataInicio || !dataFim) {
        alert('Preencha as datas.');
        return;
    }

    const startDate = new Date(dataInicio);
    const endDate = new Date(dataFim);
    const filteredProcesses = Object.values(allProcesses).filter(p => {
        if (!p.entrada) return false;
        const entradaDate = new Date(p.entrada);
        return entradaDate >= startDate && entradaDate <= endDate;
    });

    const subjectStats = {};
    assuntos.forEach(assunto => {
        subjectStats[assunto] = { total: 0, concluidos: 0, abertos: 0, percentual: 0 };
    });

    filteredProcesses.forEach(p => {
        if (p.assunto && subjectStats[p.assunto]) {
            subjectStats[p.assunto].total++;
            if (p.saida && p.saida.trim() !== '') {
                subjectStats[p.assunto].concluidos++;
            } else {
                subjectStats[p.assunto].abertos++;
            }
        }
    });

    // Calculate percentages
    Object.keys(subjectStats).forEach(assunto => {
        const data = subjectStats[assunto];
        data.percentual = data.total > 0 ? Math.round((data.concluidos / data.total) * 100) : 0;
    });

    const resultDiv = document.getElementById('subject-report-result');
    resultDiv.innerHTML = `
        <div class="mt-24">
            <h4>Relatório Por Assunto - ${formatDateForDisplay(dataInicio)} a ${formatDateForDisplay(dataFim)}</h4>
            <table class="processes-table">
                <thead>
                    <tr>
                        <th>Assunto</th>
                        <th>Total</th>
                        <th>Concluídos</th>
                        <th>Em Aberto</th>
                        <th>% Conclusão</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(subjectStats)
                        .filter(([_, data]) => data.total > 0)
                        .map(([assunto, data]) => `
                            <tr>
                                <td>${assunto}</td>
                                <td>${data.total}</td>
                                <td>${data.concluidos}</td>
                                <td>${data.abertos}</td>
                                <td>${data.percentual}%</td>
                            </tr>
                        `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Utility functions
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from menu buttons
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to clicked menu button
    const menuBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (menuBtn) {
        menuBtn.classList.add('active');
    }

    // Load data for specific tabs
    if (tabName === 'basedados') {
        displayProcessTable();
    }
}

function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
}

function showMainApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function showModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('modal-overlay').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

function formatDateForDisplay(dateStr) {
    if (!dateStr || dateStr.trim() === '') return 'Não informado';
    
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    } catch (error) {
        return dateStr;
    }
}

function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        currentUserRole = null;
        showLoginScreen();
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
}

// Close modal when clicking outside
document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});