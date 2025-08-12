import {KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import {arrayMove, sortableKeyboardCoordinates} from "@dnd-kit/sortable";

const getOptionCardPos = (id: string, items:any) => {
    return items.findIndex((item) => item.id === id);
  }

export const handleDragEnd = (e: any, state:any, setState:any) => {
    const { active, over } = e;
    if(active.id === over.id){
        return
    }
    else{
        setState((state) =>{
           const originalPos = getOptionCardPos(active.id, state)
           const finalPos = getOptionCardPos(over.id, state)

           return arrayMove(state, originalPos, finalPos)
        })
    }
  };
export const sensorHook =()=>{
    const sensors=useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter : sortableKeyboardCoordinates,
    })
  )
    return sensors;
}

