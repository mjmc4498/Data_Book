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

    const STORAGE_KEY = 'catalogo_activos';

    // --- Renderizado ---
    const renderTable = () => {
        const filters = getFilters();
        let assets = dataManager.getData(STORAGE_KEY);

        assets = assets.filter(asset => {
            const searchMatch = filters.search === '' || asset.name.toLowerCase().includes(filters.search) || asset.description.toLowerCase().includes(filters.search);
            const typeMatch = filters.type === '' || asset.type === filters.type;
            const classificationMatch = filters.classification === '' || asset.classification === filters.classification;
            const ownerMatch = filters.owner === '' || asset.owner.toLowerCase().includes(filters.owner);
            return searchMatch && typeMatch && classificationMatch && ownerMatch;
        });

        tableBody.innerHTML = '';
        if (assets.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay activos que coincidan.</td></tr>';
            return;
        }

        assets.forEach(asset => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><i class="${getIconForType(asset.type)} me-2"></i>${asset.name}</td>
                <td>${asset.description}</td>
                <td><span class="badge bg-secondary">${asset.type}</span></td>
                <td><span class="badge bg-info text-dark">${asset.classification}</span></td>
                <td>${asset.owner}</td>
                <td>
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${asset.id}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${asset.id}"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        uiManager.initializeTooltips();
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'Tabla': return 'bi bi-table';
            case 'Reporte': return 'bi bi-bar-chart-line-fill';
            case 'API': return 'bi bi-plug-fill';
            case 'Archivo': return 'bi bi-file-earmark-text';
            default: return 'bi bi-box-seam';
        }
    };

    // --- Formulario ---
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
            name: document.getElementById('asset-name').value,
            description: document.getElementById('asset-description').value,
            type: document.getElementById('asset-type').value,
            classification: document.getElementById('asset-classification').value,
            owner: document.getElementById('asset-owner').value,
        };
        if (asset.id) dataManager.updateItem(STORAGE_KEY, asset);
        else dataManager.addItem(STORAGE_KEY, asset);
        uiManager.showToast('Activo guardado.', 'success');
        assetModal.hide();
        renderTable();
    });

    // --- Abrir Modal ---
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
                document.getElementById('asset-name').value = asset.name;
                document.getElementById('asset-description').value = asset.description;
                document.getElementById('asset-type').value = asset.type;
                document.getElementById('asset-classification').value = asset.classification;
                document.getElementById('asset-owner').value = asset.owner;
            }
        } else {
            assetModalLabel.textContent = 'Registrar Nuevo Activo';
        }
    });

    // --- Delegación de eventos ---
    tableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        if (editBtn) {
            const modalTrigger = new bootstrap.Modal(document.getElementById('assetModal'));
            document.getElementById('assetModal')._trigger = editBtn;
            modalTrigger.show(editBtn);
        } else if (deleteBtn) {
            const assetId = deleteBtn.getAttribute('data-id');
            if (confirm('¿Seguro que quieres eliminar este activo?')) {
                dataManager.deleteItem(STORAGE_KEY, assetId);
                uiManager.showToast('Activo eliminado.', 'danger');
                renderTable();
            }
        }
    });

    // --- Filtros ---
    const getFilters = () => ({
        search: document.getElementById('search-input').value.toLowerCase().trim(),
        type: document.getElementById('type-filter').value,
        classification: document.getElementById('classification-filter').value,
        owner: document.getElementById('owner-filter').value.toLowerCase().trim()
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
                if (item.name && item.type && item.owner) {
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
        const worksheet = XLSX.utils.json_to_sheet(assets.map(a => ({ name: a.name, description: a.description, type: a.type, classification: a.classification, owner: a.owner })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Catálogo de Activos');
        XLSX.writeFile(workbook, 'CatalogoDeActivos.xlsx');
    });

    exportPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape' });
        const assets = dataManager.getData(STORAGE_KEY);
        doc.text("Catálogo de Activos de Datos", 14, 16);
        doc.autoTable({
            head: [['Nombre', 'Tipo', 'Clasificación', 'Owner']],
            body: assets.map(a => [a.name, a.type, a.classification, a.owner]),
            startY: 20,
        });
        doc.save('CatalogoDeActivos.pdf');
    });

    // --- Inicialización ---
    renderTable();
});
