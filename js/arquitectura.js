document.addEventListener('DOMContentLoaded', () => {
    // Verificar que GoJS está cargado
    if (typeof go === 'undefined') {
        console.error('GoJS no se ha cargado.');
        document.getElementById('diagram-container').innerHTML =
            '<div class="alert alert-danger">Error: La librería de gráficos GoJS no se pudo cargar.</div>';
        return;
    }

    const dataManager = window.parent.dataManager;
    const uiManager = window.parent.uiManager;
    const $ = go.GraphObject.make;
    let myDiagram;

    const STORAGE_KEY_NODES = 'linaje_nodos';
    const STORAGE_KEY_LINKS = 'linaje_enlaces';

    function initDiagram() {
        myDiagram = $(go.Diagram, "diagram-container", {
            "undoManager.isEnabled": true,
            "layout": $(go.LayeredDigraphLayout, { direction: 0, layerSpacing: 100 }),
            "ModelChanged": (e) => {
                if (e.isTransactionFinished) {
                    saveDiagram();
                }
            }
        });

        // --- Plantillas de Nodos ---
        const getNodeTemplate = (type, color, icon) => {
            return $(go.Node, "Auto",
                {
                    locationSpot: go.Spot.Center,
                    fromSpot: go.Spot.AllSides,
                    toSpot: go.Spot.AllSides,
                },
                new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
                $(go.Shape, "RoundedRectangle", { fill: color, strokeWidth: 0 }),
                $(go.Panel, "Horizontal", { margin: 8 },
                    $(go.Picture, {
                        source: `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/${icon}.svg`,
                        width: 16, height: 16,
                        margin: new go.Margin(0, 4, 0, 0),
                        imageStretch: go.GraphObject.Uniform
                    }),
                    $(go.TextBlock, { font: "bold 11pt sans-serif", stroke: "white" },
                        new go.Binding("text", "text"))
                )
            );
        };

        const templates = {
            "table": getNodeTemplate("table", "#0d6efd", "table"),
            "system": getNodeTemplate("system", "#6c757d", "hdd-stack"),
            "etl": getNodeTemplate("etl", "#198754", "gear-wide-connected"),
            "report": getNodeTemplate("report", "#fd7e14", "bar-chart-line-fill")
        };

        myDiagram.nodeTemplateMap = new go.Map(Object.entries(templates));

        // --- Plantilla de Enlaces ---
        myDiagram.linkTemplate =
            $(go.Link, {
                routing: go.Link.AvoidsNodes,
                corner: 5,
                curve: go.Link.JumpOver
            },
            $(go.Shape, { strokeWidth: 2, stroke: "#6c757d" }),
            $(go.Shape, { toArrow: "Standard", stroke: null, fill: "#6c757d" })
        );

        loadDiagram();
    }

    // --- Cargar y Guardar ---
    function saveDiagram() {
        const nodeData = myDiagram.model.nodeDataArray;
        const linkData = myDiagram.model.linkDataArray;
        dataManager.saveData(STORAGE_KEY_NODES, nodeData);
        dataManager.saveData(STORAGE_KEY_LINKS, linkData);
    }

    function loadDiagram() {
        const nodeData = dataManager.getData(STORAGE_KEY_NODES);
        const linkData = dataManager.getData(STORAGE_KEY_LINKS);
        myDiagram.model = new go.GraphLinksModel(nodeData, linkData);
    }

    // --- Controles del Formulario ---
    const addNodeForm = document.getElementById('add-node-form');
    addNodeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nodeName = document.getElementById('node-name').value;
        const nodeType = document.getElementById('node-type').value;

        if (nodeName) {
            myDiagram.model.addNodeData({
                text: nodeName,
                category: nodeType
            });
            addNodeForm.reset();
        }
    });

    // --- Controles de Exportación ---
    const exportJpgBtn = document.getElementById('export-jpg-btn');
    exportJpgBtn.addEventListener('click', () => {
        const img = myDiagram.makeImageData({
            scale: 1,
            background: "white",
            type: "image/jpeg"
        });
        const link = document.createElement("a");
        link.href = img;
        link.download = "linaje_de_datos.jpg";
        link.click();
    });

    const exportPdfBtn = document.getElementById('export-pdf-btn');
    exportPdfBtn.addEventListener('click', () => {
         const { jsPDF } = window.jspdf;
         const imgData = myDiagram.makeImageData({ return_type: "blob", background: "white", scale: 2 });

         const reader = new FileReader();
         reader.onloadend = () => {
             const base64data = reader.result;
             const doc = new jsPDF({
                 orientation: myDiagram.documentBounds.width > myDiagram.documentBounds.height ? "landscape" : "portrait",
                 unit: "px",
                 format: [myDiagram.documentBounds.width, myDiagram.documentBounds.height]
             });
             doc.addImage(base64data, 'JPEG', 0, 0, myDiagram.documentBounds.width, myDiagram.documentBounds.height);
             doc.save('linaje_de_datos.pdf');
         }
         reader.readAsDataURL(imgData);
    });

    // --- Inicialización ---
    initDiagram();
});
