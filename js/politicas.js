document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const policyForm = document.getElementById('policy-form');
    const policyModal = new bootstrap.Modal(document.getElementById('policyModal'));
    const policyModalLabel = document.getElementById('policyModalLabel');
    const tableBody = document.getElementById('policies-table-body');

    const STORAGE_KEY = 'repositorio_politicas';

    // --- Renderizado ---
    const renderTable = () => {
        const policies = dataManager.getData(STORAGE_KEY);
        tableBody.innerHTML = '';

        if (policies.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay políticas definidas.</td></tr>';
            return;
        }

        policies.forEach(policy => {
            const row = document.createElement('tr');
            const reviewDate = new Date(policy.reviewDate);
            const isOverdue = reviewDate < new Date();
            row.innerHTML = `
                <td>${policy.name}</td>
                <td>${policy.regulation}</td>
                <td>${policy.owner}</td>
                <td>
                    <span class="badge ${isOverdue ? 'bg-danger' : 'bg-success'}">
                        ${reviewDate.toLocaleDateString()}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${policy.id}" data-bs-toggle="tooltip" title="Editar"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${policy.id}" data-bs-toggle="tooltip" title="Eliminar"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        uiManager.initializeTooltips();
    };

    // --- Formulario (Crear/Editar) ---
    policyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!policyForm.checkValidity()) {
            e.stopPropagation();
            policyForm.classList.add('was-validated');
            return;
        }

        const policyId = document.getElementById('policy-id').value;
        const policy = {
            id: policyId ? parseInt(policyId) : null,
            name: document.getElementById('policy-name').value,
            regulation: document.getElementById('policy-regulation').value,
            owner: document.getElementById('policy-owner').value,
            reviewDate: document.getElementById('policy-review-date').value,
        };

        if (policy.id) {
            dataManager.updateItem(STORAGE_KEY, policy);
            uiManager.showToast('Política actualizada con éxito.', 'success');
        } else {
            dataManager.addItem(STORAGE_KEY, policy);
            uiManager.showToast('Política añadida con éxito.', 'success');
        }

        policyModal.hide();
        renderTable();
    });

    // --- Abrir Modal (Añadir vs Editar) ---
    document.getElementById('policyModal').addEventListener('show.bs.modal', (e) => {
        policyForm.classList.remove('was-validated');
        policyForm.reset();
        document.getElementById('policy-id').value = '';

        const button = e.relatedTarget;
        if (button && button.classList.contains('edit-btn')) {
            policyModalLabel.textContent = 'Editar Política';
            const policyId = button.getAttribute('data-id');
            const policy = dataManager.getData(STORAGE_KEY).find(p => p.id == policyId);
            if (policy) {
                document.getElementById('policy-id').value = policy.id;
                document.getElementById('policy-name').value = policy.name;
                document.getElementById('policy-regulation').value = policy.regulation;
                document.getElementById('policy-owner').value = policy.owner;
                document.getElementById('policy-review-date').value = policy.reviewDate;
            }
        } else {
            policyModalLabel.textContent = 'Añadir Nueva Política';
        }
    });

    // --- Eliminación ---
    tableBody.addEventListener('click', (e) => {
        const target = e.target.closest('.delete-btn');
        if (target) {
            const policyId = target.getAttribute('data-id');
            if (confirm('¿Estás seguro de que quieres eliminar esta política?')) {
                dataManager.deleteItem(STORAGE_KEY, policyId);
                uiManager.showToast('Política eliminada.', 'danger');
                renderTable();
            }
        } else if (e.target.closest('.edit-btn')) {
            const editButton = e.target.closest('.edit-btn');
            const modalTrigger = new bootstrap.Modal(document.getElementById('policyModal'));
            document.getElementById('policyModal')._trigger = editButton;
            modalTrigger.show(editButton);
        }
    });

    // --- Inicialización ---
    renderTable();
});
