document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const incidentForm = document.getElementById('incident-form');
    const incidentModal = new bootstrap.Modal(document.getElementById('incidentModal'));
    const incidentModalLabel = document.getElementById('incidentModalLabel');
    const tableBody = document.getElementById('incidents-table-body');

    const STORAGE_KEY = 'gestion_incidentes';

    // --- Renderizado ---
    const renderTable = () => {
        const incidents = dataManager.getData(STORAGE_KEY);
        tableBody.innerHTML = '';

        if (incidents.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay incidentes registrados.</td></tr>';
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
                <td>${new Date(incident.date).toLocaleDateString()}</td>
                <td>${incident.assigned}</td>
                <td>
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${incident.id}" data-bs-toggle="tooltip" title="Editar"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${incident.id}" data-bs-toggle="tooltip" title="Eliminar"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        uiManager.initializeTooltips();
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
            uiManager.showToast('Incidente actualizado con éxito.', 'success');
        } else {
            dataManager.addItem(STORAGE_KEY, incident);
            uiManager.showToast('Incidente registrado con éxito.', 'success');
        }

        incidentModal.hide();
        renderTable();
    });

    // --- Abrir Modal (Añadir vs Editar) ---
    document.getElementById('incidentModal').addEventListener('show.bs.modal', (e) => {
        incidentForm.classList.remove('was-validated');
        incidentForm.reset();
        document.getElementById('incident-id').value = '';
        document.getElementById('incident-date').valueAsDate = new Date(); // Poner fecha actual por defecto

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

    // --- Eliminación ---
    tableBody.addEventListener('click', (e) => {
        const target = e.target.closest('.delete-btn');
        if (target) {
            const incidentId = target.getAttribute('data-id');
            if (confirm('¿Estás seguro de que quieres eliminar este incidente?')) {
                dataManager.deleteItem(STORAGE_KEY, incidentId);
                uiManager.showToast('Incidente eliminado.', 'danger');
                renderTable();
            }
        } else if (e.target.closest('.edit-btn')) {
            const editButton = e.target.closest('.edit-btn');
            const modalTrigger = new bootstrap.Modal(document.getElementById('incidentModal'));
            document.getElementById('incidentModal')._trigger = editButton;
            modalTrigger.show(editButton);
        }
    });

    // --- Inicialización ---
    renderTable();
});
