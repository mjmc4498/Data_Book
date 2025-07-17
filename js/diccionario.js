document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const assetForm = document.getElementById('asset-form');
    const assetModal = new bootstrap.Modal(document.getElementById('assetModal'));
    const assetModalLabel = document.getElementById('assetModalLabel');
    const tableBody = document.getElementById('assets-table-body');
    const filterForm = document.getElementById('filter-form');

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
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay activos registrados o que coincidan con los filtros.</td></tr>';
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

    // --- Inicialización ---
    renderTable();
});
