import * as OBC from "@thatopen/components"
import * as OBF from "@thatopen/components-front"
import * as FRAGS from "@thatopen/fragments"

export class CalculatedVolumeSetter extends OBC.Component {
	static uuid = "78fca208-4cec-4e33-8020-fa15c95cd774" as const
	enabled = false
	
	constructor(components: OBC.Components) {   //Recibe un objeto components y registra la instancia de la clase en dicho objeto
		super(components)
		components.add(CalculatedVolumeSetter .uuid, this)
  }

private _processedElements: Record<string, Set<number>>={ // Registro de elementos procesados para evitar cálculos repetidos.

}

  async compute(world: OBC.World, fragmentIdMap: FRAGS.FragmentIdMap, force=false){
    //Obtiene varias instancias de componentes necesarios como FragmentsManager, IfcPropertiesManager, VolumeMeasurement, y IfcRelationsIndexer
    const fragments=this.components.get(OBC.FragmentsManager)
    const propertiesManager=this.components.get(OBC.IfcPropertiesManager)
    const volumenMeasurement = this.components .get(OBF.VolumeMeasurement)
    const indexer = this.components.get(OBC.IfcRelationsIndexer)
    
    //Itera sobre los fragmentos del modelo y para cada elemento calcula el volumen y actualiza sus propiedades.
    volumenMeasurement.world = world
    for (const fragmentID in fragmentIdMap){
      const fragment = fragments.list.get(fragmentID)//btiene el fragmento y el modelo asociado.
      if(!(fragment&&fragment.group))continue
      const model=fragment.group
      if(!(model.uuid in this._processedElements)){
          this._processedElements[model.uuid]=new Set()   //Inicializa _processedElements para evitar recalcular volúmenes de elementos ya procesados.
      }

      /*Para cada expressID del fragmento:
      Verifica si ya fue procesado a menos que force sea true.
      Obtiene el mapa del fragmento correspondiente al expressID.
      Calcula el volumen usando volumenMeasurement.*/
      const expressIDs=fragmentIdMap[fragmentID]
      for(const expressID of expressIDs){
        if(expressID in this._processedElements[model.uuid] && !force) continue
        const map= model.getFragmentMap([expressID])
        const volumen=volumenMeasurement.getVolumeFromFragments(map)
        const {pset}= await propertiesManager.newPset(model, "CalculatedQuantities") //Crea un nuevo conjunto de propiedades (pset) llamado "CalculatedQuantities"
        const volumeProperty= await propertiesManager.newSingleNumericProperty(model, "IfcReal", "Volumne", volumen) //Crea una nueva propiedad numérica para el volumen y la agrega al pset.

        await propertiesManager.addPropToPset(model, pset.expressID, volumeProperty.expressID)

        await propertiesManager.addElementToPset(model, pset.expressID, expressID)

        const relations = indexer.getEntityRelations(model, expressID, "IsDefinedBy")
        relations?.push(pset.expressID)

        this._processedElements[model.uuid].add(expressID)
      }
    }
  }
}