document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const ruleForm = document.getElementById('rule-form');
    const ruleModal = new bootstrap.Modal(document.getElementById('ruleModal'));
    const ruleModalLabel = document.getElementById('ruleModalLabel');
    const tableBody = document.getElementById('rules-table-body');

    const STORAGE_KEY = 'calidad_reglas';

    // --- Renderizado y KPIs ---
    const render = () => {
        renderTable();
        updateKPIs();
    };

    const renderTable = () => {
        const rules = dataManager.getData(STORAGE_KEY);
        tableBody.innerHTML = '';

        if (rules.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay reglas de calidad definidas.</td></tr>';
            return;
        }

        rules.forEach(rule => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><code>${rule.asset}</code></td>
                <td>${rule.dimension}</td>
                <td>${rule.description}</td>
                <td><span class="badge bg-${rule.status === 'Activa' ? 'success' : 'secondary'}">${rule.status}</span></td>
                <td><span class="badge rounded-pill bg-primary">${rule.score}%</span></td>
                <td>
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${rule.id}" data-bs-toggle="tooltip" title="Editar"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${rule.id}" data-bs-toggle="tooltip" title="Eliminar"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        uiManager.initializeTooltips();
    };

    const updateKPIs = () => {
        const rules = dataManager.getData(STORAGE_KEY).filter(r => r.status === 'Activa');
        const dimensions = ['Completitud', 'Validez', 'Unicidad', 'Consistencia'];

        dimensions.forEach(dim => {
            const rulesForDim = rules.filter(r => r.dimension === dim);
            let avgScore = 0;
            if (rulesForDim.length > 0) {
                const totalScore = rulesForDim.reduce((sum, rule) => sum + parseFloat(rule.score), 0);
                avgScore = (totalScore / rulesForDim.length).toFixed(1);
            }
            document.getElementById(`kpi-${dim.toLowerCase()}`).textContent = `${avgScore}%`;
        });
    };

    // --- Formulario (Crear/Editar) ---
    ruleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!ruleForm.checkValidity()) {
            e.stopPropagation();
            ruleForm.classList.add('was-validated');
            return;
        }

        const ruleId = document.getElementById('rule-id').value;
        const rule = {
            id: ruleId ? parseInt(ruleId) : null,
            asset: document.getElementById('rule-asset').value,
            description: document.getElementById('rule-description').value,
            dimension: document.getElementById('rule-dimension').value,
            status: document.getElementById('rule-status').value,
            score: document.getElementById('rule-score').value,
        };

        if (rule.id) {
            dataManager.updateItem(STORAGE_KEY, rule);
            uiManager.showToast('Regla actualizada con éxito.', 'success');
        } else {
            dataManager.addItem(STORAGE_KEY, rule);
            uiManager.showToast('Regla creada con éxito.', 'success');
        }

        ruleModal.hide();
        render();
    });

    // --- Abrir Modal (Añadir vs Editar) ---
    document.getElementById('ruleModal').addEventListener('show.bs.modal', (e) => {
        ruleForm.classList.remove('was-validated');
        ruleForm.reset();
        document.getElementById('rule-id').value = '';

        const button = e.relatedTarget;
        if (button && button.classList.contains('edit-btn')) {
            ruleModalLabel.textContent = 'Editar Regla de Calidad';
            const ruleId = button.getAttribute('data-id');
            const rule = dataManager.getData(STORAGE_KEY).find(r => r.id == ruleId);
            if (rule) {
                document.getElementById('rule-id').value = rule.id;
                document.getElementById('rule-asset').value = rule.asset;
                document.getElementById('rule-description').value = rule.description;
                document.getElementById('rule-dimension').value = rule.dimension;
                document.getElementById('rule-status').value = rule.status;
                document.getElementById('rule-score').value = rule.score;
            }
        } else {
            ruleModalLabel.textContent = 'Nueva Regla de Calidad';
        }
    });

    // --- Eliminación ---
    tableBody.addEventListener('click', (e) => {
        const target = e.target.closest('.delete-btn');
        if (target) {
            const ruleId = target.getAttribute('data-id');
            if (confirm('¿Estás seguro de que quieres eliminar esta regla?')) {
                dataManager.deleteItem(STORAGE_KEY, ruleId);
                uiManager.showToast('Regla eliminada.', 'danger');
                render();
            }
        } else if (e.target.closest('.edit-btn')) {
            const editButton = e.target.closest('.edit-btn');
            const modalTrigger = new bootstrap.Modal(document.getElementById('ruleModal'));
            document.getElementById('ruleModal')._trigger = editButton;
            modalTrigger.show(editButton);
        }
    });

    // --- Inicialización ---
    render();
});
