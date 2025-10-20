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

// Application State
let currentUser = null;
let userRole = null;
let currentPage = 'dashboard';
let processData = [];
let cadastradores = [];
let assuntos = [];
let currentFilters = {
    cadastrador: '',
    assunto: '',
    dataInicio: '',
    dataFim: '',
    status: ''
};
let currentPageNum = 1;
const itemsPerPage = 500;

// Role-based navigation configuration
const navigationConfig = {
    gestor: [
        { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
        { id: 'configuracoes', label: 'Configurações', icon: 'fas fa-cog' },
        { id: 'cadastro', label: 'Cadastro de Processo', icon: 'fas fa-plus-circle' },
        { id: 'editar', label: 'Editar Processo', icon: 'fas fa-edit' },
        { id: 'consulta', label: 'Consulta', icon: 'fas fa-search' },
        { id: 'base-dados', label: 'Base de Dados', icon: 'fas fa-database' },
        { id: 'relatorios', label: 'Relatórios', icon: 'fas fa-chart-bar' }
    ],
    admin: [
        { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
        { id: 'configuracoes', label: 'Configurações', icon: 'fas fa-cog' },
        { id: 'cadastro', label: 'Cadastro de Processo', icon: 'fas fa-plus-circle' },
        { id: 'editar', label: 'Editar Processo', icon: 'fas fa-edit' },
        { id: 'consulta', label: 'Consulta', icon: 'fas fa-search' },
        { id: 'base-dados', label: 'Base de Dados', icon: 'fas fa-database' },
        { id: 'relatorios', label: 'Relatórios', icon: 'fas fa-chart-bar' }
    ],
    consulta: [
        { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
        { id: 'consulta', label: 'Consulta', icon: 'fas fa-search' },
        { id: 'base-dados', label: 'Base de Dados', icon: 'fas fa-database' }
    ]
};

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const currentUserSpan = document.getElementById('currentUser');
const pageTitle = document.getElementById('pageTitle');
const mainContent = document.getElementById('mainContent');
const sidebarNav = document.getElementById('sidebarNav');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    // Check authentication state
    auth.onAuthStateChanged((user) => {
        if (user) {
            handleUserAuthenticated(user);
        } else {
            showLogin();
        }
    });
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize Firebase data
    initializeFirebaseData();
}

// Setup event listeners
function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    overlay.addEventListener('click', closeMobileMenu);
}

// Initialize Firebase data structure
function initializeFirebaseData() {
    // Initialize cadastradores if not exists
    database.ref('cadastradores').once('value', (snapshot) => {
        if (!snapshot.exists()) {
            const defaultCadastradores = {
                'cad1': { nome: 'João Silva', ativo: true },
                'cad2': { nome: 'Maria Santos', ativo: true },
                'cad3': { nome: 'Pedro Costa', ativo: true }
            };
            database.ref('cadastradores').set(defaultCadastradores);
        }
    });
    
    // Initialize assuntos if not exists
    database.ref('assuntos').once('value', (snapshot) => {
        if (!snapshot.exists()) {
            const defaultAssuntos = {
                'ass1': { nome: 'Licenciamento Ambiental', ativo: true },
                'ass2': { nome: 'Obra Pública', ativo: true },
                'ass3': { nome: 'Licitação', ativo: true },
                'ass4': { nome: 'Contrato Administrativo', ativo: true }
            };
            database.ref('assuntos').set(defaultAssuntos);
        }
    });
    
    // Initialize user roles if not exists
    database.ref('users').once('value', (snapshot) => {
        if (!snapshot.exists()) {
            const defaultUsers = {
                'seplan.cadastro@valadares.mg.gov.br': { role: 'gestor' },
                'wendel_hai@hotmail.com': { role: 'admin' },
                'consulta@hotmail.com': { role: 'consulta' }
            };
            database.ref('users').set(defaultUsers);
        }
    });
}

// Handle user authentication
function handleUserAuthenticated(user) {
    currentUser = user;
    
    // Get user role from Firebase
    database.ref('users/' + user.email.replace(/\./g, ',')).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                userRole = snapshot.val().role;
            } else {
                userRole = 'consulta'; // Default role
            }
            
            showDashboard();
            setupNavigation();
            loadDashboard();
        })
        .catch((error) => {
            console.error('Error getting user role:', error);
            userRole = 'consulta';
            showDashboard();
            setupNavigation();
            loadDashboard();
        });
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    loginBtn.innerHTML = '<i class="loading"></i> Entrando...';
    loginBtn.disabled = true;
    loginError.classList.add('hidden');
    
    // Simple authentication for demo (in production, use Firebase Auth properly)
    const validUsers = {
        'seplan.cadastro@valadares.mg.gov.br': 'senha123',
        'wendel_hai@hotmail.com': 'senha123',
        'consulta@hotmail.com': 'senha123'
    };
    
    setTimeout(() => {
        if (validUsers[email] && validUsers[email] === password) {
            // Simulate Firebase auth
            const mockUser = { email: email };
            currentUser = mockUser;
            handleUserAuthenticated(mockUser);
        } else {
            loginError.classList.remove('hidden');
        }
        
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
        loginBtn.disabled = false;
    }, 1000);
}

// Handle logout
function handleLogout() {
    currentUser = null;
    userRole = null;
    currentPage = 'dashboard';
    showLogin();
}

// Show login screen
function showLogin() {
    loginScreen.classList.remove('hidden');
    dashboard.classList.add('hidden');
}

// Show dashboard
function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    currentUserSpan.textContent = currentUser.email;
}

// Setup navigation based on user role
function setupNavigation() {
    const navItems = navigationConfig[userRole] || navigationConfig.consulta;
    
    sidebarNav.innerHTML = '';
    
    navItems.forEach(item => {
        const navItem = document.createElement('button');
        navItem.className = 'nav-item';
        navItem.innerHTML = `<i class="${item.icon}"></i> ${item.label}`;
        navItem.addEventListener('click', () => navigateTo(item.id, item.label));
        
        if (item.id === currentPage) {
            navItem.classList.add('active');
        }
        
        sidebarNav.appendChild(navItem);
    });
}

// Navigate to page
function navigateTo(pageId, pageLabel) {
    currentPage = pageId;
    pageTitle.textContent = pageLabel;
    
    // Update active navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Load page content
    switch(pageId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'configuracoes':
            loadConfiguracoes();
            break;
        case 'cadastro':
            loadCadastro();
            break;
        case 'editar':
            loadEditar();
            break;
        case 'consulta':
            loadConsulta();
            break;
        case 'base-dados':
            loadBaseDados();
            break;
        case 'relatorios':
            loadRelatorios();
            break;
        default:
            loadDashboard();
    }
    
    // Close mobile menu if open
    closeMobileMenu();
}

// Load dashboard content
function loadDashboard() {
    mainContent.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon primary">
                    <i class="fas fa-folder"></i>
                </div>
                <div class="stat-number" id="totalProcessos">0</div>
                <div class="stat-label">Total de Processos</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon success">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-number" id="processosAtivos">0</div>
                <div class="stat-label">Processos Ativos</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon warning">
                    <i class="fas fa-archive"></i>
                </div>
                <div class="stat-number" id="processosArquivados">0</div>
                <div class="stat-label">Processos Arquivados</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon danger">
                    <i class="fas fa-times-circle"></i>
                </div>
                <div class="stat-number" id="processosCancelados">0</div>
                <div class="stat-label">Processos Cancelados</div>
            </div>
        </div>
        
        <div class="card">
            <h3>Bem-vindo ao Sistema de Cadastro Técnico</h3>
            <p>Perfil de acesso: <strong>${userRole.toUpperCase()}</strong></p>
            <p>Utilize o menu lateral para navegar pelas funcionalidades disponíveis.</p>
        </div>
    `;
    
    // Load and display statistics
    loadProcessStatistics();
}

// Load process statistics
function loadProcessStatistics() {
    database.ref('processos').once('value')
        .then((snapshot) => {
            const processos = snapshot.val() || {};
            const processosArray = Object.values(processos);
            
            document.getElementById('totalProcessos').textContent = processosArray.length;
            document.getElementById('processosAtivos').textContent = processosArray.filter(p => p.status === 'ativo').length;
            document.getElementById('processosArquivados').textContent = processosArray.filter(p => p.status === 'arquivado').length;
            document.getElementById('processosCancelados').textContent = processosArray.filter(p => p.status === 'cancelado').length;
        })
        .catch((error) => {
            console.error('Error loading statistics:', error);
        });
}

// Load configurações page
function loadConfiguracoes() {
    mainContent.innerHTML = `
        <div class="card">
            <h3>Gerenciar Cadastradores</h3>
            <form id="cadastradorForm" class="mb-16">
                <div class="flex gap-16 items-end">
                    <div class="form-group flex-1">
                        <label class="form-label">Nome do Cadastrador:</label>
                        <input type="text" id="cadastradorNome" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-success">
                        <i class="fas fa-plus"></i> Adicionar
                    </button>
                </div>
            </form>
            
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="cadastradoresTable">
                        <!-- Populated by JavaScript -->
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="card">
            <h3>Gerenciar Assuntos</h3>
            <form id="assuntoForm" class="mb-16">
                <div class="flex gap-16 items-end">
                    <div class="form-group flex-1">
                        <label class="form-label">Nome do Assunto:</label>
                        <input type="text" id="assuntoNome" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-success">
                        <i class="fas fa-plus"></i> Adicionar
                    </button>
                </div>
            </form>
            
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="assuntosTable">
                        <!-- Populated by JavaScript -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Load data and setup event listeners
    loadCadastradoresTable();
    loadAssuntosTable();
    
    document.getElementById('cadastradorForm').addEventListener('submit', addCadastrador);
    document.getElementById('assuntoForm').addEventListener('submit', addAssunto);
}

// Load cadastradores table
function loadCadastradoresTable() {
    database.ref('cadastradores').on('value', (snapshot) => {
        const cadastradores = snapshot.val() || {};
        const tbody = document.getElementById('cadastradoresTable');
        
        tbody.innerHTML = '';
        
        Object.entries(cadastradores).forEach(([id, cadastrador]) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${cadastrador.nome}</td>
                <td>
                    <span class="status-badge ${cadastrador.ativo ? 'ativo' : 'cancelado'}">
                        ${cadastrador.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline" onclick="toggleCadastradorStatus('${id}', ${!cadastrador.ativo})">
                        <i class="fas fa-${cadastrador.ativo ? 'ban' : 'check'}"></i>
                        ${cadastrador.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button class="btn btn-danger" onclick="deleteCadastrador('${id}')">
                        <i class="fas fa-trash"></i>
                        Excluir
                    </button>
                </td>
            `;
        });
    });
}

// Load assuntos table
function loadAssuntosTable() {
    database.ref('assuntos').on('value', (snapshot) => {
        const assuntos = snapshot.val() || {};
        const tbody = document.getElementById('assuntosTable');
        
        tbody.innerHTML = '';
        
        Object.entries(assuntos).forEach(([id, assunto]) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${assunto.nome}</td>
                <td>
                    <span class="status-badge ${assunto.ativo ? 'ativo' : 'cancelado'}">
                        ${assunto.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline" onclick="toggleAssuntoStatus('${id}', ${!assunto.ativo})">
                        <i class="fas fa-${assunto.ativo ? 'ban' : 'check'}"></i>
                        ${assunto.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button class="btn btn-danger" onclick="deleteAssunto('${id}')">
                        <i class="fas fa-trash"></i>
                        Excluir
                    </button>
                </td>
            `;
        });
    });
}

// Add cadastrador
function addCadastrador(e) {
    e.preventDefault();
    
    const nome = document.getElementById('cadastradorNome').value.trim();
    if (!nome) return;
    
    const newId = 'cad' + Date.now();
    database.ref('cadastradores/' + newId).set({
        nome: nome,
        ativo: true
    }).then(() => {
        document.getElementById('cadastradorNome').value = '';
        showAlert('Cadastrador adicionado com sucesso!', 'success');
    }).catch((error) => {
        showAlert('Erro ao adicionar cadastrador: ' + error.message, 'error');
    });
}

// Add assunto
function addAssunto(e) {
    e.preventDefault();
    
    const nome = document.getElementById('assuntoNome').value.trim();
    if (!nome) return;
    
    const newId = 'ass' + Date.now();
    database.ref('assuntos/' + newId).set({
        nome: nome,
        ativo: true
    }).then(() => {
        document.getElementById('assuntoNome').value = '';
        showAlert('Assunto adicionado com sucesso!', 'success');
    }).catch((error) => {
        showAlert('Erro ao adicionar assunto: ' + error.message, 'error');
    });
}

// Toggle cadastrador status
function toggleCadastradorStatus(id, newStatus) {
    database.ref('cadastradores/' + id + '/ativo').set(newStatus)
        .then(() => {
            showAlert('Status do cadastrador atualizado!', 'success');
        })
        .catch((error) => {
            showAlert('Erro ao atualizar status: ' + error.message, 'error');
        });
}

// Toggle assunto status
function toggleAssuntoStatus(id, newStatus) {
    database.ref('assuntos/' + id + '/ativo').set(newStatus)
        .then(() => {
            showAlert('Status do assunto atualizado!', 'success');
        })
        .catch((error) => {
            showAlert('Erro ao atualizar status: ' + error.message, 'error');
        });
}

// Delete cadastrador
function deleteCadastrador(id) {
    if (confirm('Tem certeza que deseja excluir este cadastrador?')) {
        database.ref('cadastradores/' + id).remove()
            .then(() => {
                showAlert('Cadastrador removido com sucesso!', 'success');
            })
            .catch((error) => {
                showAlert('Erro ao remover cadastrador: ' + error.message, 'error');
            });
    }
}

// Delete assunto
function deleteAssunto(id) {
    if (confirm('Tem certeza que deseja excluir este assunto?')) {
        database.ref('assuntos/' + id).remove()
            .then(() => {
                showAlert('Assunto removido com sucesso!', 'success');
            })
            .catch((error) => {
                showAlert('Erro ao remover assunto: ' + error.message, 'error');
            });
    }
}

// Load cadastro page
function loadCadastro() {
    mainContent.innerHTML = `
        <div class="card">
            <h3>Cadastro de Processo Administrativo</h3>
            
            <form id="processoForm">
                <div class="flex gap-16">
                    <div class="form-group flex-1">
                        <label class="form-label">Número do Processo: *</label>
                        <input type="text" id="numeroProcesso" class="form-control" required
                               placeholder="Ex: 2024/001">
                        <div class="process-format-hint">
                            Formato sugerido: AAAA/NNN (Ano/Número sequencial)
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Data: *</label>
                        <input type="date" id="dataProcesso" class="form-control" required>
                    </div>
                </div>
                
                <div class="flex gap-16">
                    <div class="form-group flex-1">
                        <label class="form-label">Cadastrador: *</label>
                        <select id="cadastradorProcesso" class="form-control" required>
                            <option value="">Selecione um cadastrador</option>
                        </select>
                    </div>
                    
                    <div class="form-group flex-1">
                        <label class="form-label">Assunto: *</label>
                        <select id="assuntoProcesso" class="form-control" required>
                            <option value="">Selecione um assunto</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Interessado: *</label>
                    <input type="text" id="interessadoProcesso" class="form-control" required
                           placeholder="Nome do interessado">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Descrição:</label>
                    <textarea id="descricaoProcesso" class="form-control" rows="4"
                              placeholder="Descrição detalhada do processo"></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Status:</label>
                    <select id="statusProcesso" class="form-control">
                        <option value="ativo">Ativo</option>
                        <option value="arquivado">Arquivado</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Observações:</label>
                    <textarea id="observacoesProcesso" class="form-control" rows="3"
                              placeholder="Observações adicionais"></textarea>
                </div>
                
                <div class="flex gap-16">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i>
                        Salvar Processo
                    </button>
                    
                    <button type="button" class="btn btn-secondary" onclick="clearProcessoForm()">
                        <i class="fas fa-eraser"></i>
                        Limpar Formulário
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Load dropdowns
    loadCadastradorDropdown('cadastradorProcesso');
    loadAssuntoDropdown('assuntoProcesso');
    
    // Set current date
    document.getElementById('dataProcesso').valueAsDate = new Date();
    
    // Setup form handler
    document.getElementById('processoForm').addEventListener('submit', saveProcesso);
}

// Load cadastrador dropdown
function loadCadastradorDropdown(selectId) {
    const select = document.getElementById(selectId);
    
    database.ref('cadastradores').once('value')
        .then((snapshot) => {
            const cadastradores = snapshot.val() || {};
            
            // Clear existing options (keep the first one)
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            Object.entries(cadastradores).forEach(([id, cadastrador]) => {
                if (cadastrador.ativo) {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = cadastrador.nome;
                    select.appendChild(option);
                }
            });
        })
        .catch((error) => {
            console.error('Error loading cadastradores:', error);
        });
}

// Load assunto dropdown
function loadAssuntoDropdown(selectId) {
    const select = document.getElementById(selectId);
    
    database.ref('assuntos').once('value')
        .then((snapshot) => {
            const assuntos = snapshot.val() || {};
            
            // Clear existing options (keep the first one)
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            Object.entries(assuntos).forEach(([id, assunto]) => {
                if (assunto.ativo) {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = assunto.nome;
                    select.appendChild(option);
                }
            });
        })
        .catch((error) => {
            console.error('Error loading assuntos:', error);
        });
}

// Save processo
function saveProcesso(e) {
    e.preventDefault();
    
    const numeroProcesso = document.getElementById('numeroProcesso').value.trim();
    const dataProcesso = document.getElementById('dataProcesso').value;
    const cadastradorProcesso = document.getElementById('cadastradorProcesso').value;
    const assuntoProcesso = document.getElementById('assuntoProcesso').value;
    const interessadoProcesso = document.getElementById('interessadoProcesso').value.trim();
    const descricaoProcesso = document.getElementById('descricaoProcesso').value.trim();
    const statusProcesso = document.getElementById('statusProcesso').value;
    const observacoesProcesso = document.getElementById('observacoesProcesso').value.trim();
    
    // Format process key (remove special characters)
    const processKey = numeroProcesso.replace(/[^a-zA-Z0-9]/g, '_');
    
    const processoData = {
        numero: numeroProcesso,
        data: dataProcesso,
        cadastrador: cadastradorProcesso,
        assunto: assuntoProcesso,
        interessado: interessadoProcesso,
        descricao: descricaoProcesso,
        status: statusProcesso,
        observacoes: observacoesProcesso,
        dataCriacao: new Date().toISOString(),
        criadoPor: currentUser.email
    };
    
    database.ref('processos/' + processKey).set(processoData)
        .then(() => {
            showAlert('Processo salvo com sucesso!', 'success');
            clearProcessoForm();
        })
        .catch((error) => {
            showAlert('Erro ao salvar processo: ' + error.message, 'error');
        });
}

// Clear processo form
function clearProcessoForm() {
    document.getElementById('processoForm').reset();
    document.getElementById('dataProcesso').valueAsDate = new Date();
}

// Load editar page
function loadEditar() {
    mainContent.innerHTML = `
        <div class="card">
            <h3>Buscar Processo para Editar</h3>
            
            <div class="flex gap-16 items-end mb-16">
                <div class="form-group flex-1">
                    <label class="form-label">Número do Processo:</label>
                    <input type="text" id="buscarProcessoEdit" class="form-control"
                           placeholder="Digite o número do processo (com barras ou hífens)">
                </div>
                <button class="btn btn-primary" onclick="buscarProcessoParaEditar()">
                    <i class="fas fa-search"></i>
                    Buscar
                </button>
            </div>
        </div>
        
        <div id="editarProcessoContainer" class="hidden">
            <!-- Edit form will be loaded here -->
        </div>
    `;
}

// Search process for editing
function buscarProcessoParaEditar() {
    const numeroProcesso = document.getElementById('buscarProcessoEdit').value.trim();
    
    if (!numeroProcesso) {
        showAlert('Digite o número do processo para buscar', 'warning');
        return;
    }
    
    // Format process key for search
    const processKey = numeroProcesso.replace(/[^a-zA-Z0-9]/g, '_');
    
    database.ref('processos/' + processKey).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                loadEditForm(processKey, snapshot.val());
            } else {
                showAlert('Processo não encontrado', 'error');
                document.getElementById('editarProcessoContainer').classList.add('hidden');
            }
        })
        .catch((error) => {
            showAlert('Erro ao buscar processo: ' + error.message, 'error');
        });
}

// Load edit form
function loadEditForm(processKey, processoData) {
    const container = document.getElementById('editarProcessoContainer');
    container.classList.remove('hidden');
    
    container.innerHTML = `
        <div class="card">
            <h3>Editar Processo: ${processoData.numero}</h3>
            
            <form id="editProcessoForm">
                <input type="hidden" id="editProcessKey" value="${processKey}">
                
                <div class="flex gap-16">
                    <div class="form-group flex-1">
                        <label class="form-label">Número do Processo: *</label>
                        <input type="text" id="editNumeroProcesso" class="form-control" required
                               value="${processoData.numero}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Data: *</label>
                        <input type="date" id="editDataProcesso" class="form-control" required
                               value="${processoData.data}">
                    </div>
                </div>
                
                <div class="flex gap-16">
                    <div class="form-group flex-1">
                        <label class="form-label">Cadastrador: *</label>
                        <select id="editCadastradorProcesso" class="form-control" required>
                            <option value="">Selecione um cadastrador</option>
                        </select>
                    </div>
                    
                    <div class="form-group flex-1">
                        <label class="form-label">Assunto: *</label>
                        <select id="editAssuntoProcesso" class="form-control" required>
                            <option value="">Selecione um assunto</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Interessado: *</label>
                    <input type="text" id="editInteressadoProcesso" class="form-control" required
                           value="${processoData.interessado}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Descrição:</label>
                    <textarea id="editDescricaoProcesso" class="form-control" rows="4">${processoData.descricao || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Status:</label>
                    <select id="editStatusProcesso" class="form-control">
                        <option value="ativo" ${processoData.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                        <option value="arquivado" ${processoData.status === 'arquivado' ? 'selected' : ''}>Arquivado</option>
                        <option value="cancelado" ${processoData.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Observações:</label>
                    <textarea id="editObservacoesProcesso" class="form-control" rows="3">${processoData.observacoes || ''}</textarea>
                </div>
                
                <div class="flex gap-16">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i>
                        Salvar Alterações
                    </button>
                    
                    <button type="button" class="btn btn-danger" onclick="deleteProcesso('${processKey}')">
                        <i class="fas fa-trash"></i>
                        Excluir Processo
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Load dropdowns and set values
    loadCadastradorDropdown('editCadastradorProcesso');
    loadAssuntoDropdown('editAssuntoProcesso');
    
    // Set selected values after dropdowns are loaded
    setTimeout(() => {
        document.getElementById('editCadastradorProcesso').value = processoData.cadastrador;
        document.getElementById('editAssuntoProcesso').value = processoData.assunto;
    }, 100);
    
    // Setup form handler
    document.getElementById('editProcessoForm').addEventListener('submit', updateProcesso);
}

// Update processo
function updateProcesso(e) {
    e.preventDefault();
    
    const processKey = document.getElementById('editProcessKey').value;
    const numeroProcesso = document.getElementById('editNumeroProcesso').value.trim();
    const dataProcesso = document.getElementById('editDataProcesso').value;
    const cadastradorProcesso = document.getElementById('editCadastradorProcesso').value;
    const assuntoProcesso = document.getElementById('editAssuntoProcesso').value;
    const interessadoProcesso = document.getElementById('editInteressadoProcesso').value.trim();
    const descricaoProcesso = document.getElementById('editDescricaoProcesso').value.trim();
    const statusProcesso = document.getElementById('editStatusProcesso').value;
    const observacoesProcesso = document.getElementById('editObservacoesProcesso').value.trim();
    
    const updates = {
        numero: numeroProcesso,
        data: dataProcesso,
        cadastrador: cadastradorProcesso,
        assunto: assuntoProcesso,
        interessado: interessadoProcesso,
        descricao: descricaoProcesso,
        status: statusProcesso,
        observacoes: observacoesProcesso,
        dataAtualizacao: new Date().toISOString(),
        atualizadoPor: currentUser.email
    };
    
    database.ref('processos/' + processKey).update(updates)
        .then(() => {
            showAlert('Processo atualizado com sucesso!', 'success');
        })
        .catch((error) => {
            showAlert('Erro ao atualizar processo: ' + error.message, 'error');
        });
}

// Delete processo
function deleteProcesso(processKey) {
    if (confirm('Tem certeza que deseja excluir este processo? Esta ação não pode ser desfeita.')) {
        database.ref('processos/' + processKey).remove()
            .then(() => {
                showAlert('Processo excluído com sucesso!', 'success');
                document.getElementById('editarProcessoContainer').classList.add('hidden');
                document.getElementById('buscarProcessoEdit').value = '';
            })
            .catch((error) => {
                showAlert('Erro ao excluir processo: ' + error.message, 'error');
            });
    }
}

// Load consulta page
function loadConsulta() {
    mainContent.innerHTML = `
        <div class="card">
            <h3>Consulta de Processos</h3>
            
            <div class="flex gap-16 items-end mb-16">
                <div class="form-group flex-1">
                    <label class="form-label">Número do Processo:</label>
                    <input type="text" id="buscarProcessoConsulta" class="form-control"
                           placeholder="Digite o número do processo (com barras ou hífens)">
                </div>
                <button class="btn btn-primary" onclick="buscarProcessoConsulta()">
                    <i class="fas fa-search"></i>
                    Buscar
                </button>
            </div>
        </div>
        
        <div id="consultaResultados">
            <!-- Search results will be displayed here -->
        </div>
    `;
}

// Search process for consultation
function buscarProcessoConsulta() {
    const numeroProcesso = document.getElementById('buscarProcessoConsulta').value.trim();
    
    if (!numeroProcesso) {
        showAlert('Digite o número do processo para buscar', 'warning');
        return;
    }
    
    // Format process key for search
    const processKey = numeroProcesso.replace(/[^a-zA-Z0-9]/g, '_');
    
    database.ref('processos/' + processKey).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                displayProcessoConsulta(snapshot.val());
            } else {
                showAlert('Processo não encontrado', 'error');
                document.getElementById('consultaResultados').innerHTML = '';
            }
        })
        .catch((error) => {
            showAlert('Erro ao buscar processo: ' + error.message, 'error');
        });
}

// Display processo for consultation
function displayProcessoConsulta(processoData) {
    const container = document.getElementById('consultaResultados');
    
    // Get cadastrador and assunto names
    Promise.all([
        database.ref('cadastradores/' + processoData.cadastrador).once('value'),
        database.ref('assuntos/' + processoData.assunto).once('value')
    ]).then(([cadastradorSnapshot, assuntoSnapshot]) => {
        const cadastradorNome = cadastradorSnapshot.exists() ? cadastradorSnapshot.val().nome : 'Não encontrado';
        const assuntoNome = assuntoSnapshot.exists() ? assuntoSnapshot.val().nome : 'Não encontrado';
        
        container.innerHTML = `
            <div class="card">
                <div class="flex justify-between items-center mb-16">
                    <h3>Detalhes do Processo: ${processoData.numero}</h3>
                    <span class="status-badge ${processoData.status}">${processoData.status.toUpperCase()}</span>
                </div>
                
                <div class="search-result-details">
                    <div class="search-result-detail">
                        <strong>Data:</strong>
                        <span>${new Date(processoData.data).toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    <div class="search-result-detail">
                        <strong>Cadastrador:</strong>
                        <span>${cadastradorNome}</span>
                    </div>
                    
                    <div class="search-result-detail">
                        <strong>Assunto:</strong>
                        <span>${assuntoNome}</span>
                    </div>
                    
                    <div class="search-result-detail">
                        <strong>Interessado:</strong>
                        <span>${processoData.interessado}</span>
                    </div>
                    
                    ${processoData.descricao ? `
                        <div class="search-result-detail" style="grid-column: 1 / -1;">
                            <strong>Descrição:</strong>
                            <span>${processoData.descricao}</span>
                        </div>
                    ` : ''}
                    
                    ${processoData.observacoes ? `
                        <div class="search-result-detail" style="grid-column: 1 / -1;">
                            <strong>Observações:</strong>
                            <span>${processoData.observacoes}</span>
                        </div>
                    ` : ''}
                    
                    <div class="search-result-detail">
                        <strong>Criado em:</strong>
                        <span>${new Date(processoData.dataCriacao).toLocaleString('pt-BR')}</span>
                    </div>
                    
                    <div class="search-result-detail">
                        <strong>Criado por:</strong>
                        <span>${processoData.criadoPor}</span>
                    </div>
                    
                    ${processoData.dataAtualizacao ? `
                        <div class="search-result-detail">
                            <strong>Atualizado em:</strong>
                            <span>${new Date(processoData.dataAtualizacao).toLocaleString('pt-BR')}</span>
                        </div>
                        
                        <div class="search-result-detail">
                            <strong>Atualizado por:</strong>
                            <span>${processoData.atualizadoPor}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).catch((error) => {
        console.error('Error loading additional data:', error);
        // Show basic info even if additional data fails to load
        container.innerHTML = `
            <div class="card">
                <div class="flex justify-between items-center mb-16">
                    <h3>Detalhes do Processo: ${processoData.numero}</h3>
                    <span class="status-badge ${processoData.status}">${processoData.status.toUpperCase()}</span>
                </div>
                
                <div class="search-result-details">
                    <div class="search-result-detail">
                        <strong>Data:</strong>
                        <span>${new Date(processoData.data).toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    <div class="search-result-detail">
                        <strong>Interessado:</strong>
                        <span>${processoData.interessado}</span>
                    </div>
                    
                    <div class="search-result-detail">
                        <strong>Status:</strong>
                        <span>${processoData.status}</span>
                    </div>
                </div>
            </div>
        `;
    });
}

// Load base dados page
function loadBaseDados() {
    mainContent.innerHTML = `
        <div class="filters">
            <div class="form-group">
                <label class="form-label">Cadastrador:</label>
                <select id="filterCadastrador" class="form-control">
                    <option value="">Todos</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Assunto:</label>
                <select id="filterAssunto" class="form-control">
                    <option value="">Todos</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Status:</label>
                <select id="filterStatus" class="form-control">
                    <option value="">Todos</option>
                    <option value="ativo">Ativo</option>
                    <option value="arquivado">Arquivado</option>
                    <option value="cancelado">Cancelado</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Data Inicial:</label>
                <input type="date" id="filterDataInicio" class="form-control">
            </div>
            
            <div class="form-group">
                <label class="form-label">Data Final:</label>
                <input type="date" id="filterDataFim" class="form-control">
            </div>
            
            <div class="form-group flex items-end">
                <button class="btn btn-primary" onclick="applyFilters()">
                    <i class="fas fa-filter"></i>
                    Aplicar Filtros
                </button>
            </div>
        </div>
        
        <div class="card">
            <div class="flex justify-between items-center mb-16">
                <h3>Base de Dados de Processos</h3>
                <div id="processCount" class="text-right">
                    <!-- Process count will be shown here -->
                </div>
            </div>
            
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Data</th>
                            <th>Cadastrador</th>
                            <th>Assunto</th>
                            <th>Interessado</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="processTable">
                        <!-- Process data will be populated here -->
                    </tbody>
                </table>
            </div>
            
            <div id="pagination" class="pagination">
                <!-- Pagination will be generated here -->
            </div>
        </div>
    `;
    
    // Load filter dropdowns
    loadCadastradorDropdown('filterCadastrador');
    loadAssuntoDropdown('filterAssunto');
    
    // Load initial data
    applyFilters();
}

// Apply filters and load process data
function applyFilters() {
    const cadastradorFilter = document.getElementById('filterCadastrador').value;
    const assuntoFilter = document.getElementById('filterAssunto').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const dataInicioFilter = document.getElementById('filterDataInicio').value;
    const dataFimFilter = document.getElementById('filterDataFim').value;
    
    currentFilters = {
        cadastrador: cadastradorFilter,
        assunto: assuntoFilter,
        status: statusFilter,
        dataInicio: dataInicioFilter,
        dataFim: dataFimFilter
    };
    
    currentPageNum = 1;
    loadProcessData();
}

// Load process data with filters and pagination
function loadProcessData() {
    database.ref('processos').once('value')
        .then((snapshot) => {
            const processos = snapshot.val() || {};
            let processosArray = Object.entries(processos).map(([key, value]) => ({ key, ...value }));
            
            // Apply filters
            processosArray = filterProcesses(processosArray);
            
            // Sort by date (newest first)
            processosArray.sort((a, b) => new Date(b.data) - new Date(a.data));
            
            // Calculate pagination
            const totalItems = processosArray.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            const startIndex = (currentPageNum - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
            const paginatedData = processosArray.slice(startIndex, endIndex);
            
            // Update process count
            document.getElementById('processCount').innerHTML = `
                Mostrando ${startIndex + 1}-${endIndex} de ${totalItems} processos
            `;
            
            // Populate table
            populateProcessTable(paginatedData);
            
            // Generate pagination
            generatePagination(totalPages);
        })
        .catch((error) => {
            console.error('Error loading process data:', error);
            showAlert('Erro ao carregar dados: ' + error.message, 'error');
        });
}

// Filter processes based on current filters
function filterProcesses(processosArray) {
    return processosArray.filter(processo => {
        // Filter by cadastrador
        if (currentFilters.cadastrador && processo.cadastrador !== currentFilters.cadastrador) {
            return false;
        }
        
        // Filter by assunto
        if (currentFilters.assunto && processo.assunto !== currentFilters.assunto) {
            return false;
        }
        
        // Filter by status
        if (currentFilters.status && processo.status !== currentFilters.status) {
            return false;
        }
        
        // Filter by date range
        const processoDate = new Date(processo.data);
        
        if (currentFilters.dataInicio) {
            const dataInicio = new Date(currentFilters.dataInicio);
            if (processoDate < dataInicio) {
                return false;
            }
        }
        
        if (currentFilters.dataFim) {
            const dataFim = new Date(currentFilters.dataFim);
            if (processoDate > dataFim) {
                return false;
            }
        }
        
        return true;
    });
}

// Populate process table
function populateProcessTable(processosArray) {
    const tbody = document.getElementById('processTable');
    tbody.innerHTML = '';
    
    if (processosArray.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Nenhum processo encontrado</td>
            </tr>
        `;
        return;
    }
    
    // Load cadastradores and assuntos for display
    Promise.all([
        database.ref('cadastradores').once('value'),
        database.ref('assuntos').once('value')
    ]).then(([cadastradoresSnapshot, assuntosSnapshot]) => {
        const cadastradores = cadastradoresSnapshot.val() || {};
        const assuntos = assuntosSnapshot.val() || {};
        
        processosArray.forEach(processo => {
            const cadastradorNome = cadastradores[processo.cadastrador]?.nome || 'N/A';
            const assuntoNome = assuntos[processo.assunto]?.nome || 'N/A';
            
            const row = tbody.insertRow();
            row.innerHTML = `
                <td><strong>${processo.numero}</strong></td>
                <td>${new Date(processo.data).toLocaleDateString('pt-BR')}</td>
                <td>${cadastradorNome}</td>
                <td>${assuntoNome}</td>
                <td>${processo.interessado}</td>
                <td>
                    <span class="status-badge ${processo.status}">${processo.status.toUpperCase()}</span>
                </td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="viewProcessoDetails('${processo.key}')">
                        <i class="fas fa-eye"></i>
                        Ver
                    </button>
                </td>
            `;
        });
    }).catch((error) => {
        console.error('Error loading reference data:', error);
        
        // Show basic data even if reference data fails
        processosArray.forEach(processo => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td><strong>${processo.numero}</strong></td>
                <td>${new Date(processo.data).toLocaleDateString('pt-BR')}</td>
                <td>-</td>
                <td>-</td>
                <td>${processo.interessado}</td>
                <td>
                    <span class="status-badge ${processo.status}">${processo.status.toUpperCase()}</span>
                </td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="viewProcessoDetails('${processo.key}')">
                        <i class="fas fa-eye"></i>
                        Ver
                    </button>
                </td>
            `;
        });
    });
}

// Generate pagination
function generatePagination(totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPageNum === 1;
    prevBtn.onclick = () => goToPage(currentPageNum - 1);
    pagination.appendChild(prevBtn);
    
    // Page numbers
    const startPage = Math.max(1, currentPageNum - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-btn';
        pageBtn.textContent = i;
        pageBtn.classList.toggle('active', i === currentPageNum);
        pageBtn.onclick = () => goToPage(i);
        pagination.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPageNum === totalPages;
    nextBtn.onclick = () => goToPage(currentPageNum + 1);
    pagination.appendChild(nextBtn);
}

// Go to page
function goToPage(pageNum) {
    currentPageNum = pageNum;
    loadProcessData();
}

// View process details
function viewProcessoDetails(processKey) {
    database.ref('processos/' + processKey).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                displayProcessoConsulta(snapshot.val());
                // Scroll to top of content
                document.querySelector('.content').scrollTop = 0;
            }
        })
        .catch((error) => {
            showAlert('Erro ao carregar detalhes: ' + error.message, 'error');
        });
}

// Load relatórios page
function loadRelatorios() {
    mainContent.innerHTML = `
        <div class="card">
            <h3>Relatórios e Estatísticas</h3>
            
            <div class="filters">
                <div class="form-group">
                    <label class="form-label">Tipo de Relatório:</label>
                    <select id="tipoRelatorio" class="form-control">
                        <option value="individual">Relatório Individual</option>
                        <option value="completo">Relatório Completo</option>
                        <option value="graficos">Gráficos e Estatísticas</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Cadastrador:</label>
                    <select id="relatorioCadastrador" class="form-control">
                        <option value="">Todos</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Data Inicial:</label>
                    <input type="date" id="relatorioDataInicio" class="form-control">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Data Final:</label>
                    <input type="date" id="relatorioDataFim" class="form-control">
                </div>
                
                <div class="form-group flex items-end">
                    <button class="btn btn-primary" onclick="gerarRelatorio()">
                        <i class="fas fa-chart-bar"></i>
                        Gerar Relatório
                    </button>
                </div>
            </div>
        </div>
        
        <div id="relatorioResultados">
            <!-- Report results will be shown here -->
        </div>
    `;
    
    // Load cadastradores dropdown
    loadCadastradorDropdown('relatorioCadastrador');
    
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    document.getElementById('relatorioDataFim').valueAsDate = today;
    document.getElementById('relatorioDataInicio').valueAsDate = thirtyDaysAgo;
}

// Generate report
function gerarRelatorio() {
    const tipoRelatorio = document.getElementById('tipoRelatorio').value;
    const cadastrador = document.getElementById('relatorioCadastrador').value;
    const dataInicio = document.getElementById('relatorioDataInicio').value;
    const dataFim = document.getElementById('relatorioDataFim').value;
    
    const filters = {
        cadastrador: cadastrador,
        dataInicio: dataInicio,
        dataFim: dataFim
    };
    
    switch(tipoRelatorio) {
        case 'individual':
            gerarRelatorioIndividual(filters);
            break;
        case 'completo':
            gerarRelatorioCompleto(filters);
            break;
        case 'graficos':
            gerarGraficos(filters);
            break;
    }
}

// Generate individual report
function gerarRelatorioIndividual(filters) {
    database.ref('processos').once('value')
        .then((snapshot) => {
            const processos = snapshot.val() || {};
            let processosArray = Object.values(processos);
            
            // Apply filters
            processosArray = processosArray.filter(processo => {
                if (filters.cadastrador && processo.cadastrador !== filters.cadastrador) {
                    return false;
                }
                
                const processoDate = new Date(processo.data);
                
                if (filters.dataInicio) {
                    const dataInicio = new Date(filters.dataInicio);
                    if (processoDate < dataInicio) return false;
                }
                
                if (filters.dataFim) {
                    const dataFim = new Date(filters.dataFim);
                    if (processoDate > dataFim) return false;
                }
                
                return true;
            });
            
            displayRelatorioIndividual(processosArray, filters);
        })
        .catch((error) => {
            showAlert('Erro ao gerar relatório: ' + error.message, 'error');
        });
}

// Display individual report
function displayRelatorioIndividual(processos, filters) {
    const container = document.getElementById('relatorioResultados');
    
    const totalProcessos = processos.length;
    const processosAtivos = processos.filter(p => p.status === 'ativo').length;
    const processosArquivados = processos.filter(p => p.status === 'arquivado').length;
    const processosCancelados = processos.filter(p => p.status === 'cancelado').length;
    
    container.innerHTML = `
        <div class="card">
            <h3>Relatório Individual - Período: ${filters.dataInicio || 'Início'} a ${filters.dataFim || 'Hoje'}</h3>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon primary">
                        <i class="fas fa-folder"></i>
                    </div>
                    <div class="stat-number">${totalProcessos}</div>
                    <div class="stat-label">Total de Processos</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon success">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-number">${processosAtivos}</div>
                    <div class="stat-label">Processos Ativos</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon warning">
                        <i class="fas fa-archive"></i>
                    </div>
                    <div class="stat-number">${processosArquivados}</div>
                    <div class="stat-label">Processos Arquivados</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon danger">
                        <i class="fas fa-times-circle"></i>
                    </div>
                    <div class="stat-number">${processosCancelados}</div>
                    <div class="stat-label">Processos Cancelados</div>
                </div>
            </div>
            
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Data</th>
                            <th>Interessado</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${processos.map(processo => `
                            <tr>
                                <td>${processo.numero}</td>
                                <td>${new Date(processo.data).toLocaleDateString('pt-BR')}</td>
                                <td>${processo.interessado}</td>
                                <td><span class="status-badge ${processo.status}">${processo.status.toUpperCase()}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Generate complete report
function gerarRelatorioCompleto(filters) {
    Promise.all([
        database.ref('processos').once('value'),
        database.ref('cadastradores').once('value'),
        database.ref('assuntos').once('value')
    ]).then(([processosSnapshot, cadastradoresSnapshot, assuntosSnapshot]) => {
        const processos = processosSnapshot.val() || {};
        const cadastradores = cadastradoresSnapshot.val() || {};
        const assuntos = assuntosSnapshot.val() || {};
        
        let processosArray = Object.values(processos);
        
        // Apply date filters
        processosArray = processosArray.filter(processo => {
            const processoDate = new Date(processo.data);
            
            if (filters.dataInicio) {
                const dataInicio = new Date(filters.dataInicio);
                if (processoDate < dataInicio) return false;
            }
            
            if (filters.dataFim) {
                const dataFim = new Date(filters.dataFim);
                if (processoDate > dataFim) return false;
            }
            
            return true;
        });
        
        displayRelatorioCompleto(processosArray, cadastradores, assuntos, filters);
    }).catch((error) => {
        showAlert('Erro ao gerar relatório completo: ' + error.message, 'error');
    });
}

// Display complete report
function displayRelatorioCompleto(processos, cadastradores, assuntos, filters) {
    const container = document.getElementById('relatorioResultados');
    
    // Calculate statistics by cadastrador
    const statsByCadastrador = {};
    const statsByAssunto = {};
    const statsByStatus = { ativo: 0, arquivado: 0, cancelado: 0 };
    
    processos.forEach(processo => {
        // Stats by cadastrador
        if (!statsByCadastrador[processo.cadastrador]) {
            statsByCadastrador[processo.cadastrador] = { total: 0, ativo: 0, arquivado: 0, cancelado: 0 };
        }
        statsByCadastrador[processo.cadastrador].total++;
        statsByCadastrador[processo.cadastrador][processo.status]++;
        
        // Stats by assunto
        if (!statsByAssunto[processo.assunto]) {
            statsByAssunto[processo.assunto] = { total: 0, ativo: 0, arquivado: 0, cancelado: 0 };
        }
        statsByAssunto[processo.assunto].total++;
        statsByAssunto[processo.assunto][processo.status]++;
        
        // Stats by status
        statsByStatus[processo.status]++;
    });
    
    container.innerHTML = `
        <div class="card">
            <h3>Relatório Completo - Período: ${filters.dataInicio || 'Início'} a ${filters.dataFim || 'Hoje'}</h3>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon primary">
                        <i class="fas fa-folder"></i>
                    </div>
                    <div class="stat-number">${processos.length}</div>
                    <div class="stat-label">Total de Processos</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon success">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-number">${statsByStatus.ativo}</div>
                    <div class="stat-label">Processos Ativos</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon warning">
                        <i class="fas fa-archive"></i>
                    </div>
                    <div class="stat-number">${statsByStatus.arquivado}</div>
                    <div class="stat-label">Processos Arquivados</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon danger">
                        <i class="fas fa-times-circle"></i>
                    </div>
                    <div class="stat-number">${statsByStatus.cancelado}</div>
                    <div class="stat-label">Processos Cancelados</div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h4>Estatísticas por Cadastrador</h4>
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Cadastrador</th>
                            <th>Total</th>
                            <th>Ativos</th>
                            <th>Arquivados</th>
                            <th>Cancelados</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(statsByCadastrador).map(([cadastradorId, stats]) => `
                            <tr>
                                <td>${cadastradores[cadastradorId]?.nome || 'N/A'}</td>
                                <td>${stats.total}</td>
                                <td>${stats.ativo}</td>
                                <td>${stats.arquivado}</td>
                                <td>${stats.cancelado}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="card">
            <h4>Estatísticas por Assunto</h4>
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Assunto</th>
                            <th>Total</th>
                            <th>Ativos</th>
                            <th>Arquivados</th>
                            <th>Cancelados</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(statsByAssunto).map(([assuntoId, stats]) => `
                            <tr>
                                <td>${assuntos[assuntoId]?.nome || 'N/A'}</td>
                                <td>${stats.total}</td>
                                <td>${stats.ativo}</td>
                                <td>${stats.arquivado}</td>
                                <td>${stats.cancelado}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Generate charts and graphs
function gerarGraficos(filters) {
    Promise.all([
        database.ref('processos').once('value'),
        database.ref('cadastradores').once('value'),
        database.ref('assuntos').once('value')
    ]).then(([processosSnapshot, cadastradoresSnapshot, assuntosSnapshot]) => {
        const processos = processosSnapshot.val() || {};
        const cadastradores = cadastradoresSnapshot.val() || {};
        const assuntos = assuntosSnapshot.val() || {};
        
        let processosArray = Object.values(processos);
        
        // Apply date filters
        processosArray = processosArray.filter(processo => {
            const processoDate = new Date(processo.data);
            
            if (filters.dataInicio) {
                const dataInicio = new Date(filters.dataInicio);
                if (processoDate < dataInicio) return false;
            }
            
            if (filters.dataFim) {
                const dataFim = new Date(filters.dataFim);
                if (processoDate > dataFim) return false;
            }
            
            return true;
        });
        
        displayGraficos(processosArray, cadastradores, assuntos);
    }).catch((error) => {
        showAlert('Erro ao gerar gráficos: ' + error.message, 'error');
    });
}

// Display charts and graphs
function displayGraficos(processos, cadastradores, assuntos) {
    const container = document.getElementById('relatorioResultados');
    
    container.innerHTML = `
        <div class="card">
            <h3>Gráficos e Estatísticas</h3>
            
            <div class="flex gap-16">
                <div class="flex-1">
                    <h4>Distribuição por Status</h4>
                    <div class="chart-container">
                        <canvas id="statusChart"></canvas>
                    </div>
                </div>
                
                <div class="flex-1">
                    <h4>Processos por Cadastrador</h4>
                    <div class="chart-container">
                        <canvas id="cadastradorChart"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="flex gap-16" style="margin-top: 2rem;">
                <div class="flex-1">
                    <h4>Distribuição por Assunto</h4>
                    <div class="chart-container">
                        <canvas id="assuntoChart"></canvas>
                    </div>
                </div>
                
                <div class="flex-1">
                    <h4>Evolução Mensal</h4>
                    <div class="chart-container">
                        <canvas id="evolucaoChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Generate charts
    generateStatusChart(processos);
    generateCadastradorChart(processos, cadastradores);
    generateAssuntoChart(processos, assuntos);
    generateEvolucaoChart(processos);
}

// Generate status chart
function generateStatusChart(processos) {
    const statusCounts = { ativo: 0, arquivado: 0, cancelado: 0 };
    
    processos.forEach(processo => {
        statusCounts[processo.status]++;
    });
    
    const ctx = document.getElementById('statusChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Ativo', 'Arquivado', 'Cancelado'],
            datasets: [{
                data: [statusCounts.ativo, statusCounts.arquivado, statusCounts.cancelado],
                backgroundColor: ['#059669', '#f59e0b', '#dc2626']
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
}

// Generate cadastrador chart
function generateCadastradorChart(processos, cadastradores) {
    const cadastradorCounts = {};
    
    processos.forEach(processo => {
        const cadastradorNome = cadastradores[processo.cadastrador]?.nome || 'N/A';
        cadastradorCounts[cadastradorNome] = (cadastradorCounts[cadastradorNome] || 0) + 1;
    });
    
    const ctx = document.getElementById('cadastradorChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(cadastradorCounts),
            datasets: [{
                label: 'Processos',
                data: Object.values(cadastradorCounts),
                backgroundColor: '#1e40af'
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

// Generate assunto chart
function generateAssuntoChart(processos, assuntos) {
    const assuntoCounts = {};
    
    processos.forEach(processo => {
        const assuntoNome = assuntos[processo.assunto]?.nome || 'N/A';
        assuntoCounts[assuntoNome] = (assuntoCounts[assuntoNome] || 0) + 1;
    });
    
    const chartColors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];
    
    const ctx = document.getElementById('assuntoChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(assuntoCounts),
            datasets: [{
                data: Object.values(assuntoCounts),
                backgroundColor: chartColors.slice(0, Object.keys(assuntoCounts).length)
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
}

// Generate evolução chart
function generateEvolucaoChart(processos) {
    const monthCounts = {};
    
    processos.forEach(processo => {
        const date = new Date(processo.data);
        const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });
    
    const sortedMonths = Object.keys(monthCounts).sort();
    
    const ctx = document.getElementById('evolucaoChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedMonths.map(month => {
                const [year, monthNum] = month.split('-');
                return new Date(year, monthNum - 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            }),
            datasets: [{
                label: 'Processos Criados',
                data: sortedMonths.map(month => monthCounts[month]),
                borderColor: '#1e40af',
                backgroundColor: 'rgba(30, 64, 175, 0.1)',
                fill: true,
                tension: 0.4
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

// Mobile menu functions
function toggleMobileMenu() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
}

function closeMobileMenu() {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
}

// Show alert messages
function showAlert(message, type) {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insert at the top of main content
    const content = document.querySelector('.content');
    content.insertBefore(alertDiv, content.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Utility functions
function formatProcessNumber(number) {
    // Format process number for display (add slashes/hyphens as needed)
    return number.replace(/([0-9]{4})([0-9]{3})/, '$1/$2');
}

function sanitizeProcessKey(number) {
    // Remove special characters for Firebase key
    return number.replace(/[^a-zA-Z0-9]/g, '_');
}

// Make functions globally available
window.toggleCadastradorStatus = toggleCadastradorStatus;
window.toggleAssuntoStatus = toggleAssuntoStatus;
window.deleteCadastrador = deleteCadastrador;
window.deleteAssunto = deleteAssunto;
window.clearProcessoForm = clearProcessoForm;
window.buscarProcessoParaEditar = buscarProcessoParaEditar;
window.updateProcesso = updateProcesso;
window.deleteProcesso = deleteProcesso;
window.buscarProcessoConsulta = buscarProcessoConsulta;
window.applyFilters = applyFilters;
window.viewProcessoDetails = viewProcessoDetails;
window.goToPage = goToPage;
window.gerarRelatorio = gerarRelatorio;