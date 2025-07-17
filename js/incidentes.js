document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const incidentForm = document.getElementById('incident-form');
    const incidentModal = new bootstrap.Modal(document.getElementById('incidentModal'));
    const incidentModalLabel = document.getElementById('incidentModalLabel');
    const tableBody = document.getElementById('incidents-table-body');
    const filterForm = document.getElementById('filter-form');

    const STORAGE_KEY = 'gestion_incidentes';

    // --- Renderizado ---
    const renderTable = () => {
        const filters = getFilters();
        let incidents = dataManager.getData(STORAGE_KEY);

        incidents = incidents.filter(incident => {
            const searchMatch = filters.search === '' ||
                incident.description.toLowerCase().includes(filters.search) ||
                incident.asset.toLowerCase().includes(filters.search);

            const statusMatch = filters.status === '' || incident.status === filters.status;

            const incidentDate = new Date(incident.date + 'T00:00:00');
            const startDateMatch = !filters.startDate || incidentDate >= filters.startDate;
            const endDateMatch = !filters.endDate || incidentDate <= filters.endDate;

            return searchMatch && statusMatch && startDateMatch && endDateMatch;
        });

        tableBody.innerHTML = '';
        if (incidents.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay incidentes que coincidan.</td></tr>';
            return;
        }

        incidents.forEach(incident => {
            const row = document.createElement('tr');
            const incidentId = `INC-${String(incident.id).slice(-4)}`;
            row.innerHTML = `
                <td>${incidentId}</td>
                <td>${incident.description}</td>
                <td>${incident.asset}</td>
                <td><span class="badge bg-${getStatusColor(incident.status)}">${incident.status}</span></td>
                <td>${new Date(incident.date + 'T00:00:00').toLocaleDateString()}</td>
                <td>${incident.assigned}</td>
                <td>
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${incident.id}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${incident.id}"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Reportado': return 'info';
            case 'En Investigación': return 'warning';
            case 'Solucionado': return 'success';
            case 'Cerrado': return 'secondary';
            default: return 'dark';
        }
    };

    // --- Formulario (Crear/Editar) ---
    incidentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!incidentForm.checkValidity()) {
            e.stopPropagation();
            incidentForm.classList.add('was-validated');
            return;
        }

        const incidentId = document.getElementById('incident-id').value;
        const incident = {
            id: incidentId ? parseInt(incidentId) : null,
            description: document.getElementById('incident-description').value,
            asset: document.getElementById('incident-asset').value,
            assigned: document.getElementById('incident-assigned').value,
            status: document.getElementById('incident-status').value,
            date: document.getElementById('incident-date').value,
        };

        if (incident.id) {
            dataManager.updateItem(STORAGE_KEY, incident);
            uiManager.showToast('Incidente actualizado.', 'success');
        } else {
            dataManager.addItem(STORAGE_KEY, incident);
            uiManager.showToast('Incidente registrado.', 'success');
        }

        incidentModal.hide();
        renderTable();
    });

    // --- Abrir Modal ---
    document.getElementById('incidentModal').addEventListener('show.bs.modal', (e) => {
        incidentForm.classList.remove('was-validated');
        incidentForm.reset();
        document.getElementById('incident-id').value = '';
        document.getElementById('incident-date').valueAsDate = new Date();

        const button = e.relatedTarget;
        if (button && button.classList.contains('edit-btn')) {
            incidentModalLabel.textContent = 'Editar Incidente';
            const incidentId = button.getAttribute('data-id');
            const incident = dataManager.getData(STORAGE_KEY).find(i => i.id == incidentId);
            if (incident) {
                document.getElementById('incident-id').value = incident.id;
                document.getElementById('incident-description').value = incident.description;
                document.getElementById('incident-asset').value = incident.asset;
                document.getElementById('incident-assigned').value = incident.assigned;
                document.getElementById('incident-status').value = incident.status;
                document.getElementById('incident-date').value = incident.date;
            }
        } else {
            incidentModalLabel.textContent = 'Registrar Nuevo Incidente';
        }
    });

    // --- Eliminación y Edición (delegación de eventos) ---
    tableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        if (editBtn) {
            const incidentId = editBtn.getAttribute('data-id');
            // Necesario para pasar el 'relatedTarget' al modal
            const modalTrigger = new bootstrap.Modal(document.getElementById('incidentModal'));
            document.getElementById('incidentModal')._trigger = editBtn;
            modalTrigger.show(editBtn);
        } else if (deleteBtn) {
            const incidentId = deleteBtn.getAttribute('data-id');
            if (confirm('¿Seguro que quieres eliminar este incidente?')) {
                dataManager.deleteItem(STORAGE_KEY, incidentId);
                uiManager.showToast('Incidente eliminado.', 'danger');
                renderTable();
            }
        }
    });

    // --- Filtros ---
    const getFilters = () => ({
        search: document.getElementById('search-input').value.toLowerCase().trim(),
        status: document.getElementById('status-filter').value,
        startDate: document.getElementById('start-date-filter').valueAsDate,
        endDate: document.getElementById('end-date-filter').valueAsDate
    });

    filterForm.addEventListener('input', renderTable);
    filterForm.addEventListener('reset', () => setTimeout(renderTable, 0));

    // --- Inicialización ---
    renderTable();
});
