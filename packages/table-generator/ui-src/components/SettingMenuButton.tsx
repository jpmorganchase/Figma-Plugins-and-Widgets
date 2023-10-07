import { Button, FlexLayout } from "@salt-ds/core";
import { CloseSmallIcon, SettingsIcon, SuccessTickIcon } from "@salt-ds/icons";
import { Dropdown, ListItem, ListItemProps } from "@salt-ds/lab";

import "./SettingMenuButton.css";

export type SettingMenuButtonSetting = { label: string; selected: boolean };

export type SettingMenuButtonProps = {
  settings: SettingMenuButtonSetting[];
  onSettingsChanged: (newSettings: SettingMenuButtonSetting[]) => void;
};

const SettingListItem = (props: ListItemProps<SettingMenuButtonSetting>) => {
  const { label, item } = props;

  return (
    <ListItem {...props}>
      <FlexLayout
        align="center"
        justify="space-between"
        style={{ width: "100%" }}
      >
        <label>{label}</label>
        {item && item.selected ? <SuccessTickIcon /> : <CloseSmallIcon />}
      </FlexLayout>
    </ListItem>
  );
};

export const SettingMenuButton = ({
  settings,
  onSettingsChanged,
}: SettingMenuButtonProps) => {
  // Salt Menu Button has bug, simulating using a dropdown
  return (
    <Dropdown
      className="settingMenuButton"
      source={settings}
      onSelectionChange={(_, selectedItem) => {
        if (selectedItem) {
          const newSettings = settings.map((s) => {
            if (s.label === selectedItem.label) {
              return { ...s, selected: !s.selected };
            } else {
              return s;
            }
          });
          onSettingsChanged(newSettings);
        }
      }}
      triggerComponent={
        <Button variant="primary">
          <SettingsIcon />
        </Button>
      }
      itemToString={(item) => (item ? item.label : "")}
      width={28}
      ListItem={SettingListItem}
      ListProps={{ width: 185 }}
      placement="top-start"
      selected={null}
    ></Dropdown>
  );
};
