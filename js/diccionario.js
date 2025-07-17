document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const assetForm = document.getElementById('asset-form');
    const assetModal = new bootstrap.Modal(document.getElementById('assetModal'));
    const assetModalLabel = document.getElementById('assetModalLabel');
    const tableBody = document.getElementById('assets-table-body');
    const filterForm = document.getElementById('filter-form');

    // Botones
    const importBtn = document.getElementById('import-excel-btn');
    const importInput = document.getElementById('import-excel-input');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    const STORAGE_KEY = 'diccionario_activos';

    // --- Renderizado ---
    const renderTable = () => {
        const filters = getFilters();
        let assets = dataManager.getData(STORAGE_KEY);

        assets = assets.filter(asset => {
            const searchMatch = (asset.table.toLowerCase().includes(filters.search) || asset.field.toLowerCase().includes(filters.search));
            const systemMatch = (filters.system === '' || asset.system === filters.system);
            const typeMatch = (filters.type === '' || asset.type === filters.type);
            return searchMatch && systemMatch && typeMatch;
        });

        tableBody.innerHTML = '';
        if (assets.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay activos registrados.</td></tr>';
            return;
        }

        assets.forEach(asset => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${asset.system}</td>
                <td>${asset.table}</td>
                <td>${asset.field}</td>
                <td><span class="badge bg-secondary">${asset.type}</span></td>
                <td>${asset.businessTerm || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${asset.id}" data-bs-toggle="tooltip" title="Editar"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${asset.id}" data-bs-toggle="tooltip" title="Eliminar"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        uiManager.initializeTooltips();
    };

    // --- Formulario (Crear/Editar) ---
    assetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!assetForm.checkValidity()) {
            e.stopPropagation();
            assetForm.classList.add('was-validated');
            return;
        }

        const assetId = document.getElementById('asset-id').value;
        const asset = {
            id: assetId ? parseInt(assetId) : null,
            system: document.getElementById('asset-system').value,
            table: document.getElementById('asset-table').value,
            field: document.getElementById('asset-field').value,
            type: document.getElementById('asset-type').value,
            businessTerm: document.getElementById('asset-business-term').value,
        };

        if (asset.id) {
            dataManager.updateItem(STORAGE_KEY, asset);
            uiManager.showToast('Activo actualizado con éxito.', 'success');
        } else {
            dataManager.addItem(STORAGE_KEY, asset);
            uiManager.showToast('Activo registrado con éxito.', 'success');
        }

        assetModal.hide();
        renderTable();
    });

    // --- Abrir Modal (Añadir vs Editar) ---
    document.getElementById('assetModal').addEventListener('show.bs.modal', (e) => {
        assetForm.classList.remove('was-validated');
        assetForm.reset();
        document.getElementById('asset-id').value = '';

        const button = e.relatedTarget;
        if (button && button.classList.contains('edit-btn')) {
            assetModalLabel.textContent = 'Editar Activo';
            const assetId = button.getAttribute('data-id');
            const asset = dataManager.getData(STORAGE_KEY).find(a => a.id == assetId);
            if (asset) {
                document.getElementById('asset-id').value = asset.id;
                document.getElementById('asset-system').value = asset.system;
                document.getElementById('asset-table').value = asset.table;
                document.getElementById('asset-field').value = asset.field;
                document.getElementById('asset-type').value = asset.type;
                document.getElementById('asset-business-term').value = asset.businessTerm;
            }
        } else {
            assetModalLabel.textContent = 'Registrar Nuevo Activo';
        }
    });

    // --- Eliminación ---
    tableBody.addEventListener('click', (e) => {
        const target = e.target.closest('.delete-btn');
        if (target) {
            const assetId = target.getAttribute('data-id');
            if (confirm('¿Estás seguro de que quieres eliminar este activo?')) {
                dataManager.deleteItem(STORAGE_KEY, assetId);
                uiManager.showToast('Activo eliminado.', 'danger');
                renderTable();
            }
        } else if (e.target.closest('.edit-btn')) {
            const editButton = e.target.closest('.edit-btn');
            const modalTrigger = new bootstrap.Modal(document.getElementById('assetModal'));
            document.getElementById('assetModal')._trigger = editButton;
            modalTrigger.show(editButton);
        }
    });

    // --- Filtros ---
    const getFilters = () => ({
        search: document.getElementById('search-input').value.toLowerCase().trim(),
        system: document.getElementById('system-filter').value,
        type: document.getElementById('type-filter').value
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
                if (item.system && item.table && item.field && item.type) {
                    dataManager.addItem(STORAGE_KEY, { ...item });
                    newItems++;
                }
            });
            uiManager.showToast(`${newItems} activos importados.`, 'success');
            renderTable();
        };
        reader.readAsArrayBuffer(file);
        importInput.value = '';
    });

    exportExcelBtn.addEventListener('click', () => {
        const assets = dataManager.getData(STORAGE_KEY);
        const worksheet = XLSX.utils.json_to_sheet(assets.map(a => ({
            system: a.system,
            table: a.table,
            field: a.field,
            type: a.type,
            businessTerm: a.businessTerm
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Diccionario');
        XLSX.writeFile(workbook, 'DiccionarioDeDatos.xlsx');
    });

    exportPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape' });
        const assets = dataManager.getData(STORAGE_KEY);

        doc.text("Diccionario de Datos", 14, 16);
        doc.autoTable({
            head: [['Sistema', 'Tabla', 'Campo', 'Tipo', 'Término de Negocio']],
            body: assets.map(a => [a.system, a.table, a.field, a.type, a.businessTerm || '']),
            startY: 20,
        });
        doc.save('DiccionarioDeDatos.pdf');
    });

    // --- Inicialización ---
    renderTable();
});
