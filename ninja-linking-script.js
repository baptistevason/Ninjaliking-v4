// Variables globales
let selectedFootprints = [];
let projects = [];
let sites = [];
let editingSiteId = null;
let editingProjectId = null;
let db = null;
let isSupabaseConfigured = false;

// Initialiser Supabase
async function initSupabase() {
    try {
        // Credentials Supabase pré-configurés
        const defaultSupabaseUrl = 'https://kckdjgedbjjuhmcqcmpe.supabase.co';
        const defaultSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtja2RqZ2VkYmpqdWhtY3FjbXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMjQzMzMsImV4cCI6MjA3MzcwMDMzM30.-TUGbwjk_8OUGZKJdnU5CqyJHI8wm4o1j1LdzRnSKhg';
        
        // Vérifier si on a des credentials personnalisés
        const supabaseUrl = localStorage.getItem('supabase-url') || defaultSupabaseUrl;
        const supabaseKey = localStorage.getItem('supabase-anon-key') || defaultSupabaseKey;
        
        if (supabaseUrl && supabaseKey) {
            db = new SupabaseService();
            const success = await db.initialize(supabaseUrl, supabaseKey);
            if (success) {
                isSupabaseConfigured = true;
                console.log('✅ Supabase configuré');
                return true;
            }
        }
        
        console.log('ℹ️ Mode localStorage (pas de Supabase configuré)');
        return false;
    } catch (error) {
        console.error('❌ Erreur initialisation Supabase:', error);
        return false;
    }
}

// Configurer Supabase avec les credentials utilisateur
async function configureSupabase() {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; justify-content: center; align-items: center;">
            <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%;">
                <h3 style="margin-top: 0; color: #1a202c;">🚀 Configuration Supabase</h3>
                <p style="color: #4a5568; margin-bottom: 1rem;">Connectez votre base de données Supabase pour sauvegarder vos données dans le cloud.</p>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">URL du projet Supabase:</label>
                    <input type="url" id="supabaseUrl" placeholder="https://votre-projet.supabase.co" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px;" />
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Clé publique (anon key):</label>
                    <input type="text" id="supabaseKey" placeholder="eyJhbGc..." style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px;" />
                </div>
                <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button onclick="closeSupabaseModal()" style="padding: 0.75rem 1.5rem; background: #f7fafc; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer;">Annuler</button>
                    <button onclick="saveSupabaseConfig()" style="padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Configurer</button>
                </div>
            </div>
        </div>
    `;
    modal.id = 'supabaseConfigModal';
    document.body.appendChild(modal);
}

// Sauvegarder la configuration Supabase
async function saveSupabaseConfig() {
    const url = document.getElementById('supabaseUrl').value.trim();
    const key = document.getElementById('supabaseKey').value.trim();
    
    if (!url || !key) {
        alert('⚠️ Veuillez remplir tous les champs');
        return;
    }
    
    try {
        // Sauvegarder les credentials
        localStorage.setItem('supabase-url', url);
        localStorage.setItem('supabase-anon-key', key);
        
        // Initialiser Supabase
        db = new SupabaseService();
        const success = await db.initialize(url, key);
        
        if (success) {
            isSupabaseConfigured = true;
            closeSupabaseModal();
            
            // Proposer la migration des données existantes
            if (projects.length > 0 || sites.length > 0) {
                if (confirm('🔄 Voulez-vous migrer vos données existantes vers Supabase ?')) {
                    await migrateToSupabase();
                }
            }
            
            alert('✅ Supabase configuré avec succès !');
        } else {
            alert('❌ Erreur de configuration. Vérifiez vos credentials Supabase.');
        }
    } catch (error) {
        console.error('Erreur configuration Supabase:', error);
        alert('❌ Erreur de configuration. Vérifiez vos credentials Supabase.');
    }
}

// Fermer le modal de configuration
function closeSupabaseModal() {
    const modal = document.getElementById('supabaseConfigModal');
    if (modal) {
        modal.remove();
    }
}

// Migrer vers Supabase
async function migrateToSupabase() {
    if (!db || !isSupabaseConfigured) return;
    
    try {
        const success = await db.migrateFromLocalStorage(projects, sites);
        if (success) {
            alert('🎉 Migration réussie ! Vos données sont maintenant sauvegardées dans Supabase.');
            // Recharger depuis Supabase
            await loadData();
            renderProjects();
            updateProjectStats();
            renderSites();
        }
    } catch (error) {
        console.error('Erreur migration:', error);
        alert('❌ Erreur lors de la migration. Vos données restent en local.');
    }
}
let currentKeywords = [];
let currentProjectId = null;
let projectSpots = [];

// Données des footprints par catégorie
const footprintsData = {
    avis: [
        'site:trustpilot.com "avis [mot-clé]"',
        'site:google.com/maps "avis [mot-clé]"',
        'site:yelp.com "avis [mot-clé]"',
        'site:avis-verifies.com "avis [mot-clé]"',
        'site:verified-reviews.com "avis [mot-clé]"'
    ],
    commentaires: [
        'site:blog.fr "commentaire [mot-clé]"',
        'site:wordpress.com "commentaire [mot-clé]"',
        'site:medium.com "commentaire [mot-clé]"',
        'site:linkedin.com "commentaire [mot-clé]"',
        'site:reddit.com "commentaire [mot-clé]"'
    ],
    forums: [
        'site:forum.com "discussion [mot-clé]"',
        'site:jeuxvideo.com "forum [mot-clé]"',
        'site:hardware.fr "forum [mot-clé]"',
        'site:clubic.com "forum [mot-clé]"',
        'site:lesnumeriques.com "forum [mot-clé]"'
    ],
    articles: [
        'site:blog.fr "article invité [mot-clé]"',
        'site:medium.com "guest post [mot-clé]"',
        'site:wordpress.com "article invité [mot-clé]"',
        'site:linkedin.com "article [mot-clé]"',
        'site:viadeo.com "article [mot-clé]"'
    ]
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadData();
});

function initializeApp() {
    // Navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => switchPage(btn.dataset.page));
    });

    // Catégories de footprints
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => toggleCategory(card.dataset.category));
    });

    // Formulaires
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', saveProject);
        console.log('Événement submit attaché au formulaire de projet');
    } else {
        console.error('Formulaire de projet non trouvé');
    }

    const siteForm = document.getElementById('siteForm');
    if (siteForm) {
        siteForm.addEventListener('submit', saveSite);
    }

    // Filtres du catalogue
    const catalogSearch = document.getElementById('catalogSearch');
    if (catalogSearch) {
        catalogSearch.addEventListener('input', filterSites);
    }

    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', filterSites);
    }

    const themeFilter = document.getElementById('themeFilter');
    if (themeFilter) {
        themeFilter.addEventListener('change', filterSites);
    }

    // Sélection multiple
    const selectAllSites = document.getElementById('selectAllSites');
    if (selectAllSites) {
        selectAllSites.addEventListener('change', toggleSelectAllSites);
    }

    // Filtres des projets
    const projectSearch = document.getElementById('projectSearch');
    if (projectSearch) {
        projectSearch.addEventListener('input', filterProjects);
    }

    const objectiveFilter = document.getElementById('objectiveFilter');
    if (objectiveFilter) {
        objectiveFilter.addEventListener('change', filterProjects);
    }

    // Gestion des mots-clés
    const keywordInput = document.getElementById('keywordInput');
    if (keywordInput) {
        keywordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword();
            }
        });
    }

    // Formulaire d'ajout de spot
    const addSpotForm = document.getElementById('addSpotForm');
    if (addSpotForm) {
        addSpotForm.addEventListener('submit', saveNewSpot);
    }

    // Formulaire d'édition du projet
    const projectDetailForm = document.getElementById('projectDetailForm');
    if (projectDetailForm) {
        projectDetailForm.addEventListener('submit', saveProjectFromDetail);
    }

    // Gestion des mots-clés d'édition
    const editKeywordInput = document.getElementById('editKeywordInput');
    if (editKeywordInput) {
        editKeywordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addEditKeyword();
            }
        });
    }
}

async function switchPage(pageId) {
    // Désactiver tous les boutons de navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Masquer toutes les pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Activer le bouton et la page correspondants
    const activeBtn = document.querySelector(`[data-page="${pageId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    const activePage = document.getElementById(`${pageId}-page`);
    if (activePage) {
        activePage.classList.add('active');
    }

    // Charger les données de la page
    if (pageId === 'projects') {
        renderProjects();
    } else if (pageId === 'catalog') {
        renderSites();
    }
}

function toggleCategory(category) {
    const card = document.querySelector(`[data-category="${category}"]`);
    const footprintsSection = document.getElementById('footprintsSection');
    const footprintsList = document.getElementById('footprintsList');

    if (card.classList.contains('selected')) {
        // Désélectionner la catégorie
        card.classList.remove('selected');
        removeFootprintsByCategory(category);
    } else {
        // Sélectionner la catégorie
        card.classList.add('selected');
        addFootprintsByCategory(category);
    }

    // Afficher/masquer la section footprints
    if (selectedFootprints.length > 0) {
        footprintsSection.style.display = 'block';
        renderFootprints();
    } else {
        footprintsSection.style.display = 'none';
    }
}

function addFootprintsByCategory(category) {
    const footprints = footprintsData[category] || [];
    footprints.forEach(footprint => {
        if (!selectedFootprints.includes(footprint)) {
            selectedFootprints.push(footprint);
        }
    });
}

function removeFootprintsByCategory(category) {
    const footprints = footprintsData[category] || [];
    selectedFootprints = selectedFootprints.filter(footprint => !footprints.includes(footprint));
}

function renderFootprints() {
    const footprintsList = document.getElementById('footprintsList');
    footprintsList.innerHTML = '';

    selectedFootprints.forEach(footprint => {
        const item = document.createElement('div');
        item.className = 'footprint-item';
        item.innerHTML = `
            <input type="checkbox" class="footprint-checkbox">
            <span class="footprint-text">${footprint}</span>
        `;
        footprintsList.appendChild(item);
    });
}

function getCheckedFootprints() {
    const checkedBoxes = document.querySelectorAll('.footprint-checkbox:checked');
    const checkedFootprints = [];
    
    checkedBoxes.forEach(checkbox => {
        const footprintText = checkbox.nextElementSibling.textContent;
        checkedFootprints.push(footprintText);
    });
    
    return checkedFootprints;
}

function selectAllFootprints() {
    const checkboxes = document.querySelectorAll('.footprint-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
}

function deselectAllFootprints() {
    const checkboxes = document.querySelectorAll('.footprint-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

function generateSearches() {
    const keywordInput = document.getElementById('keywordInput');
    const keyword = keywordInput.value.trim();

    if (!keyword) {
        alert('Veuillez entrer un mot-clé');
        return;
    }

    // Récupérer seulement les footprints cochés
    const checkedFootprints = getCheckedFootprints();
    
    if (checkedFootprints.length === 0) {
        alert('Veuillez cocher au moins un footprint à utiliser');
        return;
    }

    // Remplacer [mot-clé] par le mot-clé réel
    const searches = checkedFootprints.map(footprint => 
        footprint.replace(/\[mot-clé\]/g, keyword)
    );

    // Ouvrir les recherches dans de nouveaux onglets
    searches.forEach(search => {
        const url = `https://www.google.com/search?q=${encodeURIComponent(search)}`;
        window.open(url, '_blank');
    });
}

function testSerpOperators() {
    const keywordInput = document.getElementById('serpKeyword');
    const keyword = keywordInput.value.trim();

    if (!keyword) {
        alert('Veuillez entrer un mot-clé');
        return;
    }

    const selectedOperators = getSelectedSerpOperators();
    if (selectedOperators.length === 0) {
        alert('Veuillez sélectionner au moins un opérateur');
        return;
    }

    // Générer les recherches avec les opérateurs
    selectedOperators.forEach(operator => {
        let search = keyword;
        if (operator.includes(':')) {
            search = `${operator} ${keyword}`;
        } else {
            search = `${operator}:"${keyword}"`;
        }
        
        const url = `https://www.google.com/search?q=${encodeURIComponent(search)}`;
        window.open(url, '_blank');
    });
}

function getSelectedSerpOperators() {
    const checkboxes = document.querySelectorAll('.operator-item input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.dataset.operator);
}

// Gestion des projets
function openProjectModal(projectId = null) {
    const modal = document.getElementById('projectModal');
    const title = document.getElementById('modalProjectTitle');
    const form = document.getElementById('projectForm');

    editingProjectId = projectId;

    if (projectId) {
        title.textContent = 'Modifier le projet';
        const project = projects.find(p => p.id === projectId);
        if (project) {
            document.getElementById('projectName').value = project.name;
            document.getElementById('projectUrl').value = project.url;
            document.getElementById('projectObjective').value = project.objective;
            document.getElementById('projectTraffic').value = project.traffic || '';
            document.getElementById('projectTrustFlow').value = project.trustFlow || '';
            document.getElementById('projectTTF').value = project.ttf || '';
            document.getElementById('projectReferringDomains').value = project.referringDomains || '';
            
            // Charger les mots-clés
            currentKeywords = project.keywords || [];
            renderKeywords();
        }
    } else {
        title.textContent = 'Nouveau Projet';
        form.reset();
        currentKeywords = [];
        renderKeywords();
    }

    modal.style.display = 'block';
}

function closeProjectModal() {
    document.getElementById('projectModal').style.display = 'none';
    editingProjectId = null;
    currentKeywords = [];
}

// Gestion des mots-clés
function addKeyword() {
    const input = document.getElementById('keywordInput');
    const keyword = input.value.trim();
    
    if (keyword && !currentKeywords.includes(keyword)) {
        currentKeywords.push(keyword);
        input.value = '';
        renderKeywords();
    }
}

function removeKeyword(keyword) {
    currentKeywords = currentKeywords.filter(k => k !== keyword);
    renderKeywords();
}

function renderKeywords() {
    const container = document.getElementById('keywordsTags');
    if (!container) return;
    
    container.innerHTML = '';
    
    currentKeywords.forEach(keyword => {
        const tag = document.createElement('div');
        tag.className = 'keyword-tag';
        tag.innerHTML = `
            <span>${keyword}</span>
            <button type="button" class="remove-keyword" onclick="removeKeyword('${keyword}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(tag);
    });
}

async function saveProject(e) {
    e.preventDefault();
    console.log('saveProject appelée');

    const name = document.getElementById('projectName').value.trim();
    const url = document.getElementById('projectUrl').value.trim();
    const objective = document.getElementById('projectObjective').value;
    const traffic = parseInt(document.getElementById('projectTraffic').value) || 0;
    const trustFlow = parseInt(document.getElementById('projectTrustFlow').value) || 0;
    const ttf = document.getElementById('projectTTF').value;
    const referringDomains = parseInt(document.getElementById('projectReferringDomains').value) || 0;

    console.log('Données du projet:', { name, url, objective, traffic, trustFlow, ttf, referringDomains });

    if (!name || !url || !objective) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }

    const projectData = {
        name,
        url,
        objective,
        traffic,
        trustFlow,
        ttf,
        referringDomains,
        keywords: currentKeywords,
        updatedAt: new Date().toISOString()
    };

    try {
        if (isSupabaseConfigured && db) {
            // Sauvegarder avec Supabase
            if (editingProjectId) {
                const updatedProject = await db.updateProject(editingProjectId, projectData);
                const projectIndex = projects.findIndex(p => p.id === editingProjectId);
                if (projectIndex !== -1) {
                    projects[projectIndex] = updatedProject;
                }
                console.log('✅ Projet mis à jour dans Supabase');
            } else {
                const newProject = await db.saveProject(projectData);
                projects.push(newProject);
                console.log('✅ Projet créé dans Supabase');
            }
        } else {
            // Fallback localStorage
            if (editingProjectId) {
                const projectIndex = projects.findIndex(p => p.id === editingProjectId);
                if (projectIndex !== -1) {
                    projects[projectIndex] = { ...projects[projectIndex], ...projectData };
                }
            } else {
                const newId = Math.max(...projects.map(p => p.id), 0) + 1;
                projects.push({ 
                    id: newId, 
                    ...projectData,
                    createdAt: new Date().toISOString()
                });
            }
            await saveData();
            console.log('📦 Projet sauvegardé en localStorage');
        }

        renderProjects();
        updateProjectStats();
        closeProjectModal();
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde projet:', error);
        alert('Erreur lors de la sauvegarde du projet: ' + error.message);
    }
}

async function deleteProject(projectId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
        try {
            if (isSupabaseConfigured && db) {
                await db.deleteProject(projectId);
                console.log('✅ Projet supprimé de Supabase');
            }
            
            projects = projects.filter(p => p.id !== projectId);
            await saveData();
            renderProjects();
            updateProjectStats();
            
        } catch (error) {
            console.error('❌ Erreur suppression projet:', error);
            alert('Erreur lors de la suppression du projet: ' + error.message);
        }
    }
}

function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    const projectCount = document.getElementById('projectCount');
    if (!grid) {
        console.error('projectsGrid non trouvé');
        return;
    }

    const filteredProjects = getFilteredProjects();
    
    if (projectCount) {
        projectCount.textContent = filteredProjects.length;
    }

    grid.innerHTML = '';

    if (filteredProjects.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #64748b;">
                <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3>Aucun projet</h3>
                <p>Créez votre premier projet pour commencer</p>
            </div>
        `;
        return;
    }

    filteredProjects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        
        const trustFlowClass = getTrustFlowClass(project.trustFlow || 0);
        const trustFlowWidth = Math.min(project.trustFlow || 0, 100);
        const objectiveClass = project.objective === 'SEO' ? 'seo' : 'reputation';
        
        card.innerHTML = `
            <div class="project-checkbox-container">
                <input type="checkbox" class="project-checkbox" data-project-id="${project.id}" onchange="handleProjectSelection()">
            </div>
            <div class="project-header">
                <div class="project-info">
                    <h3 class="project-title">${project.name}</h3>
                    <a href="${project.url}" target="_blank" class="project-url">
                        ${project.url} <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
                <div class="project-actions">
                    <button class="project-action-btn edit" onclick="openProjectModal(${project.id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="project-action-btn delete" onclick="deleteProject(${project.id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="project-details">
                <div class="project-detail">
                    <span class="project-detail-label">Objectif</span>
                    <span class="project-objective ${objectiveClass}">${project.objective === 'SEO' ? 'Référencement' : project.objective}</span>
                </div>
                <div class="project-detail">
                    <span class="project-detail-label">Trafic</span>
                    <span class="project-detail-value">${(project.traffic || 0).toLocaleString()}</span>
                </div>
                <div class="project-detail">
                    <span class="project-detail-label">Trust Flow</span>
                    <div class="project-trust-flow">
                        <div class="project-trust-flow-bar">
                            <div class="project-trust-flow-fill ${trustFlowClass}" style="width: ${trustFlowWidth}%"></div>
                        </div>
                        <span class="project-trust-flow-value">${project.trustFlow || 0}</span>
                    </div>
                </div>
                <div class="project-detail">
                    <span class="project-detail-label">TTF</span>
                    <span class="project-detail-value">${project.ttf || 'N/A'}</span>
                </div>
                <div class="project-detail">
                    <span class="project-detail-label">Domaines référents</span>
                    <span class="project-detail-value">${project.referringDomains || 0}</span>
                </div>
            </div>
            ${project.keywords && project.keywords.length > 0 ? `
                <div class="project-keywords">
                    <div class="project-keywords-label">Mots-clés à travailler</div>
                    <div class="project-keywords-list">
                        ${project.keywords.map(keyword => `
                            <span class="project-keyword-tag">${keyword}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            <button class="project-spots-btn" onclick="viewProjectSpots(${project.id})">
                Voir le projet
            </button>
        `;
        grid.appendChild(card);
    });
}

function getFilteredProjects() {
    const searchElement = document.getElementById('projectSearch');
    const filterElement = document.getElementById('objectiveFilter');
    
    const searchTerm = searchElement ? searchElement.value.toLowerCase() : '';
    const objectiveFilter = filterElement ? filterElement.value : '';

    return projects.filter(project => {
        const matchesSearch = !searchTerm || 
                             project.name.toLowerCase().includes(searchTerm) ||
                             project.url.toLowerCase().includes(searchTerm);
        const matchesObjective = !objectiveFilter || project.objective === objectiveFilter;
        
        return matchesSearch && matchesObjective;
    });
}

function filterProjects() {
    renderProjects();
}

function updateProjectStats() {
    const totalCount = projects.length;
    const seoCount = projects.filter(p => p.objective === 'SEO').length;
    const reputationCount = projects.filter(p => p.objective === 'E-Réputation').length;
    
    // Calculer les projets de ce mois (simulation)
    const currentMonth = new Date().getMonth();
    const monthlyCount = projects.filter(p => {
        const projectDate = new Date(p.createdAt || Date.now());
        return projectDate.getMonth() === currentMonth;
    }).length;

    console.log('Statistiques projets:', { totalCount, seoCount, reputationCount, monthlyCount });

    const totalProjectsCount = document.getElementById('totalProjectsCount');
    const seoProjectsCount = document.getElementById('seoProjectsCount');
    const reputationProjectsCount = document.getElementById('reputationProjectsCount');
    const monthlyProjectsCount = document.getElementById('monthlyProjectsCount');

    if (totalProjectsCount) {
        totalProjectsCount.textContent = totalCount;
        console.log('Total projets mis à jour:', totalCount);
    } else {
        console.error('totalProjectsCount non trouvé');
    }
    
    if (seoProjectsCount) seoProjectsCount.textContent = seoCount;
    if (reputationProjectsCount) reputationProjectsCount.textContent = reputationCount;
    if (monthlyProjectsCount) monthlyProjectsCount.textContent = monthlyCount;
}

function viewProjectSpots(projectId) {
    currentProjectId = projectId;
    loadProjectDetail(projectId);
    switchPage('project-detail');
}

// Gestion de la page de détail du projet
function loadProjectDetail(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Mettre à jour le header
    document.getElementById('projectDetailTitle').textContent = project.name;
    const urlElement = document.getElementById('projectDetailUrl');
    urlElement.href = project.url;
    urlElement.innerHTML = `${project.url} <i class="fas fa-external-link-alt"></i>`;
    
    // Mettre à jour l'objectif
    const objectiveElement = document.getElementById('projectDetailObjective');
    objectiveElement.textContent = project.objective === 'SEO' ? 'Référencement' : project.objective;
    objectiveElement.className = `project-objective-tag ${project.objective === 'SEO' ? 'seo' : 'reputation'}`;

    // Mettre à jour les mots-clés
    const keywordsContainer = document.getElementById('projectDetailKeywords');
    if (project.keywords && project.keywords.length > 0) {
        keywordsContainer.innerHTML = `
            <div class="project-detail-keywords-label">Mots-clés à travailler</div>
            <div class="project-detail-keywords-list">
                ${project.keywords.map(keyword => `
                    <span class="project-detail-keyword-tag">${keyword}</span>
                `).join('')}
            </div>
        `;
    } else {
        keywordsContainer.innerHTML = '';
    }

    // Mettre à jour la date de mise à jour
    const updatedDate = project.updatedAt || project.createdAt;
    const dateElement = document.getElementById('projectDetailUpdatedDate');
    if (updatedDate) {
        const date = new Date(updatedDate);
        dateElement.textContent = date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } else {
        dateElement.textContent = 'Jamais';
    }

    // Mettre à jour les KPIs
    document.getElementById('projectDetailTraffic').textContent = (project.traffic || 0).toLocaleString();
    document.getElementById('projectDetailTrustFlow').textContent = project.trustFlow || 0;
    document.getElementById('projectDetailReferringDomains').textContent = project.referringDomains || 0;
    
    // Charger les spots du projet
    loadProjectSpots(projectId);
}

function loadProjectSpots(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
        projectSpots = [];
        renderProjectSpots();
        return;
    }

    // Charger les spots spécifiques du projet
    if (project.spots && Array.isArray(project.spots)) {
        projectSpots = project.spots;
    } else {
        // Si le projet n'a pas encore de spots, créer un tableau vide
        projectSpots = [];
        if (!project.spots) {
            project.spots = [];
        }
    }

    renderProjectSpots();
}

function renderProjectSpots() {
    const tbody = document.getElementById('projectSpotsTableBody');
    const spotsCount = document.getElementById('projectSpotsCount');
    const kpiSpotsCount = document.getElementById('projectDetailSpotsCount');
    
    if (!tbody) return;

    spotsCount.textContent = projectSpots.length;
    if (kpiSpotsCount) kpiSpotsCount.textContent = projectSpots.length;

    tbody.innerHTML = '';

    if (projectSpots.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem; color: #64748b;">
                    <i class="fas fa-globe" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Aucun spot associé à ce projet</p>
                </td>
            </tr>
        `;
        return;
    }

    projectSpots.forEach(spot => {
        const row = document.createElement('tr');
        const trustFlowClass = getTrustFlowClass(spot.trustFlow);
        const trustFlowWidth = Math.min(spot.trustFlow, 100);
        
        row.innerHTML = `
            <td>
                <div>
                    <a href="${spot.url}" target="_blank" class="project-spot-url">
                        ${spot.url} <i class="fas fa-external-link-alt"></i>
                    </a>
                    <div class="project-spot-domain">${spot.url}</div>
                </div>
            </td>
            <td><span class="project-spot-type">${spot.type}</span></td>
            <td><span class="project-spot-theme">${spot.theme}</span></td>
            <td>
                <div class="project-spot-trust-flow">
                    <div class="project-spot-trust-flow-bar">
                        <div class="project-spot-trust-flow-fill ${trustFlowClass}" style="width: ${trustFlowWidth}%"></div>
                    </div>
                    <span class="project-spot-trust-flow-value">${spot.trustFlow}</span>
                </div>
            </td>
            <td><span class="project-spot-traffic">${spot.traffic.toLocaleString()}</span></td>
            <td>
                <div class="project-spot-status">
                    <select class="project-spot-status-select" onchange="updateSpotStatus(${spot.id}, this.value)">
                        <option value="A publier" ${spot.status === 'A publier' ? 'selected' : ''}>A publier</option>
                        <option value="Publié" ${spot.status === 'Publié' ? 'selected' : ''}>Publié</option>
                        <option value="Rejeté" ${spot.status === 'Rejeté' ? 'selected' : ''}>Rejeté</option>
                    </select>
                </div>
            </td>
            <td>
                <div class="project-spot-actions">
                    <button class="project-spot-action-btn delete" onclick="removeSpotFromProject(${spot.id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function updateSpotStatus(spotId, newStatus) {
    const spot = projectSpots.find(s => s.id === spotId);
    if (spot) {
        spot.status = newStatus;
        
        // Sauvegarder dans les données du projet
        const project = projects.find(p => p.id === currentProjectId);
        if (project && project.spots) {
            const projectSpot = project.spots.find(s => s.id === spotId);
            if (projectSpot) {
                projectSpot.status = newStatus;
                await saveData();
                console.log(`Statut du spot ${spotId} mis à jour: ${newStatus}`);
            }
        }
    }
}

async function removeSpotFromProject(spotId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce spot du projet ?')) {
        // Supprimer du tableau local
        projectSpots = projectSpots.filter(s => s.id !== spotId);
        
        // Supprimer des données du projet
        const project = projects.find(p => p.id === currentProjectId);
        if (project && project.spots) {
            project.spots = project.spots.filter(s => s.id !== spotId);
            await saveData();
        }
        
        renderProjectSpots();
        console.log(`Spot ${spotId} supprimé du projet`);
    }
}

// Gestion du modal d'ajout de spots
function openAddSpotModal() {
    const modal = document.getElementById('addSpotModal');
    const form = document.getElementById('addSpotForm');
    
    // Réinitialiser le formulaire
    form.reset();
    
    modal.style.display = 'block';
}

function closeAddSpotModal() {
    document.getElementById('addSpotModal').style.display = 'none';
}

async function saveNewSpot(e) {
    e.preventDefault();

    const url = document.getElementById('spotUrl').value.trim();
    const type = document.getElementById('spotType').value;
    const theme = document.getElementById('spotTheme').value;
    const trustFlow = parseInt(document.getElementById('spotTrustFlow').value) || 0;
    const traffic = parseInt(document.getElementById('spotTraffic').value) || 0;
    const status = document.getElementById('spotStatus').value;

    if (!url) {
        alert('Veuillez saisir une URL');
        return;
    }

    const newSpot = {
        id: Math.max(...projectSpots.map(s => s.id), 0) + 1,
        siteId: null, // Pas de référence au catalogue
        projectId: currentProjectId,
        url: url,
        type: type,
        theme: theme,
        traffic: traffic,
        trustFlow: trustFlow,
        status: status
    };

    projectSpots.push(newSpot);
    
    // Sauvegarder les spots dans les données du projet
    const project = projects.find(p => p.id === currentProjectId);
    if (project) {
        if (!project.spots) {
            project.spots = [];
        }
        project.spots.push(newSpot);
        await saveData();
    }
    
    renderProjectSpots();
    closeAddSpotModal();
    
    console.log(`Nouveau spot ajouté au projet: ${url}`);
}

// Gestion de l'édition du projet depuis la page de détail
let editKeywords = [];

function toggleProjectEdit() {
    const form = document.getElementById('projectEditForm');
    const editBtn = document.getElementById('projectEditBtn');
    
    if (form.style.display === 'none') {
        // Ouvrir le formulaire d'édition
        const project = projects.find(p => p.id === currentProjectId);
        if (project) {
            // Remplir le formulaire avec les données actuelles
            document.getElementById('editProjectName').value = project.name;
            document.getElementById('editProjectUrl').value = project.url;
            document.getElementById('editProjectObjective').value = project.objective;
            document.getElementById('editProjectTraffic').value = project.traffic || '';
            document.getElementById('editProjectTrustFlow').value = project.trustFlow || '';
            document.getElementById('editProjectTTF').value = project.ttf || '';
            document.getElementById('editProjectReferringDomains').value = project.referringDomains || '';
            
            // Charger les mots-clés
            editKeywords = [...(project.keywords || [])];
            renderEditKeywords();
        }
        
        form.style.display = 'block';
        editBtn.innerHTML = '<i class="fas fa-times"></i> Annuler';
        editBtn.onclick = cancelProjectEdit;
    } else {
        // Fermer le formulaire d'édition
        cancelProjectEdit();
    }
}

function cancelProjectEdit() {
    const form = document.getElementById('projectEditForm');
    const editBtn = document.getElementById('projectEditBtn');
    
    form.style.display = 'none';
    editBtn.innerHTML = '<i class="fas fa-edit"></i> Modifier le projet';
    editBtn.onclick = toggleProjectEdit;
    editKeywords = [];
}

function addEditKeyword() {
    const input = document.getElementById('editKeywordInput');
    const keyword = input.value.trim();
    
    if (keyword && !editKeywords.includes(keyword)) {
        editKeywords.push(keyword);
        input.value = '';
        renderEditKeywords();
    }
}

function removeEditKeyword(keyword) {
    editKeywords = editKeywords.filter(k => k !== keyword);
    renderEditKeywords();
}

function renderEditKeywords() {
    const container = document.getElementById('editKeywordsTags');
    if (!container) return;
    
    container.innerHTML = '';
    
    editKeywords.forEach(keyword => {
        const tag = document.createElement('div');
        tag.className = 'keyword-tag';
        tag.innerHTML = `
            <span>${keyword}</span>
            <button type="button" class="remove-keyword" onclick="removeEditKeyword('${keyword}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(tag);
    });
}

function saveProjectFromDetail(e) {
    e.preventDefault();

    const name = document.getElementById('editProjectName').value.trim();
    const url = document.getElementById('editProjectUrl').value.trim();
    const objective = document.getElementById('editProjectObjective').value;
    const traffic = parseInt(document.getElementById('editProjectTraffic').value) || 0;
    const trustFlow = parseInt(document.getElementById('editProjectTrustFlow').value) || 0;
    const ttf = document.getElementById('editProjectTTF').value;
    const referringDomains = parseInt(document.getElementById('editProjectReferringDomains').value) || 0;

    if (!name || !url || !objective) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }

    const projectData = {
        name,
        url,
        objective,
        traffic,
        trustFlow,
        ttf,
        referringDomains,
        keywords: editKeywords,
        updatedAt: new Date().toISOString()
    };

    const projectIndex = projects.findIndex(p => p.id === currentProjectId);
    if (projectIndex !== -1) {
        projects[projectIndex] = { ...projects[projectIndex], ...projectData };
        saveData();
        
        // Recharger l'affichage du projet
        loadProjectDetail(currentProjectId);
        
        // Fermer le formulaire d'édition
        cancelProjectEdit();
        
        console.log('Projet mis à jour depuis la page de détail');
    }
}

// Gestion des sites
function openSiteModal(siteId = null) {
    const modal = document.getElementById('siteModal');
    const title = document.getElementById('modalSiteTitle');
    const form = document.getElementById('siteForm');

    editingSiteId = siteId;

    if (siteId) {
        title.textContent = 'Modifier le site';
        const site = sites.find(s => s.id === siteId);
        if (site) {
            document.getElementById('siteUrl').value = site.url;
            document.getElementById('siteType').value = site.type;
            document.getElementById('siteTheme').value = site.theme;
            document.getElementById('siteTraffic').value = site.traffic || '';
            document.getElementById('siteTrustFlow').value = site.trustFlow || '';
            document.getElementById('siteTTF').value = site.ttf || '';
            document.getElementById('siteFollow').value = site.follow || 'Oui';
        }
    } else {
        title.textContent = 'Nouveau Site';
        form.reset();
    }

    modal.style.display = 'block';
}

// Fonction pour éditer un site (alias pour openSiteModal)
function editSite(siteId) {
    openSiteModal(siteId);
}

function closeSiteModal() {
    document.getElementById('siteModal').style.display = 'none';
    editingSiteId = null;
}

async function saveSite(e) {
    e.preventDefault();

    const url = document.getElementById('siteUrl').value.trim();
    const type = document.getElementById('siteType').value;
    const theme = document.getElementById('siteTheme').value;
    const traffic = parseInt(document.getElementById('siteTraffic').value) || 0;
    const trustFlow = parseInt(document.getElementById('siteTrustFlow').value) || 0;
    const ttf = document.getElementById('siteTTF').value;
    const follow = document.getElementById('siteFollow').value;

    if (!url) {
        alert('Veuillez entrer une URL');
        return;
    }

    const siteData = {
        url,
        type,
        theme,
        traffic,
        trustFlow,
        ttf,
        follow
    };

    try {
        if (isSupabaseConfigured && db) {
            // Sauvegarder avec Supabase (même logique que pour les projets)
            if (editingSiteId) {
                // Pour la mise à jour, on doit d'abord obtenir le site existant
                const updatedSite = await db.saveSite({ id: editingSiteId, ...siteData });
                const siteIndex = sites.findIndex(s => s.id === editingSiteId);
                if (siteIndex !== -1) {
                    sites[siteIndex] = updatedSite;
                }
                console.log('✅ Site mis à jour dans Supabase');
            } else {
                // Nouvelle création
                const newSite = await db.saveSite(siteData);
                sites.push(newSite);
                console.log('✅ Site créé dans Supabase');
            }
            
            // Recharger TOUS les sites depuis Supabase pour être sûr
            sites = await db.getSites();
            console.log(`🔄 ${sites.length} sites rechargés depuis Supabase`);
            
        } else {
            // Fallback localStorage
            if (editingSiteId) {
                const siteIndex = sites.findIndex(s => s.id === editingSiteId);
                if (siteIndex !== -1) {
                    sites[siteIndex] = { ...sites[siteIndex], ...siteData };
                }
            } else {
                const newId = Math.max(...sites.map(s => s.id), 0) + 1;
                sites.push({ id: newId, ...siteData });
            }
            await saveData();
            console.log('📦 Site sauvegardé en localStorage');
        }

        renderSites();
        setupCheckboxListeners();
        closeSiteModal();
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde site:', error);
        alert('Erreur lors de la sauvegarde du site: ' + error.message);
    }
}

async function deleteSite(siteId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce site ?')) {
        try {
            if (isSupabaseConfigured && db) {
                await db.deleteSite(siteId);
                console.log('✅ Site supprimé de Supabase');
                
                // Recharger TOUS les sites depuis Supabase pour être sûr
                sites = await db.getSites();
                console.log(`🔄 ${sites.length} sites rechargés depuis Supabase`);
            } else {
                sites = sites.filter(s => s.id !== siteId);
                await saveData();
            }
            
            renderSites();
            setupCheckboxListeners();
            
        } catch (error) {
            console.error('❌ Erreur suppression site:', error);
            alert('Erreur lors de la suppression du site: ' + error.message);
        }
    }
}

function renderSites() {
    const tbody = document.getElementById('catalogTableBody');
    const sitesCount = document.getElementById('sitesCount');
    if (!tbody) return;

    const filteredSites = getFilteredSites();
    sitesCount.textContent = filteredSites.length;

    tbody.innerHTML = '';

    if (filteredSites.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 3rem; color: #64748b;">
                    <i class="fas fa-database" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Aucun site dans le catalogue</p>
                </td>
            </tr>
        `;
        return;
    }

    filteredSites.forEach(site => {
        const row = document.createElement('tr');
        const trustFlowClass = getTrustFlowClass(site.trustFlow);
        const trustFlowWidth = Math.min(site.trustFlow, 100);
        
        row.innerHTML = `
            <td><input type="checkbox" class="site-checkbox" data-site-id="${site.id}" onchange="handleSiteSelection()"></td>
            <td>
                <a href="${site.url}" target="_blank" class="site-url">
                    ${site.url} <i class="fas fa-external-link-alt"></i>
                </a>
            </td>
            <td><span class="type-tag">${site.type}</span></td>
            <td>${site.theme}</td>
            <td>${site.traffic.toLocaleString()}</td>
            <td>
                <div class="trust-flow-container">
                    <div class="trust-flow-bar">
                        <div class="trust-flow-fill ${trustFlowClass}" style="width: ${trustFlowWidth}%"></div>
                    </div>
                    <span class="trust-flow-value">${site.trustFlow}</span>
                </div>
            </td>
            <td><span class="ttf-tag">${site.ttf}</span></td>
            <td>${site.follow}</td>
            <td>
                <div class="table-actions">
                    <button class="action-btn edit" onclick="editSite(${site.id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteSite(${site.id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getTrustFlowClass(trustFlow) {
    if (trustFlow >= 70) return 'high';
    if (trustFlow >= 40) return 'medium';
    return 'low';
}

function getFilteredSites() {
    const searchTerm = document.getElementById('catalogSearch')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';
    const themeFilter = document.getElementById('themeFilter')?.value || '';

    return sites.filter(site => {
        const matchesSearch = site.url.toLowerCase().includes(searchTerm);
        const matchesType = !typeFilter || site.type === typeFilter;
        const matchesTheme = !themeFilter || site.theme === themeFilter;
        
        return matchesSearch && matchesType && matchesTheme;
    });
}

function filterSites() {
    renderSites();
}

function toggleSelectAllSites() {
    const selectAll = document.getElementById('selectAllSites');
    const checkboxes = document.querySelectorAll('.site-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

// Fonctions d'import/export
// Variables pour l'import
let csvData = [];

// Variables pour les sélections en masse
let selectedSites = [];
let selectedProjects = [];
let bulkEditMode = false;

// Gérer la sélection des sites
function handleSiteSelection() {
    const checkboxes = document.querySelectorAll('.site-checkbox:checked');
    selectedSites = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-site-id')));
    
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (selectedSites.length > 0) {
        bulkActions.style.display = 'flex';
        selectedCount.textContent = selectedSites.length;
    } else {
        bulkActions.style.display = 'none';
    }
    
    // Mettre à jour la case "Tout sélectionner"
    const selectAllCheckbox = document.getElementById('selectAllSites');
    const allCheckboxes = document.querySelectorAll('.site-checkbox');
    
    if (selectedSites.length === allCheckboxes.length && allCheckboxes.length > 0) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else if (selectedSites.length > 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
}

// Configurer les event listeners des cases à cocher
function setupCheckboxListeners() {
    // Case "Tout sélectionner"
    const selectAllCheckbox = document.getElementById('selectAllSites');
    if (selectAllCheckbox) {
        selectAllCheckbox.onchange = function() {
            const checkboxes = document.querySelectorAll('.site-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = this.checked;
            });
            handleSiteSelection();
        };
    }
    
    // Cases individuelles
    const checkboxes = document.querySelectorAll('.site-checkbox');
    checkboxes.forEach(cb => {
        cb.onchange = handleSiteSelection;
    });
}

// Actions en masse
function editSelectedSites() {
    if (selectedSites.length === 0) {
        alert('Aucun site sélectionné');
        return;
    }
    
    if (selectedSites.length === 1) {
        // Modifier un seul site
        editSite(selectedSites[0]);
    } else {
        // Modification en masse (à implémenter)
        alert(`Modification en masse de ${selectedSites.length} sites en cours de développement.`);
    }
}

async function deleteSelectedSites() {
    if (selectedSites.length === 0) {
        alert('Aucun site sélectionné');
        return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedSites.length} site(s) ?`)) {
        try {
            if (isSupabaseConfigured && db) {
                await db.deleteSites(selectedSites);
                console.log(`✅ ${selectedSites.length} sites supprimés de Supabase`);
                
                // Recharger TOUS les sites depuis Supabase pour être sûr
                sites = await db.getSites();
                console.log(`🔄 ${sites.length} sites rechargés depuis Supabase`);
            } else {
                selectedSites.forEach(siteId => {
                    const index = sites.findIndex(s => s.id === siteId);
                    if (index !== -1) {
                        sites.splice(index, 1);
                    }
                });
                await saveData();
            }
            
            renderSites();
            setupCheckboxListeners();
            clearSelection();
            
            alert(`${selectedSites.length} site(s) supprimé(s) avec succès.`);
            
        } catch (error) {
            console.error('❌ Erreur suppression sites en masse:', error);
            alert('Erreur lors de la suppression: ' + error.message);
        }
    }
}

function showAddToProjectModal() {
    // Vérifier que le modal existe
    const modal = document.getElementById('addToProjectModal');
    if (!modal) {
        alert('Erreur: Interface non disponible. Rechargez la page.');
        return;
    }
    
    if (selectedSites.length === 0) {
        alert('Aucun site sélectionné. Veuillez d\'abord sélectionner des sites dans le catalogue.');
        return;
    }
    
    // Vérifier qu'il y a des projets
    if (projects.length === 0) {
        alert('Aucun projet disponible. Veuillez d\'abord créer un projet.');
        return;
    }
    
    // Vérifier que l'élément select existe
    const selectProject = document.getElementById('selectProject');
    if (!selectProject) {
        alert('Erreur: Interface de sélection non disponible. Rechargez la page.');
        return;
    }
    
    // Populer la liste des projets
    selectProject.innerHTML = '<option value="">Choisir un projet...</option>';
    
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = `${project.name} (${project.objective === 'SEO' ? 'Référencement' : project.objective})`;
        selectProject.appendChild(option);
    });
    
    // Afficher l'aperçu des sites sélectionnés
    try {
        showSelectedSitesPreview();
    } catch (error) {
        console.error('Erreur lors de l\'affichage de l\'aperçu:', error);
    }
    
    // Ouvrir le modal
    modal.style.display = 'block';
}

function showSelectedSitesPreview() {
    const preview = document.getElementById('selectedSitesPreview');
    const selectedSitesData = sites.filter(site => selectedSites.includes(site.id));
    
    preview.innerHTML = `
        <h4>Sites sélectionnés (${selectedSitesData.length})</h4>
        ${selectedSitesData.map(site => `
            <div class="selected-site-item">
                <div class="selected-site-info">
                    <div class="selected-site-url">${extractDomain(site.url)}</div>
                    <div class="selected-site-meta">${site.type} • ${site.theme} • TF ${site.trustFlow || 0}</div>
                </div>
                <div class="selected-site-badge">${site.type}</div>
            </div>
        `).join('')}
    `;
}

async function addSitesToProject() {
    const projectId = parseInt(document.getElementById('selectProject').value);
    if (!projectId) {
        alert('Veuillez sélectionner un projet');
        return;
    }
    
    // Récupérer les données des sites sélectionnés
    const selectedSitesData = sites.filter(site => selectedSites.includes(site.id));
    
    if (selectedSitesData.length === 0) {
        alert('Aucun site valide sélectionné');
        return;
    }
    
    // Trouver le projet
    const project = projects.find(p => p.id === projectId);
    if (!project) {
        alert('Projet introuvable');
        return;
    }
    
    // Ajouter les sites au projet comme spots
    let addedCount = 0;
    
    // Initialiser les spots du projet si nécessaire
    if (!project.spots) {
        project.spots = [];
    }
    
    selectedSitesData.forEach(site => {
        const spot = {
            id: Date.now() + Math.random() + addedCount,
            projectId: projectId,
            url: site.url,
            type: site.type,
            theme: site.theme,
            trustFlow: site.trustFlow || 0,
            traffic: site.traffic || 0,
            status: 'À contacter'
        };
        
        // Ajouter aux données du projet
        project.spots.push(spot);
        addedCount++;
    });
    
    // Sauvegarder les données
    await saveData();
    
    
    closeAddToProjectModal();
    clearSelection();
    
    // Mettre à jour l'affichage si on est sur la page de détail du projet
    if (typeof currentProjectId !== 'undefined' && currentProjectId === projectId) {
        loadProjectSpots(projectId);
    }
    
    alert(`${addedCount} site(s) ajouté(s) au projet "${project.name}" avec succès.`);
}

function closeAddToProjectModal() {
    document.getElementById('addToProjectModal').style.display = 'none';
}

function clearSelection() {
    selectedSites = [];
    const checkboxes = document.querySelectorAll('.site-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = false;
    });
    const selectAllCheckbox = document.getElementById('selectAllSites');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
    document.getElementById('bulkActions').style.display = 'none';
}

// Gérer la sélection des projets
function handleProjectSelection() {
    const checkboxes = document.querySelectorAll('.project-checkbox:checked');
    selectedProjects = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-project-id')));
    
    const bulkActions = document.getElementById('projectBulkActions');
    const selectedCount = document.getElementById('selectedProjectsCount');
    
    if (selectedProjects.length > 0) {
        bulkActions.style.display = 'flex';
        selectedCount.textContent = selectedProjects.length;
    } else {
        bulkActions.style.display = 'none';
    }
    
    // Mettre à jour l'apparence des cartes sélectionnées
    document.querySelectorAll('.project-card').forEach(card => {
        const checkbox = card.querySelector('.project-checkbox');
        if (checkbox && checkbox.checked) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
}

// Actions en masse pour les projets
function deleteSelectedProjects() {
    if (selectedProjects.length === 0) {
        alert('Aucun projet sélectionné');
        return;
    }
    
    const projectNames = selectedProjects.map(projectId => {
        const project = projects.find(p => p.id === projectId);
        return project ? project.name : 'Projet inconnu';
    }).join(', ');
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedProjects.length} projet(s) ?\n\nProjets : ${projectNames}\n\nCette action est irréversible.`)) {
        selectedProjects.forEach(projectId => {
            const index = projects.findIndex(p => p.id === projectId);
            if (index !== -1) {
                projects.splice(index, 1);
            }
        });
        
        saveData();
        renderProjects();
        updateProjectStats();
        clearProjectSelection();
        
        alert(`${selectedProjects.length} projet(s) supprimé(s) avec succès.`);
    }
}

function clearProjectSelection() {
    selectedProjects = [];
    const checkboxes = document.querySelectorAll('.project-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = false;
    });
    const bulkActions = document.getElementById('projectBulkActions');
    if (bulkActions) {
        bulkActions.style.display = 'none';
    }
    
    // Retirer la classe selected de toutes les cartes
    document.querySelectorAll('.project-card').forEach(card => {
        card.classList.remove('selected');
    });
}

function selectAllProjects() {
    const checkboxes = document.querySelectorAll('.project-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
    });
    
    handleProjectSelection();
}

function openImportModal() {
    const modal = document.getElementById('importModal');
    modal.style.display = 'block';
    
    // Réinitialiser le modal
    document.getElementById('importFile').value = '';
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('importBtn').disabled = true;
    csvData = [];
}

function closeImportModal() {
    document.getElementById('importModal').style.display = 'none';
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    // Détection plus robuste des types de fichiers
    const isCSV = file.type === 'text/csv' || 
                  file.type === 'application/csv' ||
                  fileName.endsWith('.csv');
                  
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    file.type === 'application/vnd.ms-excel' ||
                    fileName.endsWith('.xlsx') || 
                    fileName.endsWith('.xls');

    console.log('Fichier sélectionné:', {
        name: file.name,
        type: file.type,
        isCSV: isCSV,
        isExcel: isExcel
    });

    if (!isCSV && !isExcel) {
        alert('Veuillez sélectionner un fichier CSV ou Excel valide.\n\nFormats acceptés:\n- CSV: .csv\n- Excel: .xlsx, .xls');
        return;
    }

    const reader = new FileReader();
    
    if (isCSV) {
        console.log('Traitement du fichier CSV...');
        reader.onload = function(e) {
            try {
                parseCSV(e.target.result);
            } catch (error) {
                alert('Erreur lors de la lecture du fichier CSV: ' + error.message);
            }
        };
        reader.readAsText(file, 'UTF-8');
    } else if (isExcel) {
        console.log('Traitement du fichier Excel...');
        reader.onload = function(e) {
            try {
                parseExcel(e.target.result);
            } catch (error) {
                alert('Erreur lors de la lecture du fichier Excel: ' + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
    }
}

function parseExcel(excelBuffer) {
    try {
        // Vérifier que XLSX est disponible
        if (typeof XLSX === 'undefined') {
            alert('Erreur: La bibliothèque XLSX n\'est pas chargée. Rechargez la page et réessayez.');
            return;
        }
        
        // Lire le fichier Excel
        const workbook = XLSX.read(excelBuffer, { type: 'array' });
        
        // Chercher la feuille avec les données (priorité: "Sites", puis première feuille)
        let sheetName = workbook.SheetNames.find(name => 
            name.toLowerCase().includes('site') || name.toLowerCase().includes('catalogue')
        ) || workbook.SheetNames[0];
        
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            alert('Aucune feuille trouvée dans le fichier Excel.');
            return;
        }

        // Convertir en JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
            alert('Le fichier Excel doit contenir au moins un en-tête et une ligne de données.\nLignes trouvées: ' + jsonData.length);
            return;
        }

        // Récupérer les en-têtes (première ligne)
        const headers = jsonData[0].map(h => h ? h.toString().trim() : '');
        
        const expectedHeaders = ['URL', 'Type', 'Thématique', 'Trafic', 'Trust Flow', 'TTF', 'Follow'];
        
        // Vérification plus flexible des en-têtes
        const hasRequiredHeaders = expectedHeaders.slice(0, 3).every(header => 
            headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
        );
        
        if (!hasRequiredHeaders) {
            alert('Format Excel invalide.\n\nEn-têtes trouvés: ' + headers.join(', ') + 
                  '\n\nEn-têtes attendus: ' + expectedHeaders.join(', ') +
                  '\n\nAssurez-vous que les 3 premières colonnes sont: URL, Type, Thématique');
            return;
        }

        // Parser les données
        csvData = [];
        let validRows = 0;
        
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row && row.length >= 3) {
                const site = {
                    url: row[0] ? row[0].toString().trim() : '',
                    type: row[1] ? row[1].toString().trim() : '',
                    theme: row[2] ? row[2].toString().trim() : '',
                    traffic: parseInt(row[3]) || 0,
                    trustFlow: parseInt(row[4]) || 0,
                    ttf: row[5] ? row[5].toString().trim() : '',
                    follow: row[6] ? row[6].toString().trim() : ''
                };
                
                // Validation basique
                if (site.url && site.type && site.theme) {
                    csvData.push(site);
                    validRows++;
                }
            }
        }


        if (csvData.length === 0) {
            alert('Aucune donnée valide trouvée dans le fichier Excel.\n\nVérifiez que:\n- Les 3 premières colonnes contiennent URL, Type, Thématique\n- Il y a au moins une ligne de données\n- Les cellules ne sont pas vides');
            return;
        }

        showImportPreview();
        
    } catch (error) {
        console.error('Erreur parsing Excel:', error);
        alert('Erreur lors du traitement du fichier Excel:\n' + error.message + 
              '\n\nConseil: Essayez de sauvegarder votre fichier Excel en format CSV et importez le CSV à la place.');
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        alert('Le fichier CSV doit contenir au moins un en-tête et une ligne de données.');
        return;
    }

    // Parser la première ligne (en-têtes)
    const headers = parseCSVLine(lines[0]);
    const expectedHeaders = ['URL', 'Type', 'Thématique', 'Trafic', 'Trust Flow', 'TTF', 'Follow'];
    
    // Vérifier que les en-têtes correspondent
    if (!headers.every(header => expectedHeaders.includes(header.trim()))) {
        alert('Format CSV invalide. Les colonnes attendues sont: ' + expectedHeaders.join(', '));
        return;
    }

    // Parser les données
    csvData = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 7) {
            const site = {
                url: values[0].trim(),
                type: values[1].trim(),
                theme: values[2].trim(),
                traffic: parseInt(values[3]) || 0,
                trustFlow: parseInt(values[4]) || 0,
                ttf: values[5].trim(),
                follow: values[6].trim()
            };
            
            // Validation basique
            if (site.url && site.type && site.theme) {
                csvData.push(site);
            }
        }
    }

    if (csvData.length === 0) {
        alert('Aucune donnée valide trouvée dans le fichier CSV.');
        return;
    }

    showImportPreview();
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

function showImportPreview() {
    const preview = document.getElementById('importPreview');
    const tbody = document.getElementById('previewTableBody');
    const stats = document.getElementById('importStats');
    
    // Afficher le tableau de prévisualisation
    tbody.innerHTML = '';
    csvData.slice(0, 10).forEach(site => { // Limiter à 10 lignes pour l'aperçu
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${site.url}</td>
            <td>${site.type}</td>
            <td>${site.theme}</td>
            <td>${site.traffic.toLocaleString()}</td>
            <td>${site.trustFlow}</td>
            <td>${site.ttf}</td>
            <td>${site.follow}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Afficher les statistiques
    const totalSites = csvData.length;
    const types = [...new Set(csvData.map(s => s.type))];
    const themes = [...new Set(csvData.map(s => s.theme))];
    
    stats.innerHTML = `
        <div class="stat-item">
            <span>Total des sites :</span>
            <span>${totalSites}</span>
        </div>
        <div class="stat-item">
            <span>Types :</span>
            <span>${types.join(', ')}</span>
        </div>
        <div class="stat-item">
            <span>Thématiques :</span>
            <span>${themes.join(', ')}</span>
        </div>
        <div class="stat-item">
            <span>Prêt à importer :</span>
            <span>${totalSites} sites</span>
        </div>
    `;
    
    preview.style.display = 'block';
    document.getElementById('importBtn').disabled = false;
}



async function importCSVData() {
    if (csvData.length === 0) {
        alert('Aucune donnée à importer.');
        return;
    }

    let importedCount = 0;
    let skippedCount = 0;

    csvData.forEach(siteData => {
        // Vérifier si le site existe déjà
        const existingSite = sites.find(s => s.url === siteData.url);
        if (existingSite) {
            skippedCount++;
            return;
        }

        // Créer un nouveau site
        const newSite = {
            id: Math.max(...sites.map(s => s.id), 0) + 1,
            url: siteData.url,
            type: siteData.type,
            theme: siteData.theme,
            traffic: siteData.traffic,
            trustFlow: siteData.trustFlow,
            ttf: siteData.ttf,
            follow: siteData.follow
        };

        sites.push(newSite);
        importedCount++;
    });

    // Sauvegarder et recharger
    if (isSupabaseConfigured && db) {
        try {
            // Importer en masse avec Supabase
            await db.saveSites(csvData.map(siteData => ({
                url: siteData.url,
                type: siteData.type,
                theme: siteData.theme,
                traffic: siteData.traffic,
                trustFlow: siteData.trustFlow,
                ttf: siteData.ttf,
                follow: siteData.follow
            })));
            
            // Recharger TOUS les sites depuis Supabase
            sites = await db.getSites();
            console.log(`🔄 ${sites.length} sites rechargés depuis Supabase après import`);
        } catch (error) {
            console.error('❌ Erreur import Supabase:', error);
            await saveData();
        }
    } else {
        await saveData();
    }
    
    renderSites();
    setupCheckboxListeners();
    closeImportModal();

    // Afficher le résultat
    alert(`Import terminé !\n${importedCount} sites importés\n${skippedCount} sites ignorés (déjà existants)`);
    
}

function downloadCSVModel() {
    const csvContent = 'URL,Type,Thématique,Trafic,Trust Flow,TTF,Follow\n' +
                      'https://exemple.com,Forum,Business,10000,50,Business,Oui\n' +
                      'https://test.fr,Blog,Technologie,5000,30,Technologie,Non';
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modele-catalogue.csv';
    link.click();
}

function downloadExcelModel() {
    // Créer un workbook Excel avec plusieurs feuilles
    const workbook = {
        SheetNames: ['Sites', 'Types', 'Thématiques', 'Instructions'],
        Sheets: {
            'Sites': {
                '!ref': 'A1:G6',
                A1: { v: 'URL', t: 's' },
                B1: { v: 'Type', t: 's' },
                C1: { v: 'Thématique', t: 's' },
                D1: { v: 'Trafic', t: 's' },
                E1: { v: 'Trust Flow', t: 's' },
                F1: { v: 'TTF', t: 's' },
                G1: { v: 'Follow', t: 's' },
                A2: { v: 'https://exemple-forum.com', t: 's' },
                B2: { v: 'Forum', t: 's' },
                C2: { v: 'Business', t: 's' },
                D2: { v: 15000, t: 'n' },
                E2: { v: 65, t: 'n' },
                F2: { v: 'Business', t: 's' },
                G2: { v: 'Oui', t: 's' },
                A3: { v: 'https://blog-techno.fr', t: 's' },
                B3: { v: 'Blog', t: 's' },
                C3: { v: 'Technologie', t: 's' },
                D3: { v: 8500, t: 'n' },
                E3: { v: 45, t: 'n' },
                F3: { v: 'Technologie', t: 's' },
                G3: { v: 'Oui', t: 's' },
                A4: { v: 'https://annuaire-sites.net', t: 's' },
                B4: { v: 'Annuaire', t: 's' },
                C4: { v: 'Généraliste', t: 's' },
                D4: { v: 25000, t: 'n' },
                E4: { v: 80, t: 'n' },
                F4: { v: 'Généraliste', t: 's' },
                G4: { v: 'Oui', t: 's' },
                A5: { v: 'https://magazine-mode.com', t: 's' },
                B5: { v: 'Magazine', t: 's' },
                C5: { v: 'Mode', t: 's' },
                D5: { v: 12000, t: 'n' },
                E5: { v: 55, t: 'n' },
                F5: { v: 'Mode', t: 's' },
                G5: { v: 'Non', t: 's' },
                A6: { v: 'https://sport-news.fr', t: 's' },
                B6: { v: 'Actualités', t: 's' },
                C6: { v: 'Sport', t: 's' },
                D6: { v: 30000, t: 'n' },
                E6: { v: 70, t: 'n' },
                F6: { v: 'Sport', t: 's' },
                G6: { v: 'Oui', t: 's' }
            },
            'Types': {
                '!ref': 'A1:B8',
                A1: { v: 'Type', t: 's' },
                B1: { v: 'Description', t: 's' },
                A2: { v: 'Forum', t: 's' },
                B2: { v: 'Sites de discussion et forums', t: 's' },
                A3: { v: 'Blog', t: 's' },
                B3: { v: 'Blogs personnels ou d\'entreprise', t: 's' },
                A4: { v: 'Annuaire', t: 's' },
                B4: { v: 'Annuaire de sites web', t: 's' },
                A5: { v: 'Magazine', t: 's' },
                B5: { v: 'Magazines en ligne', t: 's' },
                A6: { v: 'Actualités', t: 's' },
                B6: { v: 'Sites d\'actualités', t: 's' },
                A7: { v: 'E-commerce', t: 's' },
                B7: { v: 'Boutiques en ligne', t: 's' },
                A8: { v: 'Autre', t: 's' },
                B8: { v: 'Autres types de sites', t: 's' }
            },
            'Thématiques': {
                '!ref': 'A1:B6',
                A1: { v: 'Thématique', t: 's' },
                B1: { v: 'Description', t: 's' },
                A2: { v: 'Business', t: 's' },
                B2: { v: 'Entreprise et business', t: 's' },
                A3: { v: 'Technologie', t: 's' },
                B3: { v: 'Tech et innovation', t: 's' },
                A4: { v: 'Généraliste', t: 's' },
                B4: { v: 'Contenu général', t: 's' },
                A5: { v: 'Mode', t: 's' },
                B5: { v: 'Fashion et style', t: 's' },
                A6: { v: 'Sport', t: 's' },
                B6: { v: 'Sports et fitness', t: 's' }
            },
            'Instructions': {
                '!ref': 'A1:D15',
                A1: { v: 'INSTRUCTIONS D\'IMPORT', t: 's' },
                A3: { v: '1. Feuille "Sites"', t: 's' },
                B3: { v: 'Remplissez cette feuille avec vos sites', t: 's' },
                A4: { v: '2. Colonnes obligatoires', t: 's' },
                B4: { v: 'URL, Type, Thématique', t: 's' },
                A5: { v: '3. Colonnes optionnelles', t: 's' },
                B5: { v: 'Trafic, Trust Flow, TTF, Follow', t: 's' },
                A6: { v: '4. Types disponibles', t: 's' },
                B6: { v: 'Voir feuille "Types"', t: 's' },
                A7: { v: '5. Thématiques disponibles', t: 's' },
                B7: { v: 'Voir feuille "Thématiques"', t: 's' },
                A8: { v: '6. Format URL', t: 's' },
                B8: { v: 'https://exemple.com', t: 's' },
                A9: { v: '7. Format Trafic', t: 's' },
                B9: { v: 'Nombre entier (ex: 10000)', t: 's' },
                A10: { v: '8. Format Trust Flow', t: 's' },
                B10: { v: 'Nombre entier 0-100 (ex: 50)', t: 's' },
                A11: { v: '9. Format TTF', t: 's' },
                B11: { v: 'Business, Technologie, Généraliste, Mode, Sport', t: 's' },
                A12: { v: '10. Format Follow', t: 's' },
                B12: { v: 'Oui ou Non', t: 's' },
                A13: { v: '11. Sauvegarde', t: 's' },
                B13: { v: 'Sauvegardez en CSV pour l\'import', t: 's' },
                A14: { v: '12. Import', t: 's' },
                B14: { v: 'Utilisez le bouton "Importer" dans l\'outil', t: 's' }
            }
        }
    };

    // Convertir en format Excel binaire
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Créer un blob et télécharger
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Modele_Sites_NinjaLinking.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
}

function exportToExcel() {
    if (sites.length === 0) {
        alert('Aucun site à exporter');
        return;
    }

    // Créer un workbook Excel avec les sites
    const workbook = {
        SheetNames: ['Catalogue_Sites'],
        Sheets: {
            'Catalogue_Sites': {
                '!ref': 'A1:G' + (sites.length + 1),
                A1: { v: 'URL', t: 's' },
                B1: { v: 'Type', t: 's' },
                C1: { v: 'Thématique', t: 's' },
                D1: { v: 'Trafic', t: 's' },
                E1: { v: 'Trust Flow', t: 's' },
                F1: { v: 'TTF', t: 's' },
                G1: { v: 'Follow', t: 's' }
            }
        }
    };

    // Ajouter les données des sites
    sites.forEach((site, index) => {
        const row = index + 2;
        workbook.Sheets['Catalogue_Sites'][`A${row}`] = { v: site.url, t: 's' };
        workbook.Sheets['Catalogue_Sites'][`B${row}`] = { v: site.type, t: 's' };
        workbook.Sheets['Catalogue_Sites'][`C${row}`] = { v: site.theme, t: 's' };
        workbook.Sheets['Catalogue_Sites'][`D${row}`] = { v: site.traffic || 0, t: 'n' };
        workbook.Sheets['Catalogue_Sites'][`E${row}`] = { v: site.trustFlow || 0, t: 'n' };
        workbook.Sheets['Catalogue_Sites'][`F${row}`] = { v: site.ttf || '', t: 's' };
        workbook.Sheets['Catalogue_Sites'][`G${row}`] = { v: site.follow || '', t: 's' };
    });

    // Convertir en format Excel binaire
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Créer un blob et télécharger
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Catalogue_Sites_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
}

// Sauvegarde et chargement des données
async function saveData() {
    if (isSupabaseConfigured && db) {
        try {
            console.log('💾 Sauvegarde automatique dans Supabase...');
            // Note: Les données sont sauvegardées directement lors des opérations CRUD
            return true;
        } catch (error) {
            console.error('❌ Erreur sauvegarde Supabase:', error);
            // Fallback vers localStorage
            saveDataToLocalStorage();
        }
    } else {
        // Mode localStorage
        saveDataToLocalStorage();
    }
}

function saveDataToLocalStorage() {
    localStorage.setItem('ninjalinking-projects', JSON.stringify(projects));
    localStorage.setItem('ninjalinking-sites', JSON.stringify(sites));
}

async function loadData() {
    console.log('📂 Chargement des données...');
    
    if (isSupabaseConfigured && db) {
        try {
            // Charger depuis Supabase
            projects = await db.getProjects();
            sites = await db.getSites();
            console.log(`✅ Données chargées depuis Supabase: ${projects.length} projets, ${sites.length} sites`);
            
            // Mettre à jour l'affichage après chargement Supabase
            setTimeout(() => {
                renderProjects();
                renderSites();
                updateProjectStats();
            }, 100);
            
            return;
        } catch (error) {
            console.error('❌ Erreur chargement Supabase:', error);
            // Fallback vers localStorage
        }
    }
    
    // Chargement depuis localStorage
    const savedProjects = localStorage.getItem('ninjalinking-projects');
    if (savedProjects) {
        projects = JSON.parse(savedProjects);
        
        // Migration des anciens projets vers le nouveau format
        projects = projects.map(project => ({
            id: project.id,
            name: project.name || 'Projet sans nom',
            url: project.url || '',
            objective: project.objective || 'SEO',
            traffic: project.traffic || 0,
            trustFlow: project.trustFlow || 0,
            ttf: project.ttf || 'Business',
            referringDomains: project.referringDomains || 0,
            keywords: project.keywords || [],
            createdAt: project.createdAt || new Date().toISOString(),
            updatedAt: project.updatedAt || project.createdAt || new Date().toISOString()
        }));
        
        saveData(); // Sauvegarder les projets migrés
    } else {
        projects = [];
    }

    const savedSites = localStorage.getItem('ninjalinking-sites');
    if (savedSites) {
        sites = JSON.parse(savedSites);
    } else {
        sites = [];
    }
}

// Fermer les modals en cliquant à l'extérieur
window.addEventListener('click', function(event) {
    const projectModal = document.getElementById('projectModal');
    const siteModal = document.getElementById('siteModal');
    const addSpotModal = document.getElementById('addSpotModal');
    const importModal = document.getElementById('importModal');
    const addToProjectModal = document.getElementById('addToProjectModal');
    
    if (event.target === projectModal) {
        closeProjectModal();
    }
    
    if (event.target === siteModal) {
        closeSiteModal();
    }
    
    if (event.target === addSpotModal) {
        closeAddSpotModal();
    }
    
    if (event.target === importModal) {
        closeImportModal();
    }
    
    if (event.target === addToProjectModal) {
        closeAddToProjectModal();
    }
});

// Gestionnaire d'erreur global pour les extensions de navigateur
window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('Could not establish connection')) {
        console.warn('Erreur d\'extension de navigateur détectée (ignorée):', event.message);
        return true; // Empêche l'affichage de l'erreur
    }
});

// Gestionnaire pour les promesses rejetées (extensions)
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes('Could not establish connection')) {
        console.warn('Erreur d\'extension de navigateur détectée (ignorée):', event.reason.message);
        event.preventDefault(); // Empêche l'affichage de l'erreur
    }
});

// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    // Initialiser Supabase en premier
    await initSupabase();
    
    // Puis charger les données
    await loadData();
    
    // Enfin, rendre l'interface
    renderProjects();
    updateProjectStats();
    renderSites();
    setupCheckboxListeners();
    
    // Ajouter un bouton de configuration Supabase si pas configuré
    if (!isSupabaseConfigured) {
        addSupabaseConfigButton();
    }
});

// Ajouter un bouton pour configurer Supabase
function addSupabaseConfigButton() {
    const header = document.querySelector('.header');
    if (header) {
        const configBtn = document.createElement('button');
        configBtn.innerHTML = '🚀 Configurer Supabase';
        configBtn.className = 'btn btn-success';
        configBtn.style.marginLeft = 'auto';
        configBtn.onclick = configureSupabase;
        header.appendChild(configBtn);
    }
}

// Fonction pour actualiser les sites depuis Supabase
async function refreshSitesFromSupabase() {
    if (!isSupabaseConfigured || !db) {
        alert('⚠️ Supabase non configuré. Utilisation des données locales.');
        return;
    }

    try {
        console.log('🔄 Actualisation des sites depuis Supabase...');
        
        // Charger depuis Supabase
        sites = await db.getSites();
        console.log(`✅ ${sites.length} sites chargés depuis Supabase`);
        
        // Mettre à jour l'affichage
        renderSites();
        setupCheckboxListeners();
        
        // Notification visuelle
        const btn = event.target.closest('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Actualisé';
        btn.style.background = '#28a745';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erreur actualisation sites:', error);
        alert('Erreur lors de l\'actualisation: ' + error.message);
    }
}