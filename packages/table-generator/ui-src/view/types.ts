import { TableConfig } from "../../shared-src";

export type ViewSharedProps = {
  onToggleView?: () => void;
  tableConfig: TableConfig;
  setTableConfig: React.Dispatch<React.SetStateAction<TableConfig>>;
  validTableSelected: boolean;
  initializing: boolean;
};
