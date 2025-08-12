import { Grip } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
interface OptionProps { id?: string; content: string; style: string }
export const Option = ({ id, content, style }: OptionProps)  => {
    const {attributes,
    listeners,
    setNodeRef,
    transform,
    transition,} =useSortable({id})

    const optionStyle= {
  transition,
  transform: CSS.Transform.toString(transform)
    }
  return (
    <span
    ref={setNodeRef}
    {...attributes}
    {...listeners}
    style={optionStyle}
      key={id}
      className={style}
    >
      <Grip className="text-md"/>
      {content}
    </span>
  );
};
