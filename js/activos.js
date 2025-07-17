document.addEventListener('DOMContentLoaded', () => {
    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const assetsContainer = document.getElementById('assets-container');
    const filterForm = document.getElementById('filter-form');
    const noResultsMessage = document.getElementById('no-results-message');
    const resultsCount = document.getElementById('results-count');

    // --- Simulación de fuentes de datos ---
    const getUnifiedAssets = () => {
        const assets = [];

        // 1. Activos desde el Diccionario de Datos (Tablas)
        const dictionaryAssets = dataManager.getData('diccionario_activos');
        dictionaryAssets.forEach(da => {
            assets.push({
                type: 'Tabla',
                name: `${da.system}.${da.table}.${da.field}`,
                description: `Campo del diccionario de datos. Tipo: ${da.type}.`,
                classification: 'Confidencial', // Simulación
                owner: 'Equipo de Datos', // Simulación
            });
        });

        // 2. Activos simulados (Reportes y APIs)
        const simulatedAssets = [
            { type: 'Reporte', name: 'Ventas Q3 2023', description: 'Reporte de Power BI sobre las ventas del tercer trimestre.', classification: 'Interno', owner: 'Ana Gómez' },
            { type: 'Reporte', name: 'Análisis de Carrito Abandonado', description: 'Dashboard en Tableau.', classification: 'Interno', owner: 'Carlos Ruiz' },
            { type: 'API', name: 'API de Clientes', description: 'API REST para obtener y actualizar datos de clientes.', classification: 'Confidencial', owner: 'Equipo de Desarrollo' },
             { type: 'Tabla', name: 'MARKETING.CAMPAÑAS', description: 'Tabla de campañas de marketing.', classification: 'Interno', owner: 'Equipo de Marketing' },
        ];

        return assets.concat(simulatedAssets);
    };

    // --- Renderizado ---
    const renderAssets = () => {
        const filters = getFilters();
        let allAssets = getUnifiedAssets();

        const filteredAssets = allAssets.filter(asset => {
            const searchMatch = filters.search === '' ||
                asset.name.toLowerCase().includes(filters.search) ||
                asset.description.toLowerCase().includes(filters.search);

            const typeMatch = filters.types.length === 0 || filters.types.includes(asset.type);

            const classificationMatch = filters.classifications.length === 0 || filters.classifications.includes(asset.classification);

            return searchMatch && typeMatch && classificationMatch;
        });

        assetsContainer.innerHTML = '';
        resultsCount.textContent = `Mostrando ${filteredAssets.length} activos`;

        if (filteredAssets.length === 0) {
            noResultsMessage.classList.remove('d-none');
            return;
        }

        noResultsMessage.classList.add('d-none');

        filteredAssets.forEach(asset => {
            const card = document.createElement('div');
            card.className = 'card mb-3';
            card.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">
                        <i class="${getIconForType(asset.type)} me-2"></i>
                        ${asset.name}
                    </h5>
                    <p class="card-text">${asset.description}</p>
                    <span class="badge bg-secondary">${asset.type}</span>
                    <span class="badge bg-info text-dark">${asset.classification}</span>
                    <p class="mt-2 mb-0"><strong>Owner:</strong> ${asset.owner}</p>
                </div>
            `;
            assetsContainer.appendChild(card);
        });
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'Tabla': return 'bi bi-table';
            case 'Reporte': return 'bi bi-bar-chart-line-fill';
            case 'API': return 'bi bi-plug-fill';
            default: return 'bi bi-box-seam';
        }
    };

    // --- Lógica de Filtros ---
    const getFilters = () => {
        const search = document.getElementById('search-input').value.toLowerCase().trim();

        const types = Array.from(document.querySelectorAll('#asset-type-filter input:checked')).map(el => el.value);

        const classifications = Array.from(document.querySelectorAll('#classification-filter input:checked')).map(el => el.value);

        return { search, types, classifications };
    };

    filterForm.addEventListener('input', renderAssets);
    filterForm.addEventListener('reset', () => setTimeout(renderAssets, 0));


    // --- Inicialización ---
    renderAssets();
});
