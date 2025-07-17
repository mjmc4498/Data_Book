document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const assetForm = document.getElementById('asset-form');
    const assetModal = new bootstrap.Modal(document.getElementById('assetModal'));
    const assetModalLabel = document.getElementById('assetModalLabel');
    const tableBody = document.getElementById('assets-table-body');

    const STORAGE_KEY = 'catalogo_activos';

    // --- Renderizado ---
    const renderTable = () => {
        const assets = dataManager.getData(STORAGE_KEY);
        tableBody.innerHTML = '';

        if (assets.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay activos registrados en el catálogo.</td></tr>';
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
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${asset.id}" data-bs-toggle="tooltip" title="Editar"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${asset.id}" data-bs-toggle="tooltip" title="Eliminar"><i class="bi bi-trash"></i></button>
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
            name: document.getElementById('asset-name').value,
            description: document.getElementById('asset-description').value,
            type: document.getElementById('asset-type').value,
            classification: document.getElementById('asset-classification').value,
            owner: document.getElementById('asset-owner').value,
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

    // --- Eliminación ---
    tableBody.addEventListener('click', (e) => {
        const target = e.target.closest('.delete-btn');
        if (target) {
            const assetId = target.getAttribute('data-id');
            if (confirm('¿Estás seguro de que quieres eliminar este activo del catálogo?')) {
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

    // --- Inicialización ---
    renderTable();
});
