document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const flowForm = document.getElementById('flow-form');
    const flowModal = new bootstrap.Modal(document.getElementById('flowModal'));
    const flowModalLabel = document.getElementById('flowModalLabel');
    const accordionContainer = document.getElementById('flows-accordion');
    const noFlowsMessage = document.getElementById('no-flows-message');

    const STORAGE_KEY = 'metadatos_flujos';

    // --- Renderizado ---
    const renderAccordion = () => {
        const flows = dataManager.getData(STORAGE_KEY);
        accordionContainer.innerHTML = '';

        if (flows.length === 0) {
            noFlowsMessage.classList.remove('d-none');
            return;
        }
        noFlowsMessage.classList.add('d-none');

        flows.forEach((flow, index) => {
            const stepsHtml = flow.steps.split('\n').map(step => `<li>${step}</li>`).join('');
            const item = document.createElement('div');
            item.className = 'accordion-item';
            item.innerHTML = `
                <h2 class="accordion-header" id="heading-${flow.id}">
                    <button class="accordion-button ${index > 0 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${flow.id}" aria-expanded="${index === 0}" aria-controls="collapse-${flow.id}">
                        ${flow.name}
                    </button>
                </h2>
                <div id="collapse-${flow.id}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" aria-labelledby="heading-${flow.id}" data-bs-parent="#flows-accordion">
                    <div class="accordion-body">
                        <p><strong>Descripción:</strong> ${flow.description}</p>
                        <strong>Pasos:</strong>
                        <ul>${stepsHtml}</ul>
                        <hr>
                        <div class="text-end">
                            <button class="btn btn-sm btn-warning edit-btn" data-id="${flow.id}"><i class="bi bi-pencil me-1"></i> Editar</button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${flow.id}"><i class="bi bi-trash me-1"></i> Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
            accordionContainer.appendChild(item);
        });
    };

    // --- Formulario (Crear/Editar) ---
    flowForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!flowForm.checkValidity()) {
            e.stopPropagation();
            flowForm.classList.add('was-validated');
            return;
        }

        const flowId = document.getElementById('flow-id').value;
        const flow = {
            id: flowId ? parseInt(flowId) : null,
            name: document.getElementById('flow-name').value,
            description: document.getElementById('flow-description').value,
            steps: document.getElementById('flow-steps').value,
        };

        if (flow.id) {
            dataManager.updateItem(STORAGE_KEY, flow);
            uiManager.showToast('Flujo actualizado con éxito.', 'success');
        } else {
            dataManager.addItem(STORAGE_KEY, flow);
            uiManager.showToast('Flujo creado con éxito.', 'success');
        }

        flowModal.hide();
        renderAccordion();
    });

    // --- Abrir Modal (Añadir vs Editar) ---
    const openModalForEdit = (flowId) => {
        flowForm.classList.remove('was-validated');
        flowForm.reset();

        const flow = dataManager.getData(STORAGE_KEY).find(f => f.id == flowId);
        if (flow) {
            flowModalLabel.textContent = 'Editar Flujo';
            document.getElementById('flow-id').value = flow.id;
            document.getElementById('flow-name').value = flow.name;
            document.getElementById('flow-description').value = flow.description;
            document.getElementById('flow-steps').value = flow.steps;
        }
        flowModal.show();
    };

    document.getElementById('flowModal').addEventListener('show.bs.modal', (e) => {
        if (!e.relatedTarget || !e.relatedTarget.classList.contains('edit-btn')) {
             flowForm.classList.remove('was-validated');
             flowForm.reset();
             document.getElementById('flow-id').value = '';
             flowModalLabel.textContent = 'Añadir Nuevo Flujo';
        }
    });

    // --- Delegación de eventos para Editar y Eliminar ---
    accordionContainer.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (editBtn) {
            const flowId = editBtn.getAttribute('data-id');
            openModalForEdit(flowId);
        }

        if (deleteBtn) {
            const flowId = deleteBtn.getAttribute('data-id');
            if (confirm('¿Estás seguro de que quieres eliminar este flujo?')) {
                dataManager.deleteItem(STORAGE_KEY, flowId);
                uiManager.showToast('Flujo eliminado.', 'danger');
                renderAccordion();
            }
        }
    });

    // --- Inicialización ---
    renderAccordion();
});
