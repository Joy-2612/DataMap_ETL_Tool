import { IoMdAddCircleOutline } from "react-icons/io";
import { PiApproximateEqualsBold } from "react-icons/pi";
import { MdOutlineVerticalSplit } from "react-icons/md";
import { FaCodeMerge } from "react-icons/fa6";
import SidebarConcatenate from "../SidebarActions/SidebarConcatenate";
import SidebarSplit from "../SidebarActions/SidebarSplit";
import SidebarStandardize from "../SidebarActions/SidebarStandardize";
import SidebarMerge from "../SidebarActions/SidebarMerge";

export const actionOptions = [
  {
    id: "concatenate",
    name: "Concatenate",
    color: "#22C55E",
    component: SidebarConcatenate,
    icon: <IoMdAddCircleOutline />,
    description: "Combine multiple datasets vertically",
  },
  {
    id: "split",
    name: "Split",
    color: "#EC4899",
    component: SidebarSplit,
    icon: <MdOutlineVerticalSplit />,
    description: "Divide dataset by columns or conditions",
  },
  {
    id: "merge",
    name: "Merge",
    color: "#3B82F6",
    component: SidebarMerge,
    icon: <FaCodeMerge />,
    description: "Join datasets using common keys",
  },
  {
    id: "standardize",
    name: "Standardize",
    color: "#F97316",
    component: SidebarStandardize,
    icon: <PiApproximateEqualsBold />,
    description: "Normalize data formats and values",
  },
];