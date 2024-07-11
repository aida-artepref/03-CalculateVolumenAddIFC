import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/fragments";
import * as BUI from '@thatopen/ui';

// Función para crear y exportar el componente de dropdown de modelos
export function createModelsDropdown(components: OBC.Components) {
    // Obtener instancias necesarias de componentes
    const fragmentsManager = components.get(OBC.FragmentsManager);
    const ifcPropertiesManager = components.get(OBC.IfcPropertiesManager);

    // Variable para almacenar el ID del modelo seleccionado
    let modelID: string | null = null;

    // Función para manejar la descarga del modelo seleccionado
    const onDownloadModel = async () => {
        // Verificar si hay un modelo seleccionado
        if (!modelID) return;

        // Obtener el modelo desde FragmentsManager
        const model = fragmentsManager.groups.get(modelID);

        // Verificar si se encontró el modelo
        if (!model) {
            console.error(`Model with ID ${modelID} not found.`);
            return;
        }

        try {
            // Guardar los cambios del modelo en un nuevo archivo IFC
            const newIfcBuffer = await ifcPropertiesManager.saveToIfc(model, model.data);

            // Crear un nuevo Blob a partir del nuevo buffer IFC y el tipo de archivo
            const blob = new Blob([newIfcBuffer], { type: 'application/ifc' });

            // Crear un objeto URL para el Blob
            const url = URL.createObjectURL(blob);

            // Crear un enlace <a> para descargar el archivo
            const a = document.createElement('a');
            a.href = url;
            a.download = `model_${modelID}.ifc`; // Nombre de archivo sugerido, ajustar según necesidades

            // Simular un clic en el enlace para descargar el archivo
            a.click();

            // Liberar el objeto URL creado
            URL.revokeObjectURL(url);

            console.log(`Model with ID ${modelID} exported and downloaded successfully.`);
        } catch (error) {
            console.error(`Error exporting and downloading model: ${error}`);
        }
    };

    // Función para manejar el cambio en el input de archivo IFC
    const onIfcFileChange = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const ifcFile = input.files[0];
        try {
            // Leer el archivo IFC como ArrayBuffer
            const arrayBuffer = await ifcFile.arrayBuffer();

            // Convertir el ArrayBuffer a Uint8Array y guardar usando IfcPropertiesManager.saveToIfc()
            const uint8Array = new Uint8Array(arrayBuffer);

            // Crear un objeto FragmentsGroup válido
            const fragmentsGroup = new OBF.FragmentsGroup();
            fragmentsGroup.data = new Map<number, [number[], number[]]>(); // Ajustar según la estructura requerida
            fragmentsGroup.items = []; // Ajustar según la estructura requerida

            // Guardar el archivo IFC usando el objeto FragmentsGroup
            const newIfcBuffer = await ifcPropertiesManager.saveToIfc(fragmentsGroup, uint8Array);

            // Crear un nuevo Blob a partir del nuevo buffer IFC y el tipo de archivo
            const newIfcBlob = new Blob([newIfcBuffer], { type: 'application/ifc' });

            // Crear un objeto URL para el Blob
            const url = URL.createObjectURL(newIfcBlob);

            // Crear un enlace <a> para descargar el archivo
            const a = document.createElement('a');
            a.href = url;
            a.download = ifcFile.name; // Nombre de archivo original, ajustar según necesidades

            // Simular un clic en el enlace para descargar el archivo
            a.click();

            // Liberar el objeto URL creado
            URL.revokeObjectURL(url);

            console.log(`IFC file '${ifcFile.name}' processed and downloaded successfully.`);
        } catch (error) {
            console.error(`Error processing or downloading IFC file: ${error}`);
        }
    };

    // Retornar el elemento de interfaz de usuario para mostrar en la aplicación
    return BUI.html`
        <div>
            <label>Select Model:</label>
            <select @change=${(event: Event) => {
                const target = event.target as HTMLSelectElement;
                modelID = target.value;
            }}>
                ${Array.from(fragmentsManager.groups).map(([id, group]) => BUI.html`<option value=${id}>${group.name}</option>`)}
            </select>
            <button @click=${onDownloadModel}>Export to IFC</button>

            <!-- Input para seleccionar archivo IFC -->
            <input type="file" accept=".ifc" style="display: none;" id="ifcFileInput" @change=${onIfcFileChange}>
            <label for="ifcFileInput" style="cursor: pointer;">Select IFC File</label>
        </div>
    `;
}
