document.addEventListener('DOMContentLoaded', () => {
    if (typeof go === 'undefined') {
        console.error('GoJS no se ha cargado.');
        document.getElementById('diagram-container').innerHTML = '<div class="alert alert-danger">Error: La librería de gráficos GoJS no se pudo cargar.</div>';
        return;
    }

    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const $ = go.GraphObject.make;
    let myDiagram;

    const STORAGE_KEY_NODES = 'linaje_nodos';
    const STORAGE_KEY_LINKS = 'linaje_enlaces';

    // Elementos del DOM para el panel de detalles
    const detailsPanel = document.getElementById('node-details-panel');
    const detailsNodeName = document.getElementById('details-node-name');
    const detailsNodeType = document.getElementById('details-node-type');
    const addLinkForm = document.getElementById('add-link-form');
    const linkToSelect = document.getElementById('link-to-select');
    const linksInList = document.getElementById('details-links-in');
    const linksOutList = document.getElementById('details-links-out');

    function initDiagram() {
        myDiagram = $(go.Diagram, "diagram-container", {
            "undoManager.isEnabled": true,
            "layout": $(go.LayeredDigraphLayout, { direction: 0, layerSpacing: 100 }),
            "ModelChanged": (e) => {
                if (e.isTransactionFinished) saveDiagram();
            },
            "ChangedSelection": updateDetailsPanel
        });

        // --- Plantillas de Nodos ---
        const getNodeTemplate = (color, icon) => {
            return $(go.Node, "Auto",
                new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
                $(go.Shape, "RoundedRectangle", { fill: color, strokeWidth: 0, stroke: "white" }),
                $(go.Panel, "Horizontal", { margin: 8 },
                    $(go.Picture, { source: `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/${icon}.svg`, width: 16, height: 16, margin: new go.Margin(0, 4, 0, 0), imageStretch: go.GraphObject.Uniform }),
                    $(go.TextBlock, { font: "bold 11pt sans-serif", stroke: "white" }, new go.Binding("text", "text"))
                )
            );
        };
        myDiagram.nodeTemplateMap.add("table", getNodeTemplate("#0d6efd", "table"));
        myDiagram.nodeTemplateMap.add("system", getNodeTemplate("#6c757d", "hdd-stack"));
        myDiagram.nodeTemplateMap.add("etl", getNodeTemplate("#198754", "gear-wide-connected"));
        myDiagram.nodeTemplateMap.add("report", getNodeTemplate("#fd7e14", "bar-chart-line-fill"));

        // --- Plantilla de Enlaces ---
        myDiagram.linkTemplate = $(go.Link, { routing: go.Link.AvoidsNodes, corner: 5, curve: go.Link.JumpOver },
            $(go.Shape, { strokeWidth: 2, stroke: "#6c757d" }),
            $(go.Shape, { toArrow: "Standard", stroke: null, fill: "#6c757d" })
        );

        loadDiagram();
    }

    // --- Cargar y Guardar ---
    function saveDiagram() {
        dataManager.saveData(STORAGE_KEY_NODES, myDiagram.model.nodeDataArray);
        dataManager.saveData(STORAGE_KEY_LINKS, myDiagram.model.linkDataArray);
    }

    function loadDiagram() {
        myDiagram.model = new go.GraphLinksModel(
            dataManager.getData(STORAGE_KEY_NODES),
            dataManager.getData(STORAGE_KEY_LINKS)
        );
    }

    // --- Panel de Detalles ---
    function updateDetailsPanel() {
        const selectedNode = myDiagram.selection.first();
        if (selectedNode === null) {
            detailsPanel.classList.add('d-none');
            return;
        }
        detailsPanel.classList.remove('d-none');

        // Poblar información básica
        detailsNodeName.textContent = selectedNode.data.text;
        detailsNodeType.textContent = selectedNode.data.category || 'default';

        // Poblar dropdown para nuevas conexiones
        linkToSelect.innerHTML = '<option selected disabled value="">Seleccionar destino...</option>';
        myDiagram.nodes.each(node => {
            if (node !== selectedNode) {
                const option = document.createElement('option');
                option.value = node.data.key;
                option.textContent = node.data.text;
                linkToSelect.appendChild(option);
            }
        });

        // Listar conexiones existentes
        linksInList.innerHTML = '';
        selectedNode.findLinksInto().each(link => {
            const li = document.createElement('li');
            li.textContent = link.fromNode.data.text;
            linksInList.appendChild(li);
        });
        if (linksInList.innerHTML === '') linksInList.innerHTML = '<li>Ninguna</li>';

        linksOutList.innerHTML = '';
        selectedNode.findLinksOutOf().each(link => {
            const li = document.createElement('li');
            li.textContent = link.toNode.data.text;
            linksOutList.appendChild(li);
        });
        if (linksOutList.innerHTML === '') linksOutList.innerHTML = '<li>Ninguna</li>';
    }

    addLinkForm.addEventListener('submit', e => {
        e.preventDefault();
        const selectedNode = myDiagram.selection.first();
        const targetKey = linkToSelect.value;

        if (selectedNode && targetKey) {
            myDiagram.model.addLinkData({ from: selectedNode.data.key, to: targetKey });
            updateDetailsPanel(); // Refrescar el panel
        }
    });

    // --- Controles del Formulario ---
    document.getElementById('add-node-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const nodeName = document.getElementById('node-name').value;
        const nodeType = document.getElementById('node-type').value;

        if (nodeName) {
            myDiagram.model.addNodeData({ text: nodeName, category: nodeType });
            document.getElementById('add-node-form').reset();
        }
    });

    // --- Controles de Exportación ---
    document.getElementById('export-jpg-btn').addEventListener('click', () => {
        const img = myDiagram.makeImageData({ scale: 1, background: "white", type: "image/jpeg" });
        const link = document.createElement("a");
        link.href = img;
        link.download = "linaje_de_datos.jpg";
        link.click();
    });

    document.getElementById('export-pdf-btn').addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const imgData = myDiagram.makeImageData({ return_type: "blob", background: "white", scale: 2 });
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result;
            const doc = new jsPDF({ orientation: myDiagram.documentBounds.width > myDiagram.documentBounds.height ? "landscape" : "portrait", unit: "px", format: [myDiagram.documentBounds.width, myDiagram.documentBounds.height] });
            doc.addImage(base64data, 'JPEG', 0, 0, myDiagram.documentBounds.width, myDiagram.documentBounds.height);
            doc.save('linaje_de_datos.pdf');
        }
        reader.readAsDataURL(imgData);
    });

    // --- Inicialización ---
    initDiagram();
});
