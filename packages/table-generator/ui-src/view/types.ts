import { TableConfig } from "../../shared-src/messages";

export type ViewSharedProps = {
  onToggleView?: () => void;
  tableConfig: TableConfig;
  setTableConfig: React.Dispatch<React.SetStateAction<TableConfig>>;
  validTableSelected: boolean;
  initializing: boolean;
};
