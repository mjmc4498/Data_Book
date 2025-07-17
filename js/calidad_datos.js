document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const ruleForm = document.getElementById('rule-form');
    const ruleModal = new bootstrap.Modal(document.getElementById('ruleModal'));
    const ruleModalLabel = document.getElementById('ruleModalLabel');
    const tableBody = document.getElementById('rules-table-body');
    const filterForm = document.getElementById('filter-form');

    // Botones
    const importBtn = document.getElementById('import-excel-btn');
    const importInput = document.getElementById('import-excel-input');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    const STORAGE_KEY = 'calidad_reglas';

    // --- Renderizado y KPIs ---
    const render = () => {
        renderTable();
        updateKPIs();
    };

    const renderTable = () => {
        const filters = getFilters();
        let rules = dataManager.getData(STORAGE_KEY);

        rules = rules.filter(rule => {
            const searchMatch = filters.search === '' || rule.asset.toLowerCase().includes(filters.search) || rule.description.toLowerCase().includes(filters.search);
            const dimensionMatch = filters.dimension === '' || rule.dimension === filters.dimension;
            const statusMatch = filters.status === '' || rule.status === filters.status;
            return searchMatch && dimensionMatch && statusMatch;
        });

        tableBody.innerHTML = '';
        if (rules.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay reglas definidas.</td></tr>';
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
            uiManager.showToast('Regla actualizada.', 'success');
        } else {
            dataManager.addItem(STORAGE_KEY, rule);
            uiManager.showToast('Regla creada.', 'success');
        }

        ruleModal.hide();
        render();
    });

    // --- Abrir Modal ---
    document.getElementById('ruleModal').addEventListener('show.bs.modal', (e) => {
        ruleForm.classList.remove('was-validated');
        ruleForm.reset();
        document.getElementById('rule-id').value = '';

        const button = e.relatedTarget;
        if (button && button.classList.contains('edit-btn')) {
            ruleModalLabel.textContent = 'Editar Regla';
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
            ruleModalLabel.textContent = 'Nueva Regla';
        }
    });

    // --- Eliminación ---
    tableBody.addEventListener('click', (e) => {
        const target = e.target.closest('.delete-btn');
        if (target) {
            const ruleId = target.getAttribute('data-id');
            if (confirm('¿Seguro que quieres eliminar esta regla?')) {
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

    // --- Filtros ---
    const getFilters = () => ({
        search: document.getElementById('search-input').value.toLowerCase().trim(),
        dimension: document.getElementById('dimension-filter').value,
        status: document.getElementById('status-filter').value,
    });

    filterForm.addEventListener('input', renderTable);
    filterForm.addEventListener('reset', () => setTimeout(renderTable, 0));

    // --- Importación/Exportación ---
    importBtn.addEventListener('click', () => importInput.click());

    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(worksheet);

            let newItems = 0;
            json.forEach(item => {
                if (item.asset && item.dimension && item.status && item.score != null) {
                    dataManager.addItem(STORAGE_KEY, { ...item });
                    newItems++;
                }
            });
            uiManager.showToast(`${newItems} reglas importadas.`, 'success');
            render();
        };
        reader.readAsArrayBuffer(file);
        importInput.value = '';
    });

    exportExcelBtn.addEventListener('click', () => {
        const rules = dataManager.getData(STORAGE_KEY);
        const worksheet = XLSX.utils.json_to_sheet(rules.map(r => ({
            asset: r.asset,
            description: r.description,
            dimension: r.dimension,
            status: r.status,
            score: r.score
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Reglas de Calidad');
        XLSX.writeFile(workbook, 'ReglasDeCalidad.xlsx');
    });

    exportPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const rules = dataManager.getData(STORAGE_KEY);

        doc.text("Reglas de Calidad de Datos", 14, 16);
        doc.autoTable({
            head: [['Activo', 'Dimensión', 'Estado', 'Score']],
            body: rules.map(r => [r.asset, r.dimension, r.status, `${r.score}%`]),
            startY: 20,
        });
        doc.save('ReglasDeCalidad.pdf');
    });

    // --- Inicialización ---
    render();
});
