// script.js - PARTE 1/4

// Sistema de Gestão de Horários - Ciências Econômicas UESC
// Arquivo principal JavaScript

// Estrutura de dados global
// NOTA: 'appData' agora será um espelho local dos dados no Firebase,
// usando objetos (mapas) para fácil acesso por ID e arrays para iteração onde for necessário.
// O Firebase Realtime Database é otimizado para lidar com dados como objetos (chaves/valores).
let appData = {
    professores: {},
    disciplinas: {},
    turmas: {},
    salas: {},
    horarios: {} // A estrutura dos horários será um mapa de ID:horario
};

// Funções utilitárias para converter os objetos do Firebase em arrays quando necessário
// Essas funções são úteis para compatibilidade com a lógica existente que espera arrays
function toArray(obj) {
    return obj ? Object.values(obj) : [];
}

// Configurações dos horários
const HORARIOS_CONFIG = {
    matutino: {
        dias: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
        blocos: [
            { id: 1, inicio: '07:30', fim: '08:20' },
            { id: 2, inicio: '08:20', fim: '09:10' },
            { id: 3, inicio: '09:10', fim: '10:00' },
            { id: 4, inicio: '10:00', fim: '10:50' },
            { id: 5, inicio: '10:50', fim: '11:40' },
            { id: 6, inicio: '11:40', fim: '12:30' }
        ],
        semestres: Array.from({length: 9}, (_, i) => i + 1)
    },
    noturno: {
        dias: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
        blocos: {
            'segunda': [
                { id: 1, inicio: '18:40', fim: '19:30' },
                { id: 2, inicio: '19:30', fim: '20:20' },
                { id: 3, inicio: '20:20', fim: '21:10' },
                { id: 4, inicio: '21:10', fim: '22:00' }
            ],
            'terca': [
                { id: 1, inicio: '18:40', fim: '19:30' },
                { id: 2, inicio: '19:30', fim: '20:20' },
                { id: 3, inicio: '20:20', fim: '21:10' },
                { id: 4, inicio: '21:10', fim: '22:00' }
            ],
            'quarta': [
                { id: 1, inicio: '18:40', fim: '19:30' },
                { id: 2, inicio: '19:30', fim: '20:20' },
                { id: 3, inicio: '20:20', fim: '21:10' },
                { id: 4, inicio: '21:10', fim: '22:00' }
            ],
            'quinta': [
                { id: 1, inicio: '18:40', fim: '19:30' },
                { id: 2, inicio: '19:30', fim: '20:20' },
                { id: 3, inicio: '20:20', fim: '21:10' },
                { id: 4, inicio: '21:10', fim: '22:00' }
            ],
            'sexta': [
                { id: 1, inicio: '18:40', fim: '19:30' },
                { id: 2, inicio: '19:30', fim: '20:20' },
                { id: 3, inicio: '20:20', fim: '21:10' },
                { id: 4, inicio: '21:10', fim: '22:00' }
            ],
            'sabado': [
                { id: 1, inicio: '', fim: '' },
                { id: 2, inicio: '', fim: '' },
                { id: 3, inicio: '', fim: '' },
                { id: 4, inicio: '', fim: '' },
                { id: 5, inicio: '10:50', fim: '11:40' },
                { id: 6, inicio: '11:40', fim: '12:30' }
            ]
        },
        semestres: Array.from({length: 10}, (_, i) => i + 1)
    }
};

const CODIGOS_TURMA = {
    matutino: {
        regular: ['T02'],
        extra: ['T04', 'T06']
    },
    noturno: {
        regular: ['T01'],
        extra: ['T03', 'T05']
    }
};

// Utilitários
// generateId não será mais usado para IDs principais, pois o Firebase gera com .push().key
function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

function formatDateTime(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function showAlert(message, type = 'info') {
    const alertsContainer = document.getElementById('alerts-container');
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;

    const icon = type === 'success' ? 'fas fa-check-circle' :
                 type === 'error' ? 'fas fa-exclamation-circle' :
                 type === 'warning' ? 'fas fa-exclamation-triangle' :
                 'fas fa-info-circle';

    alert.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
        <button class="alert-close">&times;</button>
    `;

    alertsContainer.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);

    // Close button
    alert.querySelector('.alert-close').addEventListener('click', () => {
        alert.parentNode.removeChild(alert);
    });
}

function clearForm(formId) {
    const form = document.getElementById(formId);
    form.reset();

    // Clear multiple selects
    const multiSelects = form.querySelectorAll('select[multiple]');
    multiSelects.forEach(select => {
        Array.from(select.options).forEach(option => option.selected = false);
    });

    // Clear checkboxes
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

// Navegação
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSection = button.getAttribute('data-section');

            // Update active nav button
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Update active section
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetSection).classList.add('active');

            // Update dashboard counts when returning to dashboard
            if (targetSection === 'dashboard') {
                updateDashboardCounts();
            }
            // Render specific lists if navigating to their sections (useful for initial render or refresh)
            if (targetSection === 'cadastros') {
                renderProfessoresList();
                renderDisciplinasList();
                renderTurmasList();
                renderSalasList();
            }
            if (targetSection === 'horarios') {
                 // Certifica-se de que o select de turmas esteja atualizado antes de tentar renderizar a grade
                 updateHorarioSelects();
                 const selectedTurmaId = document.getElementById('horario-turma').value;
                 if (selectedTurmaId) {
                     renderHorariosGrid(selectedTurmaId);
                 } else {
                    document.getElementById('horarios-grid').innerHTML = '<p class="no-activity">Selecione uma turma para visualizar os horários</p>';
                 }
            }
            if (targetSection === 'impressao') {
                updatePrintSelects();
            }
        });
    });
}

// Tabs nos cadastros
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Update active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(targetTab + '-tab').classList.add('active');
        });
    });
}

// Dashboard
function updateDashboardCounts() {
    document.getElementById('professores-count').textContent = toArray(appData.professores).length;
    document.getElementById('disciplinas-count').textContent = toArray(appData.disciplinas).length;
    document.getElementById('turmas-count').textContent = toArray(appData.turmas).length;
    document.getElementById('salas-count').textContent = toArray(appData.salas).length;
}


// script.js - PARTE 2/4 (Continuação da Parte 1)

// Professores
function initProfessores() {
    const form = document.getElementById('professor-form');

    form.addEventListener('submit', async (e) => { // Adicionado 'async'
        e.preventDefault();

        const nome = document.getElementById('professor-nome').value.trim();
        const email = document.getElementById('professor-email').value.trim();
        const disciplinasSelect = document.getElementById('professor-disciplinas');
        const disciplinas = Array.from(disciplinasSelect.selectedOptions).map(option => option.value);

        if (!nome) {
            showAlert('Nome do professor é obrigatório', 'error');
            return;
        }

        const newProfessor = {
            nome,
            email,
            disciplinas,
            createdAt: window.dbServerTimestamp // Adiciona timestamp do servidor
        };

        try {
            // Usa dbRef e dbPush para adicionar ao Firebase
            const professorListRef = window.dbRef(window.firebaseDB, 'professores');
            await window.dbPush(professorListRef, newProfessor); // push() retorna uma Promise

            showAlert('Professor cadastrado com sucesso!', 'success');
            clearForm('professor-form');
            // renderProfessoresList() e updateSelectOptions() serão chamados pelo listener do Firebase
        } catch (error) {
            console.error('Erro ao cadastrar professor:', error);
            showAlert('Erro ao cadastrar professor: ' + error.message, 'error');
        }
    });

    // Search functionality
    const searchInput = document.getElementById('search-professores');
    searchInput.addEventListener('input', () => {
        renderProfessoresList(searchInput.value);
    });
}

function renderProfessoresList(searchTerm = '') {
    const container = document.getElementById('professores-list');
    const professoresArray = toArray(appData.professores); // Converte para array para filtrar
    const filteredProfessores = professoresArray.filter(professor =>
        professor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (professor.email && professor.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filteredProfessores.length === 0) {
        container.innerHTML = '<p class="no-activity">Nenhum professor encontrado</p>';
        return;
    }

    container.innerHTML = filteredProfessores.map(professor => {
        const disciplinasNomes = professor.disciplinas && professor.disciplinas.length > 0
            ? professor.disciplinas.map(id => {
                const disciplina = appData.disciplinas[id]; // Acessa pelo ID do objeto
                return disciplina ? disciplina.nome : 'Disciplina não encontrada';
            }).join(', ')
            : 'Nenhuma';

        return `
            <div class="item-card">
                <div class="item-info">
                    <h4>${professor.nome}</h4>
                    <p>Email: ${professor.email || 'Não informado'}</p>
                    <p>Disciplinas: ${disciplinasNomes}</p>
                </div>
                <div class="item-actions">
                    <button class="btn btn-danger btn-small" onclick="deleteProfessor('${professor.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function deleteProfessor(id) {
    if (confirm('Tem certeza que deseja excluir este professor? Isso removerá todos os horários associados a ele.')) {
        try {
            // Remove o professor do Firebase
            const professorRef = window.dbRef(window.firebaseDB, `professores/${id}`);
            await window.dbRemove(professorRef);

            // Opcional: Remover horários associados (pode ser feito com regras de segurança ou Cloud Functions para escalabilidade)
            // Para simplicidade aqui, fazemos diretamente:
            const horariosParaRemover = toArray(appData.horarios).filter(h => h.idProfessor === id);
            for (const horario of horariosParaRemover) {
                const horarioRef = window.dbRef(window.firebaseDB, `horarios/${horario.id}`);
                await window.dbRemove(horarioRef);
            }

            showAlert('Professor excluído com sucesso!', 'success');
            // renderProfessoresList() e updateSelectOptions() serão chamados pelo listener
        } catch (error) {
            console.error('Erro ao excluir professor:', error);
            showAlert('Erro ao excluir professor: ' + error.message, 'error');
        }
    }
}

// Disciplinas
function initDisciplinas() {
    const form = document.getElementById('disciplina-form');
    const turnoSelect = document.getElementById('disciplina-turno');
    const semestreSelect = document.getElementById('disciplina-semestre');

    // Update semestre options when turno changes
    turnoSelect.addEventListener('change', () => {
        const turno = turnoSelect.value;
        semestreSelect.innerHTML = '<option value="">Selecione o semestre</option>';

        if (turno) {
            const semestres = HORARIOS_CONFIG[turno].semestres;
            semestres.forEach(sem => {
                const option = document.createElement('option');
                option.value = sem;
                option.textContent = `${sem}º Semestre`;
                semestreSelect.appendChild(option);
            });
        }
    });

    form.addEventListener('submit', async (e) => { // Adicionado 'async'
        e.preventDefault();

        const nome = document.getElementById('disciplina-nome').value.trim();
        const codigo = document.getElementById('disciplina-codigo').value.trim();
        const cargaHoraria = parseInt(document.getElementById('disciplina-carga').value);
        const turno = document.getElementById('disciplina-turno').value;
        const semestre = parseInt(document.getElementById('disciplina-semestre').value);

        if (!nome || !codigo || isNaN(cargaHoraria) || !turno || isNaN(semestre)) {
            showAlert('Todos os campos são obrigatórios e numéricos devem ser válidos', 'error');
            return;
        }

        // MODIFICAÇÃO AQUI - Verifica se o código já existe NO MESMO TURNO
        const disciplinasArray = toArray(appData.disciplinas);
        if (disciplinasArray.some(d => d.codigo === codigo && d.turno === turno)) {
            showAlert('Código da disciplina já existe neste turno', 'error');
            return;
        }

        const newDisciplina = {
            nome,
            codigo,
            cargaHoraria,
            turno,
            semestre,
            createdAt: window.dbServerTimestamp
        };

        try {
            const disciplinaListRef = window.dbRef(window.firebaseDB, 'disciplinas');
            await window.dbPush(disciplinaListRef, newDisciplina);

            showAlert('Disciplina cadastrada com sucesso!', 'success');
            clearForm('disciplina-form');
            // renderDisciplinasList() e updateSelectOptions() serão chamados pelo listener
        } catch (error) {
            console.error('Erro ao cadastrar disciplina:', error);
            showAlert('Erro ao cadastrar disciplina: ' + error.message, 'error');
        }
    });

    // Search functionality
    const searchInput = document.getElementById('search-disciplinas');
    searchInput.addEventListener('input', () => {
        renderDisciplinasList(searchInput.value);
    });
}

function renderDisciplinasList(searchTerm = '') {
    const container = document.getElementById('disciplinas-list');
    const disciplinasArray = toArray(appData.disciplinas); // Converte para array
    const filteredDisciplinas = disciplinasArray.filter(disciplina =>
        disciplina.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        disciplina.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredDisciplinas.length === 0) {
        container.innerHTML = '<p class="no-activity">Nenhuma disciplina encontrada</p>';
        return;
    }

    container.innerHTML = filteredDisciplinas.map(disciplina => `
        <div class="item-card">
            <div class="item-info">
                <h4>${disciplina.nome}</h4>
                <p>Código: ${disciplina.codigo}</p>
                <p>Carga Horária: ${disciplina.cargaHoraria}h/aula</p>
                <p>Turno: ${disciplina.turno} - ${disciplina.semestre}º Semestre</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-danger btn-small" onclick="deleteDisciplina('${disciplina.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function deleteDisciplina(id) {
    if (confirm('Tem certeza que deseja excluir esta disciplina?')) {
        try {
            const disciplinaRef = window.dbRef(window.firebaseDB, `disciplinas/${id}`);
            await window.dbRemove(disciplinaRef);
            showAlert('Disciplina excluída com sucesso!', 'success');
            // Será atualizado pelo listener
        } catch (error) {
            console.error('Erro ao excluir disciplina:', error);
            showAlert('Erro ao excluir disciplina: ' + error.message, 'error');
        }
    }
}

// script.js - PARTE 3/4 (Continuação da Parte 2)

// Turmas
function initTurmas() {
    const form = document.getElementById('turma-form');
    const turnoSelect = document.getElementById('turma-turno');
    const semestreSelect = document.getElementById('turma-semestre');
    const tipoSelect = document.getElementById('turma-tipo');
    const codigoSelect = document.getElementById('turma-codigo');

    // Update semestre options when turno changes
    turnoSelect.addEventListener('change', () => {
        const turno = turnoSelect.value;
        semestreSelect.innerHTML = '<option value="">Selecione o semestre</option>';

        if (turno) {
            const semestres = HORARIOS_CONFIG[turno].semestres;
            semestres.forEach(sem => {
                const option = document.createElement('option');
                option.value = sem;
                option.textContent = `${sem}º Semestre`;
                semestreSelect.appendChild(option);
            });
        }
        updateCodigoOptions();
    });

    // Update codigo options when turno or tipo changes
    tipoSelect.addEventListener('change', updateCodigoOptions);

    function updateCodigoOptions() {
        const turno = turnoSelect.value;
        const tipo = tipoSelect.value;
        codigoSelect.innerHTML = '<option value="">Selecione o código</option>';

        if (turno && tipo) {
            const codigos = CODIGOS_TURMA[turno][tipo];
            codigos.forEach(codigo => {
                const option = document.createElement('option');
                option.value = codigo;
                option.textContent = codigo;
                codigoSelect.appendChild(option);
            });
        }
    }

    form.addEventListener('submit', async (e) => { // Adicionado 'async'
        e.preventDefault();

        const turno = document.getElementById('turma-turno').value;
        const semestre = parseInt(document.getElementById('turma-semestre').value);
        const tipo = document.getElementById('turma-tipo').value;
        const codigo = document.getElementById('turma-codigo').value;

        if (!turno || isNaN(semestre) || !tipo || !codigo) {
            showAlert('Todos os campos são obrigatórios e numéricos devem ser válidos', 'error');
            return;
        }

        // Check if turma already exists
        const turmasArray = toArray(appData.turmas);
        if (turmasArray.some(t => t.turno === turno && t.semestreCurricular === semestre && t.codigo === codigo)) {
            showAlert('Turma já existe com estes parâmetros', 'error');
            return;
        }

        const nome = `${semestre}º Semestre ${turno.charAt(0).toUpperCase() + turno.slice(1)} - ${codigo}`;

        const newTurma = {
            nome,
            turno,
            semestreCurricular: semestre,
            tipo,
            codigo,
            createdAt: window.dbServerTimestamp
        };

        try {
            const turmaListRef = window.dbRef(window.firebaseDB, 'turmas');
            await window.dbPush(turmaListRef, newTurma);

            showAlert('Turma cadastrada com sucesso!', 'success');
            clearForm('turma-form');
            // Será atualizado pelo listener
        } catch (error) {
            console.error('Erro ao cadastrar turma:', error);
            showAlert('Erro ao cadastrar turma: ' + error.message, 'error');
        }
    });

    // Search functionality
    const searchInput = document.getElementById('search-turmas');
    searchInput.addEventListener('input', () => {
        renderTurmasList(searchInput.value);
    });
}

function renderTurmasList(searchTerm = '') {
    const container = document.getElementById('turmas-list');
    const turmasArray = toArray(appData.turmas); // Converte para array
    const filteredTurmas = turmasArray.filter(turma =>
        turma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turma.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredTurmas.length === 0) {
        container.innerHTML = '<p class="no-activity">Nenhuma turma encontrada</p>';
        return;
    }

    container.innerHTML = filteredTurmas.map(turma => `
        <div class="item-card">
            <div class="item-info">
                <h4>${turma.nome}</h4>
                <p>Turno: ${turma.turno}</p>
                <p>Tipo: ${turma.tipo} (${turma.codigo})</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-danger btn-small" onclick="deleteTurma('${turma.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function deleteTurma(id) {
    if (confirm('Tem certeza que deseja excluir esta turma? Isso removerá todos os horários associados a ela.')) {
        try {
            const turmaRef = window.dbRef(window.firebaseDB, `turmas/${id}`);
            await window.dbRemove(turmaRef);

            // Remover horários associados
            const horariosParaRemover = toArray(appData.horarios).filter(h => h.idTurma === id);
            for (const horario of horariosParaRemover) {
                const horarioRef = window.dbRef(window.firebaseDB, `horarios/${horario.id}`);
                await window.dbRemove(horarioRef);
            }

            showAlert('Turma excluída com sucesso!', 'success');
            // Será atualizado pelo listener
        } catch (error) {
            console.error('Erro ao excluir turma:', error);
            showAlert('Erro ao excluir turma: ' + error.message, 'error');
        }
    }
}

// Salas
function initSalas() {
    const form = document.getElementById('sala-form');

    form.addEventListener('submit', async (e) => { // Adicionado 'async'
        e.preventDefault();

        const nome = document.getElementById('sala-nome').value.trim();
        const capacidade = parseInt(document.getElementById('sala-capacidade').value) || 0;
        const recursosCheckboxes = form.querySelectorAll('input[type="checkbox"]:checked');
        const recursos = Array.from(recursosCheckboxes).map(cb => cb.value);

        if (!nome) {
            showAlert('Nome da sala é obrigatório', 'error');
            return;
        }

        // Check if sala already exists
        const salasArray = toArray(appData.salas);
        if (salasArray.some(s => s.nome === nome)) {
            showAlert('Sala já existe com este nome', 'error');
            return;
        }

        const newSala = {
            nome,
            capacidade,
            recursos,
            createdAt: window.dbServerTimestamp
        };

        try {
            const salaListRef = window.dbRef(window.firebaseDB, 'salas');
            await window.dbPush(salaListRef, newSala);

            showAlert('Sala cadastrada com sucesso!', 'success');
            clearForm('sala-form');
            // Será atualizado pelo listener
        } catch (error) {
            console.error('Erro ao cadastrar sala:', error);
            showAlert('Erro ao cadastrar sala: ' + error.message, 'error');
        }
    });

    // Search functionality
    const searchInput = document.getElementById('search-salas');
    searchInput.addEventListener('input', () => {
        renderSalasList(searchInput.value);
    });
}

function renderSalasList(searchTerm = '') {
    const container = document.getElementById('salas-list');
    const salasArray = toArray(appData.salas); // Converte para array
    const filteredSalas = salasArray.filter(sala =>
        sala.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredSalas.length === 0) {
        container.innerHTML = '<p class="no-activity">Nenhuma sala encontrada</p>';
        return;
    }

    container.innerHTML = filteredSalas.map(sala => `
        <div class="item-card">
            <div class="item-info">
                <h4>${sala.nome}</h4>
                <p>Capacidade: ${sala.capacidade || 'Não informada'}</p>
                <p>Recursos: ${sala.recursos.length > 0 ? sala.recursos.join(', ') : 'Nenhum'}</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-danger btn-small" onclick="deleteSala('${sala.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function deleteSala(id) {
    if (confirm('Tem certeza que deseja excluir esta sala? Isso removerá todos os horários que a utilizam.')) {
        try {
            const salaRef = window.dbRef(window.firebaseDB, `salas/${id}`);
            await window.dbRemove(salaRef);

            // Remover horários que utilizam esta sala
            const horariosQueUsamSala = toArray(appData.horarios).filter(h => h.idSala === id);
            for (const horario of horariosQueUsamSala) {
                const horarioRef = window.dbRef(window.firebaseDB, `horarios/${horario.id}`);
                await window.dbRemove(horarioRef);
            }

            showAlert('Sala excluída com sucesso!', 'success');
            // Será atualizado pelo listener
        } catch (error) {
            console.error('Erro ao excluir sala:', error);
            showAlert('Erro ao excluir sala: ' + error.message, 'error');
        }
    }
}

// Update select options across the app
function updateSelectOptions() {
    // Update professor disciplinas select
    const professorDisciplinasSelect = document.getElementById('professor-disciplinas');
    professorDisciplinasSelect.innerHTML = '';
    toArray(appData.disciplinas).forEach(disciplina => {
        const option = document.createElement('option');
        option.value = disciplina.id;
        option.textContent = `${disciplina.nome} (${disciplina.codigo})`;
        professorDisciplinasSelect.appendChild(option);
    });

    // Update horario selects
    updateHorarioSelects();

    // Update print selects
    updatePrintSelects();
}

function updateHorarioSelects() {
    const turmaSelect = document.getElementById('horario-turma');
    turmaSelect.innerHTML = '<option value="">Selecione uma turma</option>';
    toArray(appData.turmas).forEach(turma => {
        const option = document.createElement('option');
        option.value = turma.id;
        option.textContent = turma.nome;
        turmaSelect.appendChild(option);
    });

    // Atualizar selects do modal de horário
    const modalDisciplinaSelect = document.getElementById('modal-disciplina');
    modalDisciplinaSelect.innerHTML = '<option value="">Selecione a disciplina</option>';
    toArray(appData.disciplinas).forEach(disciplina => {
        const option = document.createElement('option');
        option.value = disciplina.id;
        option.textContent = `${disciplina.nome} (${disciplina.codigo})`;
        modalDisciplinaSelect.appendChild(option);
    });

    const modalProfessorSelect = document.getElementById('modal-professor');
    modalProfessorSelect.innerHTML = '<option value="">Selecione o professor</option>';
    toArray(appData.professores).forEach(professor => {
        const option = document.createElement('option');
        option.value = professor.id;
        option.textContent = professor.nome;
        modalProfessorSelect.appendChild(option);
    });

    const modalSalaSelect = document.getElementById('modal-sala');
    modalSalaSelect.innerHTML = '<option value="">Selecione a sala</option>';
    toArray(appData.salas).forEach(sala => {
        const option = document.createElement('option');
        option.value = sala.id;
        option.textContent = sala.nome;
        modalSalaSelect.appendChild(option);
    });
}

function updatePrintSelects() {
    // Update print turma select
    const printTurmaSelect = document.getElementById('print-turma');
    printTurmaSelect.innerHTML = '<option value="">Selecione uma turma</option>';
    toArray(appData.turmas).forEach(turma => {
        const option = document.createElement('option');
        option.value = turma.id;
        option.textContent = turma.nome;
        printTurmaSelect.appendChild(option);
    });

    // Update print professor select
    const printProfessorSelect = document.getElementById('print-professor');
    printProfessorSelect.innerHTML = '<option value="">Selecione um professor</option>';
    toArray(appData.professores).forEach(professor => {
        const option = document.createElement('option');
        option.value = professor.id;
        option.textContent = professor.nome;
        printProfessorSelect.appendChild(option);
    });
}

// script.js - PARTE 4/4 (Continuação da Parte 3)

// Horários - Funcionalidades avançadas
function initHorarios() {
    const turmaSelect = document.getElementById('horario-turma');
    const novoHorarioBtn = document.getElementById('btn-novo-horario');
    const limparHorariosBtn = document.getElementById('btn-limpar-horarios');
    const modal = document.getElementById('horario-modal');
    const modalForm = document.getElementById('horario-form');

    let currentSlot = null; // Slot atual sendo editado

    // Event listeners
    turmaSelect.addEventListener('change', () => {
        if (turmaSelect.value) {
            renderHorariosGrid(turmaSelect.value);
        } else {
            document.getElementById('horarios-grid').innerHTML = '<p class="no-activity">Selecione uma turma para visualizar os horários</p>';
        }
    });

    novoHorarioBtn.addEventListener('click', () => {
        if (!turmaSelect.value) {
            showAlert('Selecione uma turma primeiro', 'warning');
            return;
        }
        openHorarioModal();
    });

    limparHorariosBtn.addEventListener('click', async () => { // Adicionado 'async'
        const turmaId = turmaSelect.value;
        if (!turmaId) {
            showAlert('Selecione uma turma primeiro', 'warning');
            return;
        }

        if (confirm('Tem certeza que deseja limpar todos os horários desta turma?')) {
            try {
                // Filtra os horários que pertencem a esta turma e os remove do Firebase
                const horariosDaTurma = toArray(appData.horarios).filter(h => h.idTurma === turmaId);
                const updates = {};
                horariosDaTurma.forEach(horario => {
                    updates[`horarios/${horario.id}`] = null; // Definir como null remove o nó
                });
                await window.dbUpdate(window.dbRef(window.firebaseDB, '/'), updates);

                showAlert('Horários limpos com sucesso!', 'success');
                // renderHorariosGrid será chamado pelo listener do Firebase
            } catch (error) {
                console.error('Erro ao limpar horários:', error);
                showAlert('Erro ao limpar horários: ' + error.message, 'error');
            }
        }
    });

    // Modal events
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-close')) {
            closeHorarioModal();
        }
    });

    modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveHorario();
    });
}

function renderHorariosGrid(turmaId) {
    const turma = appData.turmas[turmaId];
    if (!turma) return;

    const container = document.getElementById('horarios-grid');
    const config = HORARIOS_CONFIG[turma.turno];

    // Função para gerar cor única baseada no ID da disciplina
    const getCorPorDisciplina = (idDisciplina) => {
        if (!idDisciplina) return '#f0f0f0'; // Cor padrão se não houver disciplina
        const hash = idDisciplina.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        const hue = hash % 360; // Gera um tom de cor entre 0-359
        return `hsl(${hue}, 70%, 85%)`; // Cores pastel para melhor legibilidade
    };

    let html = '<table class="grade-horarios">';
    html += '<thead><tr><th>Horário</th>';
    config.dias.forEach(dia => html += `<th>${formatDiaName(dia)}</th>`);
    html += '</tr></thead><tbody>';

    if (turma.turno === 'matutino') {
        config.blocos.forEach(bloco => {
            html += `<tr><td class="horario-label">${bloco.inicio} - ${bloco.fim}</td>`;
            config.dias.forEach(dia => {
                const horario = toArray(appData.horarios).find(h => 
                    h.idTurma === turmaId && h.diaSemana === dia && h.bloco === bloco.id
                );
                const corFundo = horario ? getCorPorDisciplina(horario.idDisciplina) : '#ffffff';
                html += `<td class="horario-slot ${horario ? 'ocupado' : ''}" 
                            style="background-color: ${corFundo};"
                            data-turma-id="${turmaId}" 
                            data-dia="${dia}" 
                            data-bloco="${bloco.id}" 
                            onclick="editHorarioSlot('${turmaId}', '${dia}', ${bloco.id})">`;

                if (horario) {
                    const disciplina = appData.disciplinas[horario.idDisciplina];
                    const professor = appData.professores[horario.idProfessor];
                    const sala = appData.salas[horario.idSala];
                    html += `<div class="horario-info">
                                <div class="disciplina">${disciplina?.nome || 'N/A'}</div>
                                <div class="professor">${professor?.nome || 'N/A'}</div>
                                <div class="sala">${sala?.nome || 'N/A'}</div>
                             </div>`;
                } else {
                    html += '<div class="horario-vazio">+</div>';
                }
                html += '</td>';
            });
            html += '</tr>';
        });
    } else {
        // Lógica para turno noturno (similar, mas com blocos por dia)
        const maxBlocos = Math.max(...config.dias.map(dia => config.blocos[dia].length));
        for (let i = 0; i < maxBlocos; i++) {
            html += '<tr>';
            const horariosLabels = config.dias.map(dia => {
                const bloco = config.blocos[dia][i];
                return bloco ? `${bloco.inicio} - ${bloco.fim}` : '';
            }).filter(h => h);
            const horarioUnico = [...new Set(horariosLabels)];
            html += `<td class="horario-label">${horarioUnico.join(' / ')}</td>`;

            config.dias.forEach(dia => {
                const bloco = config.blocos[dia][i];
                if (bloco) {
                    const horario = toArray(appData.horarios).find(h => 
                        h.idTurma === turmaId && h.diaSemana === dia && h.bloco === bloco.id
                    );
                    const corFundo = horario ? getCorPorDisciplina(horario.idDisciplina) : '#ffffff';
                    html += `<td class="horario-slot ${horario ? 'ocupado' : ''}" 
                                style="background-color: ${corFundo};"
                                data-turma-id="${turmaId}" 
                                data-dia="${dia}" 
                                data-bloco="${bloco.id}" 
                                onclick="editHorarioSlot('${turmaId}', '${dia}', ${bloco.id})">`;

                    if (horario) {
                        const disciplina = appData.disciplinas[horario.idDisciplina];
                        const professor = appData.professores[horario.idProfessor];
                        html += `<div class="horario-info">
                                    <div class="disciplina">${disciplina?.nome || 'N/A'}</div>
                                    <div class="professor">${professor?.nome || 'N/A'}</div>
                                 </div>`;
                    } else {
                        html += '<div class="horario-vazio">+</div>';
                    }
                    html += '</td>';
                } else {
                    html += '<td class="horario-slot disabled"></td>';
                }
            });
            html += '</tr>';
        }
    }
    html += '</tbody></table>';
    container.innerHTML = html;
}

function formatDiaName(dia) {
    const nomes = {
        'segunda': 'Segunda',
        'terca': 'Terça',
        'quarta': 'Quarta',
        'quinta': 'Quinta',
        'sexta': 'Sexta',
        'sabado': 'Sábado'
    };
    return nomes[dia] || dia;
}

function getHorarioSlot(turmaId, dia, bloco) {
    return toArray(appData.horarios).find(h =>
        h.idTurma === turmaId &&
        h.diaSemana === dia &&
        h.bloco === bloco
    );
}

function editHorarioSlot(turmaId, dia, bloco) {
    const turma = appData.turmas[turmaId];
    if (!turma) return;

    currentSlot = { turmaId, dia, bloco };

    // Populate modal with current data if exists
    const existingHorario = getHorarioSlot(turmaId, dia, bloco);

    if (existingHorario) {
        document.getElementById('modal-disciplina').value = existingHorario.idDisciplina;
        document.getElementById('modal-professor').value = existingHorario.idProfessor;
        document.getElementById('modal-sala').value = existingHorario.idSala;
    } else {
        document.getElementById('horario-form').reset();
    }

    // Update modal selects
    updateModalSelects(turma); // Passa a turma para filtrar disciplinas/professores
    
    openHorarioModal();
}

function openHorarioModal() {
    const modal = document.getElementById('horario-modal');
    modal.classList.add('active');
}

function closeHorarioModal() {
    const modal = document.getElementById('horario-modal');
    modal.classList.remove('active');
    currentSlot = null;
    document.getElementById('horario-form').reset(); // Garante que o formulário seja limpo
}

function updateModalSelects(turma) {
    // Update disciplinas select - only for the turma's semester and turno
    const disciplinaSelect = document.getElementById('modal-disciplina');
    disciplinaSelect.innerHTML = '<option value="">Selecione a disciplina</option>';

    const disciplinasValidas = toArray(appData.disciplinas).filter(d =>
        d.turno === turma.turno && d.semestre === turma.semestreCurricular
    );

    disciplinasValidas.forEach(disciplina => {
        const option = document.createElement('option');
        option.value = disciplina.id;
        option.textContent = `${disciplina.nome} (${disciplina.codigo})`;
        disciplinaSelect.appendChild(option);
    });

    // Update professores select - only those who can teach the selected disciplina
    const professorSelect = document.getElementById('modal-professor');
    professorSelect.innerHTML = '<option value="">Selecione o professor</option>';

    // Re-adiciona o listener de change para a disciplina, caso já tenha sido removido/resetado
    disciplinaSelect.onchange = () => { // Usar onchange diretamente para evitar múltiplos listeners
        const disciplinaId = disciplinaSelect.value;
        professorSelect.innerHTML = '<option value="">Selecione o professor</option>';

        if (disciplinaId) {
            const professoresValidos = toArray(appData.professores).filter(p =>
                p.disciplinas.includes(disciplinaId)
            );

            professoresValidos.forEach(professor => {
                const option = document.createElement('option');
                option.value = professor.id;
                option.textContent = professor.nome;
                professorSelect.appendChild(option);
            });
        }
        // Se já havia um professor selecionado, tente selecioná-lo novamente
        if (currentSlot && currentSlot.idProfessor) {
            professorSelect.value = currentSlot.idProfessor;
        }
    };
    // Se já havia uma disciplina selecionada, dispara o change para popular o professor
    if (disciplinaSelect.value) {
        disciplinaSelect.onchange(); // Chama manualmente para popular a lista de professores
    }

    // Update salas select
    const salaSelect = document.getElementById('modal-sala');
    salaSelect.innerHTML = '<option value="">Selecione a sala</option>';

    toArray(appData.salas).forEach(sala => {
        const option = document.createElement('option');
        option.value = sala.id;
        option.textContent = sala.nome;
        salaSelect.appendChild(option);
    });
    // Se já havia uma sala selecionada, tente selecioná-la novamente
    if (currentSlot && currentSlot.idSala) {
        salaSelect.value = currentSlot.idSala;
    }
}

async function saveHorario() { // Adicionado 'async'
    if (!currentSlot) return;

    const disciplinaId = document.getElementById('modal-disciplina').value;
    const professorId = document.getElementById('modal-professor').value;
    const salaId = document.getElementById('modal-sala').value;

    if (!disciplinaId || !professorId || !salaId) {
        showAlert('Todos os campos são obrigatórios', 'error');
        return;
    }

    // Validações de conflito
    const conflitos = validateHorarioConflicts(currentSlot, professorId, salaId);

    if (conflitos.length > 0) {
        showAlert(`Conflitos detectados: ${conflitos.join(', ')}`, 'error');
        return;
    }

    try {
        // Encontra o ID do horário existente para este slot, se houver
        const existingHorario = toArray(appData.horarios).find(h =>
            h.idTurma === currentSlot.turmaId &&
            h.diaSemana === currentSlot.dia &&
            h.bloco === currentSlot.bloco
        );

        const horarioData = {
            diaSemana: currentSlot.dia,
            bloco: currentSlot.bloco,
            idTurma: currentSlot.turmaId,
            idDisciplina: disciplinaId,
            idProfessor: professorId,
            idSala: salaId,
            updatedAt: window.dbServerTimestamp // Para rastrear a última modificação
        };

        if (existingHorario) {
            // Atualiza o horário existente no Firebase
            const horarioRef = window.dbRef(window.firebaseDB, `horarios/${existingHorario.id}`);
            await window.dbSet(horarioRef, horarioData); // set para sobrescrever
        } else {
            // Adiciona um novo horário no Firebase
            const horarioListRef = window.dbRef(window.firebaseDB, 'horarios');
            await window.dbPush(horarioListRef, horarioData); // push para novo ID
        }

        closeHorarioModal();
        showAlert('Horário salvo com sucesso!', 'success');
        // renderHorariosGrid será chamado pelo listener do Firebase
    } catch (error) {
        console.error('Erro ao salvar horário:', error);
        showAlert('Erro ao salvar horário: ' + error.message, 'error');
    }
}

function validateHorarioConflicts(slot, professorId, salaId) {
    const conflitos = [];
    const horariosArray = toArray(appData.horarios);

    // Check professor conflict
    const professorConflict = horariosArray.find(h =>
        h.idProfessor === professorId &&
        h.diaSemana === slot.dia &&
        h.bloco === slot.bloco &&
        !(h.idTurma === slot.turmaId && h.diaSemana === slot.dia && h.bloco === slot.bloco) // Ignora o próprio slot se estiver editando
    );

    if (professorConflict) {
        const turmaConflito = appData.turmas[professorConflict.idTurma];
        conflitos.push(`Professor já alocado na turma ${turmaConflito?.nome || 'N/A'}`);
    }

    // Check sala conflict
    const salaConflict = horariosArray.find(h =>
        h.idSala === salaId &&
        h.diaSemana === slot.dia &&
        h.bloco === slot.bloco &&
        !(h.idTurma === slot.turmaId && h.diaSemana === slot.dia && h.bloco === slot.bloco) // Ignora o próprio slot se estiver editando
    );

    if (salaConflict) {
        const turmaConflito = appData.turmas[salaConflict.idTurma];
        conflitos.push(`Sala já ocupada pela turma ${turmaConflito?.nome || 'N/A'}`);
    }

    return conflitos;
}

// Delete horario (right-click or delete button)
async function deleteHorario(turmaId, dia, bloco) { // Adicionado 'async'
    if (confirm('Tem certeza que deseja excluir este horário?')) {
        try {
            const horarioToDelete = toArray(appData.horarios).find(h =>
                h.idTurma === turmaId &&
                h.diaSemana === dia &&
                h.bloco === bloco
            );

            if (horarioToDelete) {
                const horarioRef = window.dbRef(window.firebaseDB, `horarios/${horarioToDelete.id}`);
                await window.dbRemove(horarioRef);
                showAlert('Horário excluído com sucesso!', 'success');
                // renderHorariosGrid será chamado pelo listener do Firebase
            } else {
                showAlert('Horário não encontrado para exclusão.', 'warning');
            }
        } catch (error) {
            console.error('Erro ao excluir horário:', error);
            showAlert('Erro ao excluir horário: ' + error.message, 'error');
        }
    }
}

// Add right-click context menu for deleting horarios
document.addEventListener('contextmenu', (e) => {
    // Verifica se o clique foi dentro de um slot de horário ocupado
    const slotElement = e.target.closest('.horario-slot.ocupado');
    if (slotElement) {
        e.preventDefault(); // Impede o menu de contexto padrão do navegador

        const dia = slotElement.getAttribute('data-dia');
        const bloco = parseInt(slotElement.getAttribute('data-bloco'));
        const turmaId = document.getElementById('horario-turma').value; // Obtém a turma atualmente selecionada

        if (turmaId) { // Garante que uma turma esteja selecionada
            // Criar e exibir um menu de contexto customizado ou usar um prompt simples
            // Para simplicidade, vamos usar o confirm diretamente aqui, como você já fazia
            deleteHorario(turmaId, dia, bloco);
        } else {
            showAlert('Selecione uma turma para gerenciar horários.', 'info');
        }
    }
});

// script.js - PARTE 4.2/6 (Continuação da Parte 4.1)

// Impressão - Funcionalidades
function initImpressao() {
    const printTurmaBtn = document.getElementById('btn-print-turma');
    const printProfessorBtn = document.getElementById('btn-print-professor');
    
    printTurmaBtn.addEventListener('click', () => {
        const turmaId = document.getElementById('print-turma').value;
        if (!turmaId) {
            showAlert('Selecione uma turma', 'warning');
            return;
        }
        generateTurmaPrint(turmaId);
    });
    
    printProfessorBtn.addEventListener('click', () => {
        const professorId = document.getElementById('print-professor').value;
        if (!professorId) {
            showAlert('Selecione um professor', 'warning');
            return;
        }
        generateProfessorPrint(professorId);
    });
}

function generateTurmaPrint(turmaId) {
    const turma = appData.turmas[turmaId]; // Acessa pelo ID
    if (!turma) return;
    
    const preview = document.getElementById('print-preview');
    preview.classList.remove('hidden');
    
    const config = HORARIOS_CONFIG[turma.turno];
    // Horários são filtrados diretamente do appData.horarios, que já está atualizado pelo Firebase
    const horariosData = toArray(appData.horarios).filter(h => h.idTurma === turmaId);
    
    let html = `
        <div class="print-header">
            <h2>Horário de Aulas - ${turma.nome}</h2>
            <p>Curso: Ciências Econômicas - UESC</p>
            <p>Gerado em: ${formatDateTime(new Date())}</p>
        </div>
        
        <table class="grade-horarios print-table">
            <thead>
                <tr>
                    <th>Horário</th>
    `;
    
    if (turma.turno === 'matutino') {
        config.dias.forEach(dia => {
            html += `<th>${formatDiaName(dia)}</th>`;
        });
    } else {
        config.dias.forEach(dia => {
            html += `<th>${formatDiaName(dia)}</th>`;
        });
    }
    
    html += '</tr></thead><tbody>';
    
    if (turma.turno === 'matutino') {
        config.blocos.forEach(bloco => {
            html += `<tr><td class="horario-label">${bloco.inicio} - ${bloco.fim}</td>`;
            
            config.dias.forEach(dia => {
                const horario = horariosData.find(h => h.diaSemana === dia && h.bloco === bloco.id);
                html += '<td class="horario-cell">';
                
                if (horario) {
                    const disciplina = appData.disciplinas[horario.idDisciplina];
                    const professor = appData.professores[horario.idProfessor];
                    const sala = appData.salas[horario.idSala];
                    
                    html += `
                        <div class="print-horario-info">
                            <div class="disciplina">${disciplina?.nome || 'N/A'}</div>
                            <div class="professor">${professor?.nome || 'N/A'}</div>
                            <div class="sala">Sala: ${sala?.nome || 'N/A'}</div>
                        </div>
                    `;
                }
                
                html += '</td>';
            });
            
            html += '</tr>';
        });
    } else {
        // Noturno
        const maxBlocos = Math.max(...config.dias.map(dia => config.blocos[dia].length));
        
        for (let i = 0; i < maxBlocos; i++) {
            html += '<tr>';
            
            const horarios = config.dias.map(dia => {
                const bloco = config.blocos[dia][i];
                return bloco ? `${bloco.inicio} - ${bloco.fim}` : '';
            }).filter(h => h);
            
            const horarioUnico = [...new Set(horarios)];
            html += `<td class="horario-label">${horarioUnico.join(' / ')}</td>`;
            
            config.dias.forEach(dia => {
                const bloco = config.blocos[dia][i];
                html += '<td class="horario-cell">';
                
                if (bloco) {
                    const horario = horariosData.find(h => h.diaSemana === dia && h.bloco === bloco.id);
                    
                    if (horario) {
                        const disciplina = appData.disciplinas[horario.idDisciplina];
                        const professor = appData.professores[horario.idProfessor];
                        const sala = appData.salas[horario.idSala];
                        
                        html += `
                            <div class="print-horario-info">
                                <div class="disciplina">${disciplina?.nome || 'N/A'}</div>
                                <div class="professor">${professor?.nome || 'N/A'}</div>
                                <div class="sala">Sala: ${sala?.nome || 'N/A'}</div>
                            </div>
                        `;
                    }
                }
                
                html += '</td>';
            });
            
            html += '</tr>';
        }
    }
    
    html += '</tbody></table>';
    
    html += `
        <div class="print-footer">
            <button class="btn btn-primary" onclick="printPage()">
                <i class="fas fa-print"></i>
                Imprimir
            </button>
            <button class="btn btn-secondary" onclick="closePrintPreview()">
                <i class="fas fa-times"></i>
                Fechar
            </button>
        </div>
    `;
    
    preview.innerHTML = html;
    
    // Scroll to preview
    preview.scrollIntoView({ behavior: 'smooth' });
}

// script.js - PARTE 4.3/6 (Continuação da Parte 4.2)

function generateProfessorPrint(professorId) {
    const professor = appData.professores[professorId]; // Acessa pelo ID
    if (!professor) return;
    
    const preview = document.getElementById('print-preview');
    preview.classList.remove('hidden');
    
    const horariosData = toArray(appData.horarios).filter(h => h.idProfessor === professorId);
    
    // Group by turno
    const horariosPorTurno = {
        matutino: horariosData.filter(h => {
            const turma = appData.turmas[h.idTurma]; // Acessa pelo ID
            return turma?.turno === 'matutino';
        }),
        noturno: horariosData.filter(h => {
            const turma = appData.turmas[h.idTurma]; // Acessa pelo ID
            return turma?.turno === 'noturno';
        })
    };
    
    let html = `
        <div class="print-header">
            <h2>Horário do Professor - ${professor.nome}</h2>
            <p>Curso: Ciências Econômicas - UESC</p>
            <p>Email: ${professor.email || 'Não informado'}</p>
            <p>Gerado em: ${formatDateTime(new Date())}</p>
        </div>
    `;
    
    // Matutino
    if (horariosPorTurno.matutino.length > 0) {
        html += '<h3>Turno Matutino</h3>';
        html += generateProfessorTurnoTable('matutino', horariosPorTurno.matutino);
    }
    
    // Noturno
    if (horariosPorTurno.noturno.length > 0) {
        html += '<h3>Turno Noturno</h3>';
        html += generateProfessorTurnoTable('noturno', horariosPorTurno.noturno);
    }
    
    if (horariosData.length === 0) {
        html += '<p class="no-activity">Este professor não possui horários cadastrados.</p>';
    }
    
    html += `
        <div class="print-footer">
            <button class="btn btn-primary" onclick="printPage()">
                <i class="fas fa-print"></i>
                Imprimir
            </button>
            <button class="btn btn-secondary" onclick="closePrintPreview()">
                <i class="fas fa-times"></i>
                Fechar
            </button>
        </div>
    `;
    
    preview.innerHTML = html;
    preview.scrollIntoView({ behavior: 'smooth' });
}

function generateProfessorTurnoTable(turno, horariosData) {
    const config = HORARIOS_CONFIG[turno];
    
    let html = `
        <table class="grade-horarios print-table">
            <thead>
                <tr>
                    <th>Horário</th>
    `;
    
    config.dias.forEach(dia => {
        html += `<th>${formatDiaName(dia)}</th>`;
    });
    
    html += '</tr></thead><tbody>';
    
    if (turno === 'matutino') {
        config.blocos.forEach(bloco => {
            html += `<tr><td class="horario-label">${bloco.inicio} - ${bloco.fim}</td>`;
            
            config.dias.forEach(dia => {
                const horario = horariosData.find(h => h.diaSemana === dia && h.bloco === bloco.id);
                html += '<td class="horario-cell">';
                
                if (horario) {
                    const disciplina = appData.disciplinas[horario.idDisciplina];
                    const turma = appData.turmas[horario.idTurma];
                    const sala = appData.salas[horario.idSala];
                    
                    html += `
                        <div class="print-horario-info">
                            <div class="disciplina">${disciplina?.nome || 'N/A'}</div>
                            <div class="turma">${turma?.nome || 'N/A'}</div>
                            <div class="sala">Sala: ${sala?.nome || 'N/A'}</div>
                        </div>
                    `;
                }
                
                html += '</td>';
            });
            
            html += '</tr>';
        });
    } else {
        // Noturno
        const maxBlocos = Math.max(...config.dias.map(dia => config.blocos[dia].length));
        
        for (let i = 0; i < maxBlocos; i++) {
            html += '<tr>';
            
            const horarios = config.dias.map(dia => {
                const bloco = config.blocos[dia][i];
                return bloco ? `${bloco.inicio} - ${bloco.fim}` : '';
            }).filter(h => h);
            
            const horarioUnico = [...new Set(horarios)];
            html += `<td class="horario-label">${horarioUnico.join(' / ')}</td>`;
            
            config.dias.forEach(dia => {
                const bloco = config.blocos[dia][i];
                html += '<td class="horario-cell">';
                
                if (bloco) {
                    const horario = horariosData.find(h => h.diaSemana === dia && h.bloco === bloco.id);
                    
                    if (horario) {
                        const disciplina = appData.disciplinas[horario.idDisciplina];
                        const turma = appData.turmas[horario.idTurma];
                        const sala = appData.salas[horario.idSala];
                        
                        html += `
                            <div class="print-horario-info">
                                <div class="disciplina">${disciplina?.nome || 'N/A'}</div>
                                <div class="turma">${turma?.nome || 'N/A'}</div>
                                <div class="sala">Sala: ${sala?.nome || 'N/A'}</div>
                            </div>
                        `;
                    }
                }
                
                html += '</td>';
            });
            
            html += '</tr>';
        }
    }
    
    html += '</tbody></table>';
    return html;
}

// script.js - PARTE 4.4/6 (Continuação da Parte 4.3)

function printPage() {
    window.print();
}

function closePrintPreview() {
    const preview = document.getElementById('print-preview');
    preview.classList.add('hidden');
    preview.innerHTML = '';
}

// ============== INTEGRAÇÃO FIREBASE REALTIME DATABASE ===================
// Esta função substitui o antigo loadData() e a necessidade de saveData()
// Ela escuta mudanças nos nós do Firebase e atualiza o appData e a UI
function initFirebaseListeners() {
    // Listener para Professores
    window.dbOnValue(window.dbRef(window.firebaseDB, 'professores'), (snapshot) => {
        appData.professores = snapshot.val() || {};
        // Adiciona o 'id' de cada professor, que é a chave do Firebase
        Object.keys(appData.professores).forEach(key => {
            appData.professores[key].id = key;
        });
        renderProfessoresList();
        updateSelectOptions();
        updateDashboardCounts();
        console.log("Professores atualizados pelo Firebase.");
    });

    // Listener para Disciplinas
    window.dbOnValue(window.dbRef(window.firebaseDB, 'disciplinas'), (snapshot) => {
        appData.disciplinas = snapshot.val() || {};
        // Adiciona o 'id' de cada disciplina
        Object.keys(appData.disciplinas).forEach(key => {
            appData.disciplinas[key].id = key;
        });
        renderDisciplinasList();
        updateSelectOptions();
        updateDashboardCounts();
        console.log("Disciplinas atualizadas pelo Firebase.");
    });

    // Listener para Turmas
    window.dbOnValue(window.dbRef(window.firebaseDB, 'turmas'), (snapshot) => {
        appData.turmas = snapshot.val() || {};
        // Adiciona o 'id' de cada turma
        Object.keys(appData.turmas).forEach(key => {
            appData.turmas[key].id = key;
        });
        renderTurmasList();
        updateSelectOptions();
        updateDashboardCounts();
        console.log("Turmas atualizadas pelo Firebase.");
    });

    // Listener para Salas
    window.dbOnValue(window.dbRef(window.firebaseDB, 'salas'), (snapshot) => {
        appData.salas = snapshot.val() || {};
        // Adiciona o 'id' de cada sala
        Object.keys(appData.salas).forEach(key => {
            appData.salas[key].id = key;
        });
        renderSalasList();
        updateSelectOptions();
        updateDashboardCounts();
        console.log("Salas atualizadas pelo Firebase.");
    });

    // Listener para Horários
    window.dbOnValue(window.dbRef(window.firebaseDB, 'horarios'), (snapshot) => {
        appData.horarios = snapshot.val() || {};
        // Adiciona o 'id' de cada horário
        Object.keys(appData.horarios).forEach(key => {
            appData.horarios[key].id = key;
        });
        // Renderiza a grade de horários da turma atualmente selecionada, se houver
        const selectedTurmaId = document.getElementById('horario-turma').value;
        if (selectedTurmaId) {
            renderHorariosGrid(selectedTurmaId);
        }
        console.log("Horários atualizados pelo Firebase.");
    });

    console.log("Listeners do Firebase inicializados. Dados serão sincronizados automaticamente.");
}
// ========================================================================

// script.js - PARTE 4.5/6 (Continuação da Parte 4.4 - FINAL DO ARQUIVO)

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTabs();
    initProfessores();
    initDisciplinas();
    initTurmas();
    initSalas();
    initHorarios();
    initImpressao();
    
    // Inicializa os listeners do Firebase. Isso substitui o loadData()
    // O Firebase agora gerencia o carregamento inicial e as atualizações de dados.
    initFirebaseListeners(); 
    
    console.log('Sistema de Gestão de Horários inicializado com sucesso e conectado ao Firebase!');
});
